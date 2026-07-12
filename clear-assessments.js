const Database = require('better-sqlite3');
const db = new Database('trading.db');

try {
  // شمارش رکوردهای قبل از پاک کردن
  const countBefore = db.prepare('SELECT COUNT(*) as count FROM daily_assessments').get();
  console.log(`📊 تعداد سنجش‌های موجود: ${countBefore.count}`);

  // پاک کردن همه سنجش‌ها
  const result = db.prepare('DELETE FROM daily_assessments').run();
  console.log(`✅ ${result.changes} سنجش با موفقیت حذف شد.`);

  // نمایش رکوردهای باقی‌مانده (باید صفر باشد)
  const remaining = db.prepare('SELECT COUNT(*) as count FROM daily_assessments').get();
  console.log(`📋 تعداد سنجش‌های باقی‌مانده: ${remaining.count}`);
} catch (error) {
  console.error('❌ خطا:', error.message);
} finally {
  db.close();
}