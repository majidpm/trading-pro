import { db } from '@/database/sqlite';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { email, password, fullname } = await request.json();

    // بررسی وجود کاربر در system_users
    const existing = db.prepare('SELECT id FROM system_users WHERE email = ?').get(email);
    if (existing) {
      return NextResponse.json({ error: 'این ایمیل قبلاً ثبت شده است' }, { status: 400 });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    // درج در system_users
    const result = db.prepare(`
      INSERT INTO system_users (email, password, fullname, is_admin, subscription_expiry)
      VALUES (?, ?, ?, 0, date('now', '+30 days'))
    `).run(email, hashedPassword, fullname);
    const userId = result.lastInsertRowid;

    // درج پروفایل پیش‌فرض برای این کاربر
    db.prepare(`
      INSERT INTO profiles (user_id, name, initial_capital, current_capital, is_active, daily_loss_limit)
      VALUES (?, 'Default', 0, 0, 1, 5)
    `).run(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}