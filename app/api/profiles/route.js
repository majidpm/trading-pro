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
    
    const profiles = db.prepare('SELECT * FROM profiles WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    const active = getActiveProfile(userId);
    
    return NextResponse.json({ profiles, active });
  } catch (error) {
    console.error('GET /api/profiles error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name } = await request.json();
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "نام پروفایل الزامی است" }, { status: 400 });
    }
    
    // غیرفعال کردن پروفایل قبلی
    db.prepare('UPDATE profiles SET is_active = 0 WHERE user_id = ?').run(userId);
    
    // ایجاد پروفایل جدید با سرمایه 0 و حد ضرر 5
    const insert = db.prepare(`
      INSERT INTO profiles (user_id, name, initial_capital, current_capital, daily_loss_limit, is_active)
      VALUES (?, ?, 0, 0, 5, 1)
    `);
    const result = insert.run(userId, name);
    
    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('POST /api/profiles error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { profileId } = await request.json();
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!profileId) {
      return NextResponse.json({ error: "شناسه پروفایل الزامی است" }, { status: 400 });
    }
    
    // بررسی وجود پروفایل
    const profile = db.prepare('SELECT * FROM profiles WHERE id = ? AND user_id = ?').get(profileId, userId);
    if (!profile) {
      return NextResponse.json({ error: "پروفایل یافت نشد" }, { status: 404 });
    }
    
    // غیرفعال کردن همه پروفایل‌ها
    db.prepare('UPDATE profiles SET is_active = 0 WHERE user_id = ?').run(userId);
    
    // فعال کردن پروفایل انتخاب شده
    db.prepare('UPDATE profiles SET is_active = 1 WHERE id = ? AND user_id = ?').run(profileId, userId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/profiles error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { profileId, name, current_capital } = await request.json();
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (name) {
      db.prepare('UPDATE profiles SET name = ? WHERE id = ? AND user_id = ?').run(name, profileId, userId);
    }
    
    if (current_capital !== undefined) {
      db.prepare('UPDATE profiles SET current_capital = ? WHERE id = ? AND user_id = ?').run(current_capital, profileId, userId);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/profiles error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { profileId } = await request.json();
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const activeProfile = getActiveProfile(userId);
    
    if (!profileId) {
      return NextResponse.json({ error: "شناسه پروفایل الزامی است" }, { status: 400 });
    }
    
    // جلوگیری از حذف پروفایل فعال
    if (activeProfile?.id === profileId) {
      return NextResponse.json({ error: "نمی‌توان پروفایل فعال را حذف کرد" }, { status: 400 });
    }
    
    // جلوگیری از حذف پروفایل Default
    const profile = db.prepare('SELECT name FROM profiles WHERE id = ? AND user_id = ?').get(profileId, userId);
    if (profile?.name === "Default") {
      return NextResponse.json({ error: "نمی‌توان پروفایل Default را حذف کرد" }, { status: 400 });
    }
    
    // غیرفعال کردن موقت FOREIGN KEY
    db.prepare('PRAGMA foreign_keys = OFF').run();
    
    // حذف تمام داده‌های مرتبط با این پروفایل
    db.prepare('DELETE FROM trades WHERE user_id = ? AND profile_id = ?').run(userId, profileId);
    db.prepare('DELETE FROM setups WHERE user_id = ? AND profile_id = ?').run(userId, profileId);
    db.prepare('DELETE FROM daily_assessments WHERE user_id = ? AND profile_id = ?').run(userId, profileId);
    db.prepare('DELETE FROM user_rules WHERE user_id = ? AND profile_id = ?').run(userId, profileId);
    db.prepare('DELETE FROM profiles WHERE id = ? AND user_id = ?').run(profileId, userId);
    
    // فعال کردن مجدد FOREIGN KEY
    db.prepare('PRAGMA foreign_keys = ON').run();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/profiles error:', error);
    // اطمینان از فعال بودن FOREIGN KEY در صورت خطا
    try { db.prepare('PRAGMA foreign_keys = ON').run(); } catch(e) {}
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}