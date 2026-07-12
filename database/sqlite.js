const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(process.cwd(), 'database', 'trading.db');
const db = new Database(dbPath);

console.log('📁 Database path:', dbPath);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 10000');

function getIranDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tehran' });
}

// ==================== ایجاد جداول اصلی (فقط system_users) ====================
db.exec(`
  CREATE TABLE IF NOT EXISTS system_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    fullname TEXT,
    is_admin INTEGER DEFAULT 0,
    subscription_expiry DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    initial_capital REAL DEFAULT 0,
    current_capital REAL DEFAULT 0,
    daily_loss_limit REAL DEFAULT 5,
    is_active INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES system_users(id)
  );

  CREATE TABLE IF NOT EXISTS trades (
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
  );

  CREATE TABLE IF NOT EXISTS user_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    profile_id INTEGER DEFAULT 1,
    rule_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES system_users(id),
    FOREIGN KEY (profile_id) REFERENCES profiles(id)
  );

  CREATE TABLE IF NOT EXISTS setups (
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
  );

  CREATE TABLE IF NOT EXISTS daily_assessments (
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
  );
`);

// ==================== توابع کاربر ====================
const getDefaultUser = () => {
  let user = db.prepare('SELECT * FROM system_users LIMIT 1').get();
  if (!user) {
    const hashedPassword = bcrypt.hashSync('demo123', 10);
    const insert = db.prepare(`
      INSERT INTO system_users (email, password, fullname, is_admin)
      VALUES (?, ?, ?, 0)
    `);
    insert.run('demo@demo.com', hashedPassword, 'کاربر دمو');
    user = db.prepare('SELECT * FROM system_users LIMIT 1').get();
    console.log('✅ کاربر دمو ایجاد شد: demo@demo.com / demo123');
  }
  return user;
};

const getUserSettings = () => {
  const user = getDefaultUser();
  const activeProfile = getActiveProfile(user.id);
  return {
    initial_capital: activeProfile?.initial_capital || 0,
    current_capital: activeProfile?.current_capital || 0,
    daily_loss_limit: activeProfile?.daily_loss_limit || 5
  };
};

// ==================== بقیه توابع (بدون تغییر، فقط ارجاع به system_users) ====================
const getActiveProfile = (userId = null) => {
  const targetUserId = userId || getDefaultUser().id;
  return db.prepare('SELECT * FROM profiles WHERE user_id = ? AND is_active = 1').get(targetUserId);
};

const getProfiles = () => {
  const user = getDefaultUser();
  return db.prepare('SELECT * FROM profiles WHERE user_id = ? ORDER BY created_at DESC').all(user.id);
};

const createProfile = (name, initialCapital) => {
  const user = getDefaultUser();
  db.prepare('UPDATE profiles SET is_active = 0 WHERE user_id = ?').run(user.id);
  const insert = db.prepare(`
    INSERT INTO profiles (user_id, name, initial_capital, current_capital, is_active, daily_loss_limit)
    VALUES (?, ?, ?, ?, 1, 5)
  `);
  return insert.run(user.id, name, initialCapital || 0, initialCapital || 0);
};

const switchProfile = (profileId) => {
  const user = getDefaultUser();
  db.prepare('UPDATE profiles SET is_active = 0 WHERE user_id = ?').run(user.id);
  db.prepare('UPDATE profiles SET is_active = 1 WHERE id = ? AND user_id = ?').run(profileId, user.id);
};

const updateProfileCapital = (profileId, newCapital) => {
  const user = getDefaultUser();
  return db.prepare('UPDATE profiles SET current_capital = ? WHERE id = ? AND user_id = ?').run(newCapital, profileId, user.id);
};

// ==================== تریدها ====================
const getAllTrades = () => {
  const user = getDefaultUser();
  const activeProfile = getActiveProfile(user.id);
  const profileId = activeProfile?.id || 1;
  return db.prepare('SELECT * FROM trades WHERE user_id = ? AND profile_id = ? ORDER BY date DESC, id DESC').all(user.id, profileId);
};

