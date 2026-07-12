const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const db = new Database('trading.db');

// هش کردن رمز
const hashedPassword = bcrypt.hashSync('admin123', 10);

// 1. به‌روزرسانی کاربر id=1 به عنوان کاربر اصلی
db.prepare(`
  UPDATE users SET 
    email = 'admin@tradingpro.com',
    password = ?,
    fullname = 'مدیر اصلی',
    is_admin = 1,
    initial_capital = 10000,
    current_capital = 10000
  WHERE id = 1
`).run(hashedPassword);

console.log('✅ کاربر اصلی (admin@tradingpro.com / admin123) به‌روزرسانی شد');

// 2. اطمینان از وجود پروفایل فعال برای این کاربر
const profile = db.prepare('SELECT * FROM profiles WHERE user_id = 1 AND is_active = 1').get();
if (!profile) {
  db.prepare(`
    INSERT INTO profiles (user_id, name, initial_capital, current_capital, is_active, daily_loss_limit)
    VALUES (1, 'Default', 10000, 10000, 1, 5)
  `).run();
  console.log('✅ پروفایل برای کاربر اصلی ایجاد شد');
}

db.close();