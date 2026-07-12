import { db, getActiveProfile } from '@/database/sqlite';
import { NextResponse } from 'next/server';

function toLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMonday(date, weekOffset = 0) {
  const d = new Date(date);
  const day = d.getDay();
  const daysToMonday = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - daysToMonday + (weekOffset * 7));
  d.setHours(0, 0, 0, 0);
  return d;
}

// تابع کمکی برای گرفتن userId از هدر
function getUserIdFromRequest(request) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return null;
  return parseInt(userId);
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const weekOffset = parseInt(searchParams.get('weekOffset')) || 0;
    
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const activeProfile = getActiveProfile(userId);
    const profileId = activeProfile?.id || 1;
    
    const today = new Date();
    const targetMonday = getMonday(today, weekOffset);
    const targetSunday = new Date(targetMonday);
    targetSunday.setDate(targetMonday.getDate() + 6);
    targetSunday.setHours(23, 59, 59, 999);
    
    const startDate = toLocalDateString(targetMonday);
    const endDate = toLocalDateString(targetSunday);
    
    console.log(`📅 هفته ${weekOffset}: ${startDate} تا ${endDate} (User: ${userId}, Profile: ${profileId})`);
    
    // تریدهای این هفته
    const weekTrades = db.prepare(`
      SELECT date, profit, profit_usd, trade_number, symbol, side, risk, rr, trade_type
      FROM trades 
      WHERE user_id = ? AND profile_id = ? AND date BETWEEN ? AND ?
      ORDER BY date ASC
    `).all(userId, profileId, startDate, endDate);
    
    // سنجش‌های این هفته
    const weekAssessments = db.prepare(`
      SELECT date, mental, sleep, stress
      FROM daily_assessments 
      WHERE user_id = ? AND profile_id = ? AND date BETWEEN ? AND ?
    `).all(userId, profileId, startDate, endDate);
    
    // ساخت آرایه روزهای هفته
    const daysOfWeek = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(targetMonday);
      currentDate.setDate(targetMonday.getDate() + i);
      const dateStr = toLocalDateString(currentDate);
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
      daysOfWeek.push({
        date: dateStr,
        dayName: dayName,
        trades: weekTrades.filter(t => t.date === dateStr),
        assessment: weekAssessments.find(a => a.date === dateStr)
      });
    }
    
    const weekTotalProfit = weekTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
    const weekTradeCount = weekTrades.length;
    
    return NextResponse.json({
      weekStart: startDate,
      weekEnd: endDate,
      weekTotalProfit,
      weekTradeCount,
      daysOfWeek
    });
  } catch (error) {
    console.error('Weekly API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}