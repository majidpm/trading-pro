import { db } from '@/database/sqlite';
import { NextResponse } from 'next/server';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    // غیرفعال کردن موقت FOREIGN KEY (برای حذف بدون خطا)
    db.prepare('PRAGMA foreign_keys = OFF').run();
    
    // حذف تمام داده‌های کاربر
    db.prepare('DELETE FROM trades WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM setups WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM daily_assessments WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM user_rules WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM profiles WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM system_users WHERE id = ?').run(id);
    
    // فعال کردن مجدد FOREIGN KEY
    db.prepare('PRAGMA foreign_keys = ON').run();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { action, days } = await request.json();
    
    if (action === 'extend_subscription') {
      db.prepare(`
        UPDATE system_users 
        SET subscription_expiry = date(subscription_expiry, ?) 
        WHERE id = ?
      `).run(`+${days} days`, id);
      return NextResponse.json({ success: true, message: `${days} روز تمدید شد` });
    }
    
    if (action === 'toggle_admin') {
      const user = db.prepare('SELECT is_admin FROM system_users WHERE id = ?').get(id);
      db.prepare('UPDATE system_users SET is_admin = ? WHERE id = ?').run(user?.is_admin ? 0 : 1, id);
      return NextResponse.json({ success: true, message: 'وضعیت ادمین تغییر کرد' });
    }
    
    return NextResponse.json({ error: 'Action not found' }, { status: 400 });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}