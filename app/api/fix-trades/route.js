import { db, getDefaultUser, getActiveProfile } from '@/database/sqlite';
import { NextResponse } from 'next/server';

function getIranDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tehran' });
}

export async function POST() {
  try {
    const user = getDefaultUser();
    const activeProfile = getActiveProfile();
    const profileId = activeProfile?.id || 1;
    const today = getIranDate();
    
    // دریافت همه تریدهای امروز به ترتیب
    const todayTrades = db.prepare(`
      SELECT * FROM trades 
      WHERE user_id = ? AND profile_id = ? AND date = ?
      ORDER BY created_at ASC, id ASC
    `).all(user.id, profileId, today);
    
    if (todayTrades.length === 0) {
      return NextResponse.json({ message: 'هیچ تریدی برای امروز وجود ندارد' });
    }
    
    // سرمایه اولیه امروز (از پروفایل)
    let currentCapital = activeProfile.current_capital;
    
    // اصلاح تریدها
    for (const trade of todayTrades) {
      const profitPercent = trade.profit || 0;
      const profitUsd = (profitPercent * currentCapital) / 100;
      const newCapital = currentCapital + profitUsd;
      
      // به‌روزرسانی ترید
      db.prepare(`
        UPDATE trades SET 
          profit_usd = ?, 
          capital_before = ?, 
          capital_after = ?
        WHERE id = ?
      `).run(profitUsd, currentCapital, newCapital, trade.id);
      
      currentCapital = newCapital;
    }
    
    // به‌روزرسانی سرمایه نهایی در پروفایل
    db.prepare(`
      UPDATE profiles SET current_capital = ? WHERE id = ? AND user_id = ?
    `).run(currentCapital, profileId, user.id);
    
    return NextResponse.json({
      success: true,
      message: `${todayTrades.length} ترید اصلاح شد`,
      newCapital: currentCapital
    });
    
  } catch (error) {
    console.error('Fix trades error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}