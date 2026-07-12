import { db, getActiveProfile } from '@/database/sqlite';
import { NextResponse } from 'next/server';

function getIranDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tehran' });
}

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
    const today = getIranDate();

    const stmt = db.prepare(`
      SELECT * FROM daily_assessments
      WHERE user_id = ? AND profile_id = ? AND date = ?
    `);
    const assessment = stmt.get(userId, profileId, today);
    return NextResponse.json(assessment || {});
  } catch (error) {
    console.error('GET /api/assessments error:', error);
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
    const today = getIranDate();

    console.log('📝 POST - Received:', { mental: body.mental, sleep: body.sleep, stress: body.stress, userId, profileId });

    // حذف سنجش قبلی امروز
    db.prepare(`
      DELETE FROM daily_assessments
      WHERE user_id = ? AND profile_id = ? AND date = ?
    `).run(userId, profileId, today);

    // درج سنجش جدید
    const insert = db.prepare(`
      INSERT INTO daily_assessments (user_id, profile_id, date, mental, sleep, stress)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insert.run(userId, profileId, today, body.mental, body.sleep, body.stress);

    return NextResponse.json({ success: true, date: today });
  } catch (error) {
    console.error('POST /api/assessments error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const activeProfile = getActiveProfile(userId);
    const profileId = activeProfile?.id || 1;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || getIranDate();

    const deleteStmt = db.prepare(`
      DELETE FROM daily_assessments
      WHERE user_id = ? AND profile_id = ? AND date = ?
    `);
    const result = deleteStmt.run(userId, profileId, date);

    return NextResponse.json({ success: true, deleted: result.changes });
  } catch (error) {
    console.error('DELETE /api/assessments error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}