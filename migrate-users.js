const db = require('better-sqlite3')('trading.db');
const bcrypt = require('bcryptjs');

// کاربرانی که در system_users نیستند ولی در users هستند
const users = db.prepare(`
  SELECT * FROM users WHERE email NOT IN (SELECT email FROM system_users) AND email IS NOT NULL
`).all();

console.log('📋 کاربران برای انتقال:', users.length);

for (const user of users) {
  const hash = bcrypt.hashSync('123456', 10);
  // 6 تا ? داریم: id, email, password, fullname, is_admin, subscription_expiry
  db.prepare(`
    INSERT OR IGNORE INTO system_users (id, email, password, fullname, is_admin, subscription_expiry)
    VALUES (?, ?, ?, ?, 0, date('now', '+30 days'))
  `).run(user.id, user.email, hash, user.username || 'کاربر');
  console.log('✅ منتقل شد:', user.email);
}

// به‌روزرسانی پسورد ادمین
const adminHash = bcrypt.hashSync('admin123', 10);
db.prepare(`
  UPDATE system_users SET password = ?, is_admin = 1 WHERE email = 'admin@tradingpro.com'
`).run(adminHash);

console.log('✅ انجام شد');