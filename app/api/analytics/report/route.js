import { db, getActiveProfile } from '@/database/sqlite';
import { NextResponse } from 'next/server';

// تابع کمکی برای گرفتن userId از هدر
function getUserIdFromRequest(request) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return null;
  return parseInt(userId);
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all';
    
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const activeProfile = getActiveProfile(userId);
    const profileId = activeProfile?.id || 1;
    
    console.log('========== ANALYTICS API CALL ==========');
    console.log('Period:', period);
    console.log('User ID:', userId);
    console.log('Profile ID:', profileId);
    
    // ========== محاسبه تاریخ شروع بر اساس دوره ==========
    const today = new Date();
    let startDate = null;
    
    if (period === 'weekly') {
      const currentDay = today.getDay();
      const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
      const monday = new Date(today);
      monday.setDate(today.getDate() - daysToMonday);
      startDate = monday.toISOString().split('T')[0];
    } 
    else if (period === 'monthly') {
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      startDate = firstOfMonth.toISOString().split('T')[0];
    }
    
    console.log('StartDate:', startDate || 'ALL TIME');
    
    // ========== گرفتن تریدها با فیلتر profile_id ==========
    let trades;
    if (startDate) {
      trades = db.prepare(`
        SELECT * FROM trades 
        WHERE user_id = ? AND profile_id = ? AND date >= ?
        ORDER BY date
      `).all(userId, profileId, startDate);
    } else {
      trades = db.prepare(`
        SELECT * FROM trades 
        WHERE user_id = ? AND profile_id = ?
        ORDER BY date
      `).all(userId, profileId);
    }
    
    console.log('Trades count:', trades.length);
    
    // ========== اگر تریدی وجود نداشت ==========
    if (trades.length === 0) {
      return NextResponse.json({
        trades: [],
        summary: {
          totalTrades: 0,
          totalProfit: 0,
          winRate: 0,
          avgProfit: 0,
          maxConsecutiveWins: 0,
          maxConsecutiveLosses: 0,
          profitFactor: "0",
          recoveryFactor: "0"
        },
        bestDay: null,
        worstDay: null,
        mentalCorrelation: [],
        sessionMentalCorrelation: [],
        sessionStats: [],
        rulesAdherence: { rate: 0, totalTrades: 0 }
      });
    }
    
    // ========== آمار کلی ==========
    const totalProfit = trades.reduce((s, t) => s + (t.profit || 0), 0);
    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => t.profit > 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades * 100).toFixed(1) : 0;
    
    // ========== بیشترین برد و باخت متوالی ==========
    let maxConsecutiveWins = 0, maxConsecutiveLosses = 0;
    let currentWins = 0, currentLosses = 0;
    
    for (const trade of trades) {
      if (trade.profit > 0) {
        currentWins++;
        currentLosses = 0;
        if (currentWins > maxConsecutiveWins) maxConsecutiveWins = currentWins;
      } else if (trade.profit < 0) {
        currentLosses++;
        currentWins = 0;
        if (currentLosses > maxConsecutiveLosses) maxConsecutiveLosses = currentLosses;
      } else {
        currentWins = 0;
        currentLosses = 0;
      }
    }
    
    // ========== بهترین و بدترین روز ==========
    const dailyMap = new Map();
    for (const trade of trades) {
      const date = trade.date;
      const profit = trade.profit || 0;
      const profitUsd = trade.profit_usd || 0;
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { profit: 0, profitUsd: 0, tradeCount: 0 });
      }
      const entry = dailyMap.get(date);
      entry.profit += profit;
      entry.profitUsd += profitUsd;
      entry.tradeCount++;
    }
    
    const dailyArray = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      profit: parseFloat(data.profit.toFixed(2)),
      profitUsd: parseFloat(data.profitUsd.toFixed(2)),
      tradeCount: data.tradeCount
    }));
    
    const sortedByProfit = [...dailyArray].sort((a, b) => b.profit - a.profit);
    const sortedByLoss = [...dailyArray].sort((a, b) => a.profit - b.profit);
    
    const bestDay = sortedByProfit.find(d => d.profit > 0) || null;
    const worstDay = sortedByLoss.find(d => d.profit < 0) || null;
    
    // ========== Profit Factor ==========
    const grossProfit = trades.filter(t => t.profit > 0).reduce((s, t) => s + t.profit, 0);
    const grossLoss = Math.abs(trades.filter(t => t.profit < 0).reduce((s, t) => s + t.profit, 0));
    const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : grossProfit > 0 ? "∞" : "0";
    
    // ========== Recovery Factor ==========
    let maxDrawdown = 0;
    let peak = 0;
    let cumulative = 0;
    const sortedTrades = [...trades].sort((a, b) => a.date.localeCompare(b.date));
    for (const trade of sortedTrades) {
      cumulative += trade.profit || 0;
      if (cumulative > peak) peak = cumulative;
      const drawdown = peak - cumulative;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
    let recoveryFactor = "—";
    if (totalProfit > 0 && maxDrawdown > 0) {
      recoveryFactor = (totalProfit / maxDrawdown).toFixed(2);
    } else if (totalProfit > 0 && maxDrawdown === 0) {
      recoveryFactor = "∞";
    }
    
    // ========== همبستگی ذهنی ==========
    const mentalCorrelation = db.prepare(`
      SELECT 
        CASE 
          WHEN d.mental <= 3 THEN 'کم (1-3)'
          WHEN d.mental <= 6 THEN 'متوسط (4-6)'
          ELSE 'بالا (7-10)'
        END as mentalLevel,
        AVG(t.profit) as avgProfit,
        COUNT(t.id) as tradeCount,
        SUM(CASE WHEN t.profit > 0 THEN 1 ELSE 0 END) * 1.0 / COUNT(t.id) as winRate
      FROM trades t
      JOIN daily_assessments d ON d.date = t.date AND d.user_id = t.user_id AND d.profile_id = t.profile_id
      WHERE t.user_id = ? AND t.profile_id = ?
      ${startDate ? `AND t.date >= '${startDate}'` : ''}
      GROUP BY mentalLevel
    `).all(userId, profileId);
    
    // ========== آمار سشن‌ها ==========
    const sessionStats = db.prepare(`
      SELECT 
        session,
        COUNT(*) as tradeCount,
        SUM(profit) as totalProfit,
        SUM(profit_usd) as totalProfitUsd,
        AVG(profit) as avgProfit,
        SUM(CASE WHEN profit > 0 THEN 1 ELSE 0 END) * 1.0 / COUNT(*) as winRate
      FROM trades
      WHERE user_id = ? AND profile_id = ? AND session IS NOT NULL
      ${startDate ? `AND date >= '${startDate}'` : ''}
      GROUP BY session
      ORDER BY totalProfit DESC
    `).all(userId, profileId);
    
    // ========== همبستگی سشن و وضعیت ذهنی ==========
    const sessionMentalCorrelation = db.prepare(`
      SELECT 
        t.session,
        AVG(d.mental) as avgMental,
        AVG(t.profit) as avgProfit,
        COUNT(t.id) as tradeCount
      FROM trades t
      JOIN daily_assessments d ON d.date = t.date AND d.user_id = t.user_id AND d.profile_id = t.profile_id
      WHERE t.user_id = ? AND t.profile_id = ? AND t.session IS NOT NULL
      ${startDate ? `AND t.date >= '${startDate}'` : ''}
      GROUP BY t.session
    `).all(userId, profileId);
    
    // ========== پایبندی به قوانین ==========
    const rulesStats = db.prepare(`
      SELECT 
        SUM(CASE WHEN rules_adhered = 1 THEN 1 ELSE 0 END) * 1.0 / COUNT(*) as adherenceRate,
        COUNT(*) as totalTrades
      FROM trades
      WHERE user_id = ? AND profile_id = ?
      ${startDate ? `AND date >= '${startDate}'` : ''}
    `).get(userId, profileId);
    
    const rulesAdherence = {
      rate: rulesStats && rulesStats.totalTrades > 0 ? (rulesStats.adherenceRate * 100).toFixed(1) : 0,
      totalTrades: rulesStats ? rulesStats.totalTrades : 0
    };
    
    return NextResponse.json({
      trades,
      summary: {
        totalTrades,
        totalProfit: totalProfit || 0,
        winRate,
        avgProfit: totalTrades > 0 ? (totalProfit / totalTrades).toFixed(2) : 0,
        maxConsecutiveWins,
        maxConsecutiveLosses,
        profitFactor,
        recoveryFactor
      },
      bestDay,
      worstDay,
      mentalCorrelation,
      sessionMentalCorrelation,
      sessionStats,
      rulesAdherence
    });
    
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}