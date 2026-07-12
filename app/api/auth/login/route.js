import { db } from '@/database/sqlite';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    console.log('📧 Login attempt:', email);
    
    // جستجو در جدول system_users
    const user = db.prepare('SELECT * FROM system_users WHERE email = ?').get(email);
    
    if (!user) {
      return NextResponse.json({ error: 'ایمیل یا رمز عبور اشتباه است' }, { status: 401 });
    }
    
    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'ایمیل یا رمز عبور اشتباه است' }, { status: 401 });
    }
    
    // بررسی وجود پروفایل فعال
    let profile = db.prepare('SELECT * FROM profiles WHERE user_id = ? AND is_active = 1').get(user.id);
    if (!profile) {
      // اگر پروفایل فعال نیست، اولین پروفایل را فعال کن
      profile = db.prepare('SELECT * FROM profiles WHERE user_id = ? LIMIT 1').get(user.id);
      if (profile) {
        db.prepare('UPDATE profiles SET is_active = 1 WHERE id = ?').run(profile.id);
      } else {
        // اگر هیچ پروفایلی ندارد، بساز
        db.prepare(`
          INSERT INTO profiles (user_id, name, initial_capital, current_capital, is_active, daily_loss_limit)
          VALUES (?, 'Default', 0, 0, 1, 5)
        `).run(user.id);
        profile = db.prepare('SELECT * FROM profiles WHERE user_id = ? AND is_active = 1').get(user.id);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      user: { id: user.id, email: user.email, fullname: user.fullname || user.email }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}