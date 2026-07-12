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
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    let activeProfile = getActiveProfile(userId);
    
    // اگر پروفایل فعال وجود ندارد، اولین پروفایل کاربر را فعال کن
    if (!activeProfile) {
      const firstProfile = db.prepare('SELECT * FROM profiles WHERE user_id = ? LIMIT 1').get(userId);
      if (firstProfile) {
        db.prepare('UPDATE profiles SET is_active = 1 WHERE id = ?').run(firstProfile.id);
        activeProfile = firstProfile;  // ✅ حالا درست کار می‌کند چون let است
      }
    }
    
    return NextResponse.json({
      initial_capital: activeProfile?.initial_capital || 0,
      current_capital: activeProfile?.current_capital || 0,
      daily_loss_limit: activeProfile?.daily_loss_limit || 5
    });
  } catch (error) {
    console.error('GET /api/settings error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    let activeProfile = getActiveProfile(userId);
    
    // اگر پروفایل فعال وجود ندارد، یکی بساز
    if (!activeProfile) {
      const anyProfile = db.prepare('SELECT * FROM profiles WHERE user_id = ? LIMIT 1').get(userId);
      
      if (!anyProfile) {
        db.prepare(`
          INSERT INTO profiles (user_id, name, initial_capital, current_capital, is_active, daily_loss_limit)
          VALUES (?, 'Default', 0, 0, 1, 5)
        `).run(userId);
      } else {
        db.prepare('UPDATE profiles SET is_active = 1 WHERE user_id = ? LIMIT 1').run(userId);
      }
      
      activeProfile = getActiveProfile(userId);
    }
    
    const { initial_capital, daily_loss_limit } = body;
    
    if (!activeProfile) {
      return NextResponse.json({ error: 'No active profile found' }, { status: 400 });
    }
    
    let current_capital = activeProfile.current_capital;
    
    // اگر سرمایه اولیه تغییر کرده، سرمایه فعلی را هم برابر با سرمایه اولیه کن
    if (initial_capital !== activeProfile.initial_capital && initial_capital > 0) {
      current_capital = initial_capital;
    }
    
    const stmt = db.prepare(`
      UPDATE profiles SET 
        initial_capital = ?, 
        current_capital = ?,
        daily_loss_limit = ?
      WHERE id = ? AND user_id = ?
    `);
    stmt.run(
      initial_capital || 0,
      current_capital,
      daily_loss_limit || 5,
      activeProfile.id,
      userId
    );
    
    return NextResponse.json({ 
      success: true, 
      settings: { 
        initial_capital: initial_capital || 0, 
        current_capital: current_capital,
        daily_loss_limit: daily_loss_limit || 5
      } 
    });
  } catch (error) {
    console.error('POST /api/settings error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - به‌روزرسانی سرمایه فعلی (برای ویرایش دستی)
export async function PUT(request) {
  try {
    const body = await request.json();
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    let activeProfile = getActiveProfile(userId);
    
    // اگر پروفایل فعال وجود ندارد، یکی بساز
    if (!activeProfile) {
      const anyProfile = db.prepare('SELECT * FROM profiles WHERE user_id = ? LIMIT 1').get(userId);
      
      if (!anyProfile) {
        db.prepare(`
          INSERT INTO profiles (user_id, name, initial_capital, current_capital, is_active, daily_loss_limit)
          VALUES (?, 'Default', 0, 0, 1, 5)
        `).run(userId);
      } else {
        db.prepare('UPDATE profiles SET is_active = 1 WHERE user_id = ? LIMIT 1').run(userId);
      }
      
      activeProfile = getActiveProfile(userId);
    }
    
    const { current_capital } = body;
    
    if (current_capital === undefined) {
      return NextResponse.json({ error: 'current_capital required' }, { status: 400 });
    }
    
    if (!activeProfile) {
      return NextResponse.json({ error: 'No active profile found' }, { status: 400 });
    }
    
    const stmt = db.prepare('UPDATE profiles SET current_capital = ? WHERE id = ? AND user_id = ?');
    stmt.run(current_capital, activeProfile.id, userId);
    
    return NextResponse.json({ success: true, current_capital });
  } catch (error) {
    console.error('PUT /api/settings error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}