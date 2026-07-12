import { db } from '@/database/sqlite';
import { NextResponse } from 'next/server';

function getUserIdFromRequest(request) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return null;
  return parseInt(userId);
}

export async function POST(request) {
  try {
    const { setupIds, targetProfileId } = await request.json();
    
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!setupIds || !setupIds.length) {
      return NextResponse.json({ error: 'هیچ ستاپی انتخاب نشده است' }, { status: 400 });
    }
    
    if (!targetProfileId) {
      return NextResponse.json({ error: 'پروفایل مقصد انتخاب نشده است' }, { status: 400 });
    }
    
    // بررسی وجود پروفایل مقصد
    const targetProfile = db.prepare('SELECT id, name FROM profiles WHERE id = ? AND user_id = ?').get(targetProfileId, userId);
    if (!targetProfile) {
      return NextResponse.json({ error: 'پروفایل مقصد یافت نشد' }, { status: 404 });
    }
    
    // دریافت ستاپ‌های مبدأ
    const sourceSetups = [];
    for (const setupId of setupIds) {
      const setup = db.prepare('SELECT * FROM setups WHERE id = ? AND user_id = ?').get(setupId, userId);
      if (setup) sourceSetups.push(setup);
    }
    
    if (sourceSetups.length === 0) {
      return NextResponse.json({ error: 'ستاپ‌های انتخاب شده یافت نشدند' }, { status: 404 });
    }
    
    // بررسی ستاپ‌های تکراری در پروفایل مقصد
    const existingSetups = db.prepare(`SELECT name FROM setups WHERE user_id = ? AND profile_id = ?`).all(userId, targetProfileId);
    const existingNames = new Set(existingSetups.map(s => s.name));
    
    const newSetups = [];
    const duplicateSetups = [];
    
    for (const setup of sourceSetups) {
      if (existingNames.has(setup.name)) {
        duplicateSetups.push(setup.name);
      } else {
        newSetups.push(setup);
      }
    }
    
    // کپی ستاپ‌های جدید
    let copiedCount = 0;
    
    // غیرفعال کردن موقت FOREIGN KEY
    db.prepare('PRAGMA foreign_keys = OFF').run();
    
    const insertStmt = db.prepare(`
      INSERT INTO setups (user_id, profile_id, name, images, description, rr, type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    for (const setup of newSetups) {
      const result = insertStmt.run(
        userId,
        targetProfileId,
        setup.name,
        setup.images,
        setup.description || null,
        setup.rr || 1,
        setup.type || 'normal'
      );
      if (result.changes > 0) copiedCount++;
    }
    
    // فعال کردن مجدد FOREIGN KEY
    db.prepare('PRAGMA foreign_keys = ON').run();
    
    return NextResponse.json({ 
      success: true, 
      copiedCount,
      duplicateCount: duplicateSetups.length,
      duplicateNames: duplicateSetups,
      message: `${copiedCount} ستاپ با موفقیت کپی شد${duplicateSetups.length > 0 ? ` و ${duplicateSetups.length} ستاپ تکراری بود` : ''}`,
      targetProfileName: targetProfile.name
    });
    
  } catch (error) {
    console.error('Copy setups error:', error);
    try { db.prepare('PRAGMA foreign_keys = ON').run(); } catch(e) {}
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}