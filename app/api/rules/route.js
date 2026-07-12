import { db, getActiveProfile } from '@/database/sqlite';
import { NextResponse } from 'next/server';

function getUserIdFromRequest(request) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return null;
  return parseInt(userId);
}

export async function GET(request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const activeProfile = getActiveProfile(userId);
    const profileId = activeProfile?.id || 1;
    
    const rules = db.prepare('SELECT rule_text FROM user_rules WHERE user_id = ? AND profile_id = ? ORDER BY id').all(userId, profileId);
    const rulesList = rules.map(r => r.rule_text);
    
    return NextResponse.json(rulesList);
  } catch (error) {
    console.error('GET /api/rules error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const activeProfile = getActiveProfile(userId);
    const profileId = activeProfile?.id || 1;
    const { rules } = body;
    
    // غیرفعال کردن موقت FOREIGN KEY
    db.prepare('PRAGMA foreign_keys = OFF').run();
    
    // حذف قوانین قبلی
    db.prepare('DELETE FROM user_rules WHERE user_id = ? AND profile_id = ?').run(userId, profileId);
    
    // اضافه کردن قوانین جدید
    const insert = db.prepare('INSERT INTO user_rules (user_id, profile_id, rule_text) VALUES (?, ?, ?)');
    for (const rule of rules) {
      insert.run(userId, profileId, rule);
    }
    
    // فعال کردن مجدد FOREIGN KEY
    db.prepare('PRAGMA foreign_keys = ON').run();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/rules error:', error);
    // اطمینان از فعال بودن FOREIGN KEY در صورت خطا
    try { db.prepare('PRAGMA foreign_keys = ON').run(); } catch(e) {}
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}