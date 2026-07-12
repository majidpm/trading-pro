const db = require('better-sqlite3')('./trading.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS daily_assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    date TEXT NOT NULL,
    mental INTEGER,
    sleep INTEGER,
    stress INTEGER,
    momentum REAL DEFAULT 0,
    readiness_score REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

console.log('✅ جدول daily_assessments ساخته شد');