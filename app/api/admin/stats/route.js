import { db } from '@/database/sqlite';
import { NextResponse } from 'next/server';

function isAdmin(request) {
  const authHeader = request.headers.get('authorization');
  // ساده برای تست، در واقع باید توکن چک شود
  return authHeader === 'Bearer admin';
}

export async function GET(request) {
  try {
    // کل کاربران
    const users = db.prepare(`
      SELECT 
        u.id,
        u.email,
        u.fullname,
        u.created_at,
        u.subscription_expiry,
        COUNT(DISTINCT t.id) as total_trades,
        COALESCE(SUM(t.profit_usd), 0) as total_profit_usd,
        (SELECT COUNT(*) FROM profiles WHERE user_id = u.id) as profile_count,
        (SELECT date FROM daily_assessments WHERE user_id = u.id ORDER BY date DESC LIMIT 1) as last_assessment,
        (SELECT date FROM trades WHERE user_id = u.id ORDER BY date DESC LIMIT 1) as last_trade
      FROM system_users u
      LEFT JOIN trades t ON t.user_id = u.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `).all();
    
    // آمار کلی
    const totalUsers = users.length;
    const totalTrades = db.prepare('SELECT COUNT(*) as count FROM trades').get().count;
    const totalProfit = db.prepare('SELECT COALESCE(SUM(profit_usd), 0) as total FROM trades').get().total;
    const activeUsers = db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM trades 
      WHERE date >= date('now', '-30 days')
    `).get().count;
    
    // آمار روزانه (برای نمودار)
    const dailyStats = db.prepare(`
      SELECT 
        date,
        COUNT(*) as trade_count,
        COALESCE(SUM(profit_usd), 0) as daily_profit
      FROM trades
      WHERE date >= date('now', '-30 days')
      GROUP BY date
      ORDER BY date DESC
    `).all();
    
    return NextResponse.json({
      users,
      summary: {
        totalUsers,
        totalTrades,
        totalProfit,
        activeUsers
      },
      dailyStats
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}