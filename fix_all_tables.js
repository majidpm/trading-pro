const db = require('better-sqlite3')('./database/trading.db');

console.log('🔧 شروع بازسازی جداول...');
db.prepare('PRAGMA foreign_keys = OFF').run();

// ========== 1. بازسازی جدول profiles ==========
console.log('🔄 بازسازی profiles...');
db.prepare('DROP TABLE IF EXISTS profiles').run();
db.prepare(`
  CREATE TABLE profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    initial_capital REAL DEFAULT 0,
    current_capital REAL DEFAULT 0,
    daily_loss_limit REAL DEFAULT 5,
    is_active INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES system_users(id)
  )
`).run();

// ========== 2. بازسازی جدول trades ==========
console.log('🔄 بازسازی trades...');
db.prepare('DROP TABLE IF EXISTS trades').run();
db.prepare(`
  CREATE TABLE trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    profile_id INTEGER DEFAULT 1,
    symbol TEXT NOT NULL,
    side TEXT CHECK(side IN ('Buy', 'Sell')),
    risk REAL,
    rr REAL,
    trade_type TEXT CHECK(trade_type IN ('TP', 'SL', 'BE')),
    profit REAL,
    profit_usd REAL DEFAULT 0,
    capital_before REAL DEFAULT 0,
    capital_after REAL DEFAULT 0,
    setup_id INTEGER,
    image TEXT,
    images TEXT,
    notes TEXT,
    trade_number INTEGER,
    date TEXT NOT NULL,
    session TEXT DEFAULT 'Unknown',
    rules_adhered INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES system_users(id),
    FOREIGN KEY (profile_id) REFERENCES profiles(id)
  )
`).run();

// ========== 3. بازسازی جدول setups ==========
console.log('🔄 بازسازی setups...');
db.prepare('DROP TABLE IF EXISTS setups').run();
db.prepare(`
  CREATE TABLE setups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    profile_id INTEGER DEFAULT 1,
    name TEXT NOT NULL,
    image TEXT,
    images TEXT,
    description TEXT,
    rr REAL,
    type TEXT DEFAULT 'normal',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES system_users(id),
    FOREIGN KEY (profile_id) REFERENCES profiles(id)
  )
`).run();

// ========== 4. بازسازی جدول daily_assessments ==========
console.log('🔄 بازسازی daily_assessments...');
db.prepare('DROP TABLE IF EXISTS daily_assessments').run();
db.prepare(`
  CREATE TABLE daily_assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    profile_id INTEGER DEFAULT 1,
    date TEXT NOT NULL,
    mental INTEGER,
    sleep INTEGER,
    stress INTEGER,
    momentum REAL DEFAULT 0,
    readiness_score REAL DEFAULT 0,
    insights TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, profile_id, date),
    FOREIGN KEY (user_id) REFERENCES system_users(id),
    FOREIGN KEY (profile_id) REFERENCES profiles(id)
  )
`).run();

// ========== 5. بازسازی جدول user_rules ==========
console.log('🔄 بازسازی user_rules...');
db.prepare('DROP TABLE IF EXISTS user_rules').run();
db.prepare(`
  CREATE TABLE user_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    profile_id INTEGER DEFAULT 1,
    rule_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES system_users(id),
    FOREIGN KEY (profile_id) REFERENCES profiles(id)
  )
`).run();

// فعال کردن مجدد کلید خارجی
db.prepare('PRAGMA foreign_keys = ON').run();

console.log('✅ همه جداول بازسازی شدند (ارجاع به system_users)');