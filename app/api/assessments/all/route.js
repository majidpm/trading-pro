import { db, getActiveProfile } from '@/database/sqlite';
import { NextResponse } from 'next/server';

// تابع کمکی برای گرفتن userId از هدر
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
    
    const allAssessments = db.prepare(`
      SELECT date, mental, sleep, stress 
      FROM daily_assessments 
      WHERE user_id = ? AND profile_id = ?
      ORDER BY date
    `).all(userId, profileId);
    
    return NextResponse.json(allAssessments);
  } catch (error) {
    console.error('GET /api/assessments/all error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}