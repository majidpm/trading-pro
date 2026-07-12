import { db, getActiveProfile } from '@/database/sqlite';
import { NextResponse } from 'next/server';

// تابع کمکی برای گرفتن userId از هدر
function getUserIdFromRequest(request) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return null;
  return parseInt(userId);
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { current_capital } = body;
    
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const activeProfile = getActiveProfile(userId);
    
    if (current_capital === undefined) {
      return NextResponse.json({ error: 'current_capital required' }, { status: 400 });
    }
    
    if (!activeProfile) {
      return NextResponse.json({ error: 'No active profile found' }, { status: 400 });
    }
    
    const stmt = db.prepare('UPDATE profiles SET current_capital = ? WHERE id = ? AND user_id = ?');
    stmt.run(current_capital, activeProfile.id, userId);
    
    return NextResponse.json({ success: true, current_capital });
  } catch (error) {
    console.error('PUT /api/settings/capital error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}