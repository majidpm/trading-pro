// reset-month.js
const db = require('better-sqlite3')('./trading.db');

// سال و ماه جاری (مثلاً 2026-04)
const now = new Date();
const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

console.log(`🗑️ حذف سنجش‌های مربوط به ماه ${yearMonth}...`);

const deleted = db.prepare(`DELETE FROM daily_assessments WHERE strftime('%Y-%m', date) = ?`).run(yearMonth);

console.log(`✅ ${deleted.changes} رکورد حذف شد.`);
console.log('برای خروج هر کلیدی را بزنید...');
process.stdin.once('data', () => process.exit());