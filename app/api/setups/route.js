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
    
    const setups = db.prepare('SELECT * FROM setups WHERE user_id = ? AND profile_id = ? ORDER BY created_at DESC').all(userId, profileId);
    
    const processedSetups = setups.map(setup => ({
      ...setup,
      images: setup.images ? (typeof setup.images === 'string' ? JSON.parse(setup.images) : setup.images) : []
    }));
    
    const setupsWithStats = processedSetups.map(setup => {
      const trades = db.prepare(`
        SELECT profit FROM trades 
        WHERE user_id = ? AND profile_id = ? AND setup_id = ?
      `).all(userId, profileId, setup.id);
      
      const totalTrades = trades.length;
      const winningTrades = trades.filter(t => t.profit > 0).length;
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades * 100).toFixed(1) : 0;
      const totalProfit = trades.reduce((sum, t) => sum + (t.profit || 0), 0);
      
      return {
        ...setup,
        stats: { totalTrades, winningTrades, winRate, totalProfit }
      };
    });
    
    return NextResponse.json(setupsWithStats);
  } catch (error) {
    console.error('GET /api/setups error:', error);
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

     // غیرفعال کردن موقت FOREIGN KEY
    db.prepare('PRAGMA foreign_keys = OFF').run();
    
    const insert = db.prepare(`
      INSERT INTO setups (user_id, profile_id, name, images, description, rr, type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = insert.run(
      userId, profileId,
      body.name, 
      body.images || null, 
      body.description || null, 
      body.rr || 1, 
      body.type || 'normal'
    );
    
    // فعال کردن مجدد FOREIGN KEY
    db.prepare('PRAGMA foreign_keys = ON').run();

    const newSetup = db.prepare('SELECT * FROM setups WHERE id = ?').get(result.lastInsertRowid);
    
    if (newSetup && newSetup.images) {
      newSetup.images = typeof newSetup.images === 'string' ? JSON.parse(newSetup.images) : newSetup.images;
    } else {
      newSetup.images = [];
    }
    
    return NextResponse.json(newSetup);
  } catch (error) {
    console.error('POST /api/setups error:', error);
     // اطمینان از فعال بودن FOREIGN KEY در صورت خطا
    try { db.prepare('PRAGMA foreign_keys = ON').run(); } catch(e) {}
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }
    
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const activeProfile = getActiveProfile(userId);
    const profileId = activeProfile?.id || 1;
    
    // غیرفعال کردن موقت FOREIGN KEY
    db.prepare('PRAGMA foreign_keys = OFF').run();

    const updateStmt = db.prepare(`
      UPDATE setups 
      SET name = ?, type = ?, images = ?, description = ?, rr = ?
      WHERE id = ? AND user_id = ? AND profile_id = ?
    `);
    
    const result = updateStmt.run(
      body.name,
      body.type || 'normal',
      body.images || null,
      body.description || null,
      body.rr || 1,
      parseInt(id),
      userId,
      profileId
    );

        // فعال کردن مجدد FOREIGN KEY
    db.prepare('PRAGMA foreign_keys = ON').run();
    
    if (result.changes === 0) {
      return NextResponse.json({ error: 'Setup not found' }, { status: 404 });
    }
    
    const updatedSetup = db.prepare('SELECT * FROM setups WHERE id = ? AND user_id = ? AND profile_id = ?').get(parseInt(id), userId, profileId);
    
    if (updatedSetup && updatedSetup.images) {
      updatedSetup.images = typeof updatedSetup.images === 'string' ? JSON.parse(updatedSetup.images) : updatedSetup.images;
    } else {
      updatedSetup.images = [];
    }
    
    return NextResponse.json(updatedSetup);
  } catch (error) {
    console.error('PUT /api/setups error:', error);
       // اطمینان از فعال بودن FOREIGN KEY در صورت خطا
    try { db.prepare('PRAGMA foreign_keys = ON').run(); } catch(e) {}
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }
    
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
     // غیرفعال کردن موقت FOREIGN KEY
    db.prepare('PRAGMA foreign_keys = OFF').run();
    const activeProfile = getActiveProfile(userId);
    const profileId = activeProfile?.id || 1;
    
    const deleteStmt = db.prepare('DELETE FROM setups WHERE id = ? AND user_id = ? AND profile_id = ?');
    const result = deleteStmt.run(parseInt(id), userId, profileId);
    
      // فعال کردن مجدد FOREIGN KEY
    db.prepare('PRAGMA foreign_keys = ON').run();

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Setup not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/setups error:', error);
        // اطمینان از فعال بودن FOREIGN KEY در صورت خطا
    try { db.prepare('PRAGMA foreign_keys = ON').run(); } catch(e) {}
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }
    
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const activeProfile = getActiveProfile(userId);
    const profileId = activeProfile?.id || 1;
    
    const updateStmt = db.prepare('UPDATE setups SET type = ? WHERE id = ? AND user_id = ? AND profile_id = ?');
    const result = updateStmt.run(body.type, parseInt(id), userId, profileId);
    
    if (result.changes === 0) {
      return NextResponse.json({ error: 'Setup not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/setups error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}