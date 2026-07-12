const { getAllTrades, addTrade, getDefaultUser } = require('../database/sqlite');

// تست اتصال
console.log('🔄 در حال تست دیتابیس...');

try {
  const user = getDefaultUser();
  console.log('✅ کاربر:', user);

  // اضافه کردن یه ترید تست
  const result = addTrade({
    symbol: 'BTC/USDT',
    side: 'Buy',
    risk: 1,
    rr: 2,
    trade_type: 'TP',
    profit: 2,
    date: new Date().toISOString().split('T')[0]
  });

  console.log('✅ ترید اضافه شد:', result);

  // گرفتن همه تریدها
  const trades = getAllTrades();
  console.log('📊 لیست تریدها:', trades);
  
  console.log('\n🎉 همه چیز درست کار میکنه!');
} catch (error) {
  console.error('❌ خطا:', error.message);
}