const addTrade = (trade) => {
  const user = getDefaultUser();
  const activeProfile = getActiveProfile(user.id);
  const profileId = activeProfile?.id || 1;
  const insert = db.prepare(`
    INSERT INTO trades (
      user_id, profile_id, symbol, side, risk, rr, trade_type, profit, profit_usd,
      capital_before, capital_after, setup_id, image, images, notes, 
      trade_number, date, session, rules_adhered
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return insert.run(
    user.id, profileId, trade.symbol, trade.side, trade.risk, trade.rr,
    trade.trade_type, trade.profit, trade.profit_usd || 0,
    trade.capital_before || 0, trade.capital_after || 0,
    trade.setup_id || null, trade.image || null, trade.images || null, trade.notes || null,
    trade.trade_number, trade.date, trade.session || 'Unknown', trade.rules_adhered || 0
  );
};

const updateTrade = (id, trade) => {
  const user = getDefaultUser();
  const activeProfile = getActiveProfile(user.id);
  const profileId = activeProfile?.id || 1;
  const update = db.prepare(`
    UPDATE trades SET 
      symbol = ?, side = ?, risk = ?, rr = ?, trade_type = ?, 
      profit = ?, profit_usd = ?, capital_before = ?, capital_after = ?,
      setup_id = ?, image = ?, images = ?, notes = ?, 
      date = ?, session = ?, rules_adhered = ?
    WHERE id = ? AND user_id = ? AND profile_id = ?
  `);
  return update.run(
    trade.symbol, trade.side, trade.risk, trade.rr, trade.trade_type,
    trade.profit, trade.profit_usd || 0, trade.capital_before || 0, trade.capital_after || 0,
    trade.setup_id || null, trade.image || null, trade.images || null, trade.notes || null,
    trade.date, trade.session || 'Unknown', trade.rules_adhered || 0,
    id, user.id, profileId
  );
};

const deleteTradeById = (id) => {
  const user = getDefaultUser();
  const activeProfile = getActiveProfile(user.id);
  const profileId = activeProfile?.id || 1;
  return db.prepare('DELETE FROM trades WHERE id = ? AND user_id = ? AND profile_id = ?').run(id, user.id, profileId);
};

// ==================== ستاپ‌ها ====================
const getAllSetups = () => {
  const user = getDefaultUser();
  const activeProfile = getActiveProfile(user.id);
  const profileId = activeProfile?.id || 1;
  return db.prepare('SELECT * FROM setups WHERE user_id = ? AND profile_id = ? ORDER BY created_at DESC').all(user.id, profileId);
};

const addSetup = (setup) => {
  const user = getDefaultUser();
  const activeProfile = getActiveProfile(user.id);
  const profileId = activeProfile?.id || 1;
  const insert = db.prepare(`
    INSERT INTO setups (user_id, profile_id, name, image, images, description, rr, type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return insert.run(user.id, profileId, setup.name, setup.image || null, setup.images || null, setup.description || null, setup.rr || 1, setup.type || 'normal');
};

const updateSetup = (id, setup) => {
  const user = getDefaultUser();
  const activeProfile = getActiveProfile(user.id);
  const profileId = activeProfile?.id || 1;
  const update = db.prepare(`
    UPDATE setups SET name = ?, image = ?, images = ?, description = ?, rr = ?, type = ?
    WHERE id = ? AND user_id = ? AND profile_id = ?
  `);
  return update.run(setup.name, setup.image || null, setup.images || null, setup.description || null, setup.rr || 1, setup.type || 'normal', id, user.id, profileId);
};

const deleteSetupById = (id) => {
  const user = getDefaultUser();
  const activeProfile = getActiveProfile(user.id);
  const profileId = activeProfile?.id || 1;
  return db.prepare('DELETE FROM setups WHERE id = ? AND user_id = ? AND profile_id = ?').run(id, user.id, profileId);
};

// ==================== سنجش روزانه ====================
const getTodayAssessment = () => {
  const user = getDefaultUser();
  const activeProfile = getActiveProfile(user.id);
  const profileId = activeProfile?.id || 1;
  const today = getIranDate();
  return db.prepare('SELECT * FROM daily_assessments WHERE user_id = ? AND profile_id = ? AND date = ?').get(user.id, profileId, today);
};

const saveAssessment = (assessment) => {
  const user = getDefaultUser();
  const activeProfile = getActiveProfile(user.id);
  const profileId = activeProfile?.id || 1;
  const today = getIranDate();
  const insert = db.prepare(`
    INSERT OR REPLACE INTO daily_assessments (user_id, profile_id, date, mental, sleep, stress)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  return insert.run(user.id, profileId, today, assessment.mental, assessment.sleep, assessment.stress);
};

const getAllAssessments = () => {
  const user = getDefaultUser();
  const activeProfile = getActiveProfile(user.id);
  const profileId = activeProfile?.id || 1;
  return db.prepare('SELECT date, mental, sleep, stress FROM daily_assessments WHERE user_id = ? AND profile_id = ? ORDER BY date').all(user.id, profileId);
};

// ==================== قوانین ====================
const getUserRules = () => {
  const user = getDefaultUser();
  const activeProfile = getActiveProfile(user.id);
  const profileId = activeProfile?.id || 1;
  return db.prepare('SELECT rule_text FROM user_rules WHERE user_id = ? AND profile_id = ? ORDER BY id').all(user.id, profileId);
};

const saveUserRules = (rules) => {
  const user = getDefaultUser();
  const activeProfile = getActiveProfile(user.id);
  const profileId = activeProfile?.id || 1;
  db.prepare('DELETE FROM user_rules WHERE user_id = ? AND profile_id = ?').run(user.id, profileId);
  const insert = db.prepare('INSERT INTO user_rules (user_id, profile_id, rule_text) VALUES (?, ?, ?)');
  for (const rule of rules) {
    insert.run(user.id, profileId, rule);
  }
};

module.exports = {
  db,
  getDefaultUser,
  getUserSettings,
  getProfiles,
  getActiveProfile,
  createProfile,
  switchProfile,
  updateProfileCapital,
  getAllTrades,
  addTrade,
  updateTrade,
  deleteTradeById,
  getAllSetups,
  addSetup,
  updateSetup,
  deleteSetupById,
  getTodayAssessment,
  saveAssessment,
  getAllAssessments,
  getUserRules,
  saveUserRules,
  getIranDate
};