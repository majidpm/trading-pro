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
    
    const trades = db.prepare(`
      SELECT * FROM trades 
      WHERE user_id = ? AND profile_id = ? 
      ORDER BY date DESC, id DESC
    `).all(userId, profileId);
    
    return NextResponse.json(trades);
  } catch (error) {
    console.error('GET /api/trades error:', error);
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
    
    let currentCapital = activeProfile?.current_capital || 0;
    const profitPercent = parseFloat(body.profit) || 0;
    const profitUsd = (profitPercent * currentCapital) / 100;
    const newCapital = currentCapital + profitUsd;
    
    const today = body.date || new Date().toISOString().split('T')[0];
    const todayTrades = db.prepare(`
      SELECT COUNT(*) as count FROM trades 
      WHERE user_id = ? AND profile_id = ? AND date = ?
    `).get(userId, profileId, today);
    const tradeNumber = (todayTrades.count || 0) + 1;
    
    let imagesValue = body.images;
    if (imagesValue && Array.isArray(imagesValue)) {
      imagesValue = JSON.stringify(imagesValue);
    }
    
    const insert = db.prepare(`
      INSERT INTO trades (
        user_id, profile_id, symbol, side, risk, rr, trade_type, profit, 
        profit_usd, capital_before, capital_after,
        setup_id, image, images, notes, trade_number, date, session, rules_adhered
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insert.run(
      userId, profileId, body.symbol, body.side, body.risk, body.rr,
      body.trade_type, profitPercent, profitUsd,
      currentCapital, newCapital,
      body.setup_id || null, body.image || null, imagesValue, body.notes || null,
      tradeNumber, today, body.session || 'Unknown', body.rules_adhered || 0
    );
    
    db.prepare(`
      UPDATE profiles SET current_capital = ? 
      WHERE id = ? AND user_id = ?
    `).run(newCapital, profileId, userId);
    
    const newTrade = db.prepare('SELECT * FROM trades WHERE id = ?').get(db.prepare('SELECT last_insert_rowid()').get()['last_insert_rowid()']);
    return NextResponse.json(newTrade);
  } catch (error) {
    console.error('POST /api/trades error:', error);
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
    
    let currentCapital = activeProfile?.current_capital || 0;
    
    const oldTrade = db.prepare('SELECT profit_usd FROM trades WHERE id = ? AND user_id = ? AND profile_id = ?').get(id, userId, profileId);
    if (oldTrade && oldTrade.profit_usd !== 0) {
      currentCapital = currentCapital - oldTrade.profit_usd;
    }
    
    const profitPercent = parseFloat(body.profit) || 0;
    const profitUsd = (profitPercent * currentCapital) / 100;
    const newCapital = currentCapital + profitUsd;
    
    let imagesValue = body.images;
    if (imagesValue && Array.isArray(imagesValue)) {
      imagesValue = JSON.stringify(imagesValue);
    }
    
    const update = db.prepare(`
      UPDATE trades SET 
        symbol = ?, side = ?, risk = ?, rr = ?, trade_type = ?, 
        profit = ?, profit_usd = ?, capital_before = ?, capital_after = ?,
        setup_id = ?, image = ?, images = ?, notes = ?, 
        date = ?, session = ?, rules_adhered = ?
      WHERE id = ? AND user_id = ? AND profile_id = ?
    `);
    
    const result = update.run(
      body.symbol, body.side, body.risk, body.rr, body.trade_type,
      profitPercent, profitUsd, currentCapital, newCapital,
      body.setup_id || null, body.image || null, imagesValue, body.notes || null,
      body.date, body.session || 'Unknown', body.rules_adhered || 0,
      parseInt(id), userId, profileId
    );
    
    if (result.changes === 0) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }
    
    db.prepare(`
      UPDATE profiles SET current_capital = ? 
      WHERE id = ? AND user_id = ?
    `).run(newCapital, profileId, userId);
    
    const updatedTrade = db.prepare('SELECT * FROM trades WHERE id = ? AND user_id = ? AND profile_id = ?').get(parseInt(id), userId, profileId);
    return NextResponse.json(updatedTrade);
  } catch (error) {
    console.error('PUT /api/trades error:', error);
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
    
    const activeProfile = getActiveProfile(userId);
    const profileId = activeProfile?.id || 1;
    
    const trade = db.prepare('SELECT profit_usd FROM trades WHERE id = ? AND user_id = ? AND profile_id = ?').get(id, userId, profileId);
    
    const deleteStmt = db.prepare('DELETE FROM trades WHERE id = ? AND user_id = ? AND profile_id = ?');
    const result = deleteStmt.run(id, userId, profileId);
    
    if (result.changes > 0 && trade && trade.profit_usd !== 0) {
      const currentCapital = activeProfile?.current_capital || 0;
      const newCapital = currentCapital - trade.profit_usd;
      
      db.prepare(`
        UPDATE profiles SET current_capital = ? 
        WHERE id = ? AND user_id = ?
      `).run(newCapital, profileId, userId);
    }
    
    return NextResponse.json({ success: result.changes > 0 });
  } catch (error) {
    console.error('DELETE /api/trades error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}