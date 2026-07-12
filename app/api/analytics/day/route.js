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
    const dayName = searchParams.get('day');
    
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const activeProfile = getActiveProfile(userId);
    const profileId = activeProfile?.id || 1;
    
    const dayMap = {
      'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 0
    };
    const dayNumber = dayMap[dayName];
    
    // همه تریدهای اون روز هفته
    const trades = db.prepare(`
      SELECT profit, date FROM trades 
      WHERE user_id = ? AND profile_id = ? AND cast(strftime('%w', date) as integer) = ?
    `).all(userId, profileId, dayNumber);
    
    const totalProfit = trades.reduce((s, t) => s + (t.profit || 0), 0);
    const avgProfit = trades.length > 0 ? totalProfit / trades.length : 0;
    const winningTrades = trades.filter(t => t.profit > 0).length;
    const winRate = trades.length > 0 ? (winningTrades / trades.length * 100).toFixed(1) : 0;
    
    // میانگین mental/sleep/stress
    const mental = db.prepare(`
      SELECT AVG(d.mental) as avgMental, AVG(d.sleep) as avgSleep, AVG(d.stress) as avgStress
      FROM trades t
      JOIN daily_assessments d ON d.date = t.date AND d.user_id = t.user_id AND d.profile_id = t.profile_id
      WHERE t.user_id = ? AND t.profile_id = ? AND cast(strftime('%w', t.date) as integer) = ?
    `).get(userId, profileId, dayNumber);
    
    return NextResponse.json({
      avgProfit: avgProfit,
      tradeCount: trades.length,
      winRate: winRate,
      mental: mental ? {
        avgMental: mental.avgMental?.toFixed(1) || 0,
        avgSleep: mental.avgSleep?.toFixed(1) || 0,
        avgStress: mental.avgStress?.toFixed(1) || 0
      } : null
    });
  } catch (error) {
    console.error('Day analytics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}