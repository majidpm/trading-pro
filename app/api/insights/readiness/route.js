import { db, getActiveProfile } from '@/database/sqlite';
import { NextResponse } from 'next/server';

function normalizeProfit(profit) {
  if (profit > 1) return 1;
  if (profit > 0) return 0.5;
  if (profit < -1) return -1;
  if (profit < 0) return -0.5;
  return 0;
}

function getIranDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tehran' });
}

function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// تابع کمکی برای گرفتن userId از هدر
function getUserIdFromRequest(request) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return null;
  return parseInt(userId);
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const todayMental = parseInt(searchParams.get('mental')) || 0;
    const todaySleep = parseInt(searchParams.get('sleep')) || 0;
    const todayStress = parseInt(searchParams.get('stress')) || 0;
    
      // تغییر این قسمت
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const activeProfile = getActiveProfile(userId);
    const profileId = activeProfile?.id || 1;
    const currentDate = getIranDate();
    
    // ========== 1. دریافت 3 ترید آخر برای مومنتوم ==========
    const lastTrades = db.prepare(`
      SELECT profit, date FROM trades 
      WHERE user_id = ? AND profile_id = ? AND date <= ?
      ORDER BY date DESC, id DESC 
      LIMIT 3
    `).all(userId, profileId, currentDate);
    
    // ========== 2. محاسبه مومنتوم ==========
    let momentum = 0;
    const weights = [0.5, 0.3, 0.2];
    if (lastTrades.length === 0) {
      momentum = 0;
    } else {
      lastTrades.forEach((trade, index) => {
        if (index < weights.length) {
          const normalized = normalizeProfit(trade.profit);
          momentum += normalized * weights[index];
        }
      });
      momentum = Math.max(-1, Math.min(1, momentum));
    }
    
    // ========== 3. دریافت سنجش امروز ==========
    const todayAssessment = db.prepare(`
      SELECT mental, sleep, stress, readiness_score FROM daily_assessments 
      WHERE user_id = ? AND profile_id = ? AND date = ?
    `).get(userId, profileId, currentDate);
    
    let mental, sleep, stress;
    let hasAssessment = false;
    let readiness = 50;
    const insights = [];
    
    if (todayAssessment) {
      mental = todayAssessment.mental;
      sleep = todayAssessment.sleep;
      stress = todayAssessment.stress;
      hasAssessment = true;
      console.log("📊 Today assessment from DB:", { mental, sleep, stress });
    } 
    else if (todayMental !== 0 || todaySleep !== 0 || todayStress !== 0) {
      mental = todayMental;
      sleep = todaySleep;
      stress = todayStress;
      hasAssessment = true;
      console.log("📊 Today assessment from params:", { mental, sleep, stress });
    } 
    else {
      const lastReadiness = db.prepare(`
        SELECT readiness_score FROM daily_assessments 
        WHERE user_id = ? AND profile_id = ?
        ORDER BY date DESC 
        LIMIT 1
      `).get(userId, profileId);
      
      if (lastReadiness && lastReadiness.readiness_score) {
        return NextResponse.json({
          readiness: lastReadiness.readiness_score,
          momentum: momentum.toFixed(2),
          insights: [{
            icon: "🧠",
            text: "امروز هنوز سنجش انجام نشده. لطفاً دکمه «سنجش وضعیت» را بزن."
          }]
        });
      } else {
        mental = 5;
        sleep = 5;
        stress = 5;
        hasAssessment = false;
      }
    }
    
    // ========== 4. محاسبه readiness پایه ==========
    let mentalScore = 0, sleepScore = 0, stressScore = 0, momentumScore = 0, rawReadiness = 0;
    
    if (hasAssessment) {
      mentalScore = (mental / 10) * 40;
      sleepScore = (sleep / 10) * 25;
      stressScore = ((10 - stress) / 9) * 20;
      momentumScore = momentum * 20;
      rawReadiness = mentalScore + sleepScore + stressScore + momentumScore;
      readiness = Math.max(0, Math.min(100, Math.round(rawReadiness)));
    }
    
// ========== 5. محاسبه ضرر کل امروز ==========
const todayTradesList = db.prepare(`
  SELECT profit FROM trades WHERE user_id = ? AND profile_id = ? AND date = ?
`).all(userId, profileId, currentDate);
const todayTotalProfit = todayTradesList.reduce((s, t) => s + (t.profit || 0), 0);

// دریافت حد ضرر روزانه از پروفایل فعال

const dailyLossLimit = activeProfile?.daily_loss_limit || 5;

if (todayTotalProfit < -dailyLossLimit) {
  readiness = Math.max(0, readiness - 20);
  insights.push({ icon: "🛑", text: `امروز ضرر کل شما از ${dailyLossLimit}% گذشته. طبق قانون شخصی، معامله را متوقف کن!` });
} else if (todayTotalProfit < -dailyLossLimit / 2) {
  readiness = Math.max(0, readiness - 10);
  insights.push({ icon: "⚠️", text: `امروز ضرر کل شما از ${dailyLossLimit/2}% گذشته. حجم معاملات را کم کن!` });
}
    
    // ========== 6. ذخیره در دیتابیس ==========
    if (todayMental > 0 || todayAssessment) {
      const existing = db.prepare('SELECT id FROM daily_assessments WHERE user_id = ? AND profile_id = ? AND date = ?').get(userId, profileId, currentDate);
      if (existing) {
        db.prepare('UPDATE daily_assessments SET mental = ?, sleep = ?, stress = ?, momentum = ?, readiness_score = ? WHERE id = ?')
          .run(mental, sleep, stress, momentum, readiness, existing.id);
      } else {
        db.prepare('INSERT INTO daily_assessments (user_id, profile_id, date, mental, sleep, stress, momentum, readiness_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
          .run(userId, profileId, currentDate, mental, sleep, stress, momentum, readiness);
      }
    }
    
    // ========== 7. تولید INSIGHTS ==========
    const todayCount = todayTradesList.length;
    const todayProfit = todayTotalProfit;
    const consecutiveLosses = lastTrades.filter(t => t.profit < 0).length;
    const consecutiveWins = lastTrades.filter(t => t.profit > 0).length;
    
    const messages = {
      readyToTrade: [
        { icon: "✅", text: "همه سیستم‌ها سبز. شرایط برای اجرای استراتژی آماده است." },
        { icon: "🎯", text: "readiness در سطح عالی. به سیستم اعتماد کن و اجرا کن." },
        { icon: "⚡", text: "ذهن آماده، بازار در انتظار. امروز روز توئه." },
        { icon: "🔋", text: "انرژی و تمرکز در اوج. بهترین زمان برای معامله." }
      ],
      cautionToTrade: [
        { icon: "⚠️", text: "وضعیت قابل قبول ولی محتاط باش. حجم معاملات را ۵۰٪ کاهش بده." },
        { icon: "🟡", text: "شرایط متوسط. فقط روی A+ setups تمرکز کن." },
        { icon: "🧐", text: "readiness متوسط. بهتره امروز فقط ۱-۲ معامله انجام بدی." },
        { icon: "📊", text: "وضعیت border-line. قبل از هر معامله ۳ بار چک کن." }
      ],
      notReadyToTrade: [
        { icon: "🛑", text: "readiness پایین. امروز معامله نکن. منتظر روز بهتر باش." },
        { icon: "🧘", text: "ذهن آماده نیست. بهترین معامله امروز، معامله نکردنه." },
        { icon: "📉", text: "شرایط مساعد نیست. استراحت کن و فردا برگرد." },
        { icon: "🔴", text: "ریسک بالا. بازار منتظر میمونه، تو استراحت کن." }
      ],
      momentumNegative: [
        { icon: "📉", text: "روند تریدهای اخیر منفی. قبل از معامله، استراتژی رو مرور کن." },
        { icon: "🔄", text: "در فاز اصلاح هستی. صبر کن تا بازار تایید بده." },
        { icon: "⚠️", text: "۳ ترید آخر ضرر داشتی. احتمال انتقام‌جویی زیاده، محتاط باش." }
      ],
      momentumPositive: [
        { icon: "📈", text: "روند صعودی داری. از این شتاب استفاده کن ولی مدیریت ریسک رو حفظ کن." },
        { icon: "🔥", text: "در فاز سوددهی. به همین روال ادامه بده، ولی اعتمادبه‌نفس کاذب نداشته باش." },
        { icon: "💪", text: "روندت خوبه. موقعیت خوبی برای افزایش حجم (با احتیاط) داری." }
      ],
      momentumNeutral: [
        { icon: "⚖️", text: "روند متعادل. به قوانین پایبند باش و ریسک‌های معمول رو مدیریت کن." },
        { icon: "📊", text: "بدون روند خاص. به استراتژی اصلی پایبند باش." }
      ],
      mentalExcellent: [
        { icon: "🧠💎", text: "تمرکز در سطح حرفه‌ای. ذهن مثل تیغ تیزه، هر فرصتی رو می‌بینی." },
        { icon: "🎯", text: "وضعیت ذهنی عالی. تصمیمات منطقی و بدون احساس." },
        { icon: "⚡", text: "تمرکز بالا = کیفیت معاملات بالا. برو که بدرخشی." }
      ],
      mentalPoor: [
        { icon: "😵", text: "تمرکز پایین. ریسک تصمیمات احساسی بالاست. امروز معامله نکن." },
        { icon: "🧠❌", text: "ذهن آماده نیست. هر تصمیمی بگیری ممکنه پشیمون بشی. استراحت کن." },
        { icon: "🔄", text: "وضعیت ذهنی مناسب نیست. به جای ترید، روی تحلیل و مرور بگذرون." }
      ],
      sleepExcellent: [
        { icon: "😴💪", text: "خواب کافی = انرژی و تمرکز بالا. از این مزیت استفاده کن." },
        { icon: "⚡", text: "خوب خوابیدی، ذهنت هوشیاره. زمان مناسبی برای تحلیل عمیق." }
      ],
      sleepPoor: [
        { icon: "😴⚠️", text: "کمبود خواب = افزایش خطا. حجم معاملات رو ۵۰٪ کاهش بده." },
        { icon: "🛌", text: "خستگی می‌تونه تصمیماتتو خراب کنه. امروز فقط روی A+ setups تمرکز کن." }
      ],
      stressLow: [
        { icon: "😌", text: "استرس پایین => تصمیمات منطقی و بدون فشار. بهترین شرایط برای ترید." },
        { icon: "🧘", text: "آرامش داری، بهترین تصمیمات در این حالت گرفته می‌شه." }
      ],
      stressHigh: [
        { icon: "⚡😫", text: "استرس بالاست. احتمال واکنش هیجانی زیاده. امروز معامله نکن." },
        { icon: "🛑", text: "تحت فشار هستی. بهتره از معامله خودداری کنی تا آروم بشی." },
        { icon: "🧘", text: "استرس رو کنترل کن. چند نفس عمیق بکش، بعد دوباره بررسی کن." }
      ],
      noTrade: [
        { icon: "📭", text: "امروز تریدی نداشتی. گاهی بهترین تصمیم، معامله نکردنه." },
        { icon: "🔄", text: "روز بدون ترید = روز بدون استرس. فردا فرصت بهتری داری." },
        { icon: "📊", text: "معامله نکردن هم یه استراتژی حرفه‌ای‌ست. آفرین." }
      ],
      profitHigh: [
        { icon: "💰🎯", text: "سود عالی! ولی مراقب اعتماد به نفس کاذب باش. فردا از صفر شروع کن." },
        { icon: "🏆", text: "اجرای بی‌نقص. همین روال رو حفظ کن، ولی ریسک رو زیاد نکن." },
        { icon: "🔥", text: "روز عالی. یادت باشه بازار همیشه برگشت میزنه." }
      ],
      profitLow: [
        { icon: "📉", text: "روز نه چندان خوب. تحلیل کن ببین کجا اشتباه کردی." },
        { icon: "🔄", text: "ضرر جزئی از بازی حرفه‌ایه. ازش یاد بگیر و ادامه بده." }
      ],
      lossHigh: [
        { icon: "⚠️💰", text: "ضرر امروز سنگین بود. استراتژی رو مرور کن، شاید نیاز به تنظیم داشته باشه." },
        { icon: "🧠", text: "ضرر رو تحلیل کن. بدون انتقام‌جویی، فردا روز جدیدیه." },
        { icon: "🛑", text: "ضرر بخشی از بازی. امروز رو ببند و فردا با ذهن پاک برگرد." }
      ],
      consecutiveLoss: [
        { icon: "🚨", text: "ضرر متوالی داری. طبق قانون، امروز معامله رو متوقف کن." },
        { icon: "🛑", text: "۳ ضرر پشت سر هم = زمان استراحت. از بازار دور شو." },
        { icon: "🧘", text: "احتمال انتقام‌جویی زیاد شده. بهترین کار استراحته." }
      ],
      consecutiveWin: [
        { icon: "🔥🔥", text: "۳ سود پشت سر هم! عالی، ولی مراقب hubris باش." },
        { icon: "📈", text: "روند عالی، ولی از اعتماد به نفس بیش از حد بپرهیز." },
        { icon: "⚡", text: "ادامه بده، ولی ریسک رو زیاد نکن." }
      ],
      noAssessment: [
        { icon: "🔔", text: "امروز هنوز سنجش انجام ندادی. قبل از هر ترید، وضعیت ذهنت رو ثبت کن." },
        { icon: "📋", text: "سنجش وضعیت اولین قدم برای ترید حرفه‌ای‌ست. همین الان انجام بده." },
        { icon: "🧠", text: "بدون سنجش، نمیتونی از readiness خودت مطمئن باشی. دکمه سنجش رو بزن." }
      ]
    };
    
    insights.length = 0;
    
    if (!hasAssessment && todayMental === 0 && todaySleep === 0 && todayStress === 0) {
      insights.push({ icon: "⚠️", text: rnd(messages.noAssessment) });
    } else if (hasAssessment || (todayMental !== 0 || todaySleep !== 0 || todayStress !== 0)) {
      if (momentum < -0.3) insights.push(rnd(messages.momentumNegative));
      else if (momentum > 0.3) insights.push(rnd(messages.momentumPositive));
      else if (momentum !== 0) insights.push(rnd(messages.momentumNeutral));
      
      if (readiness >= 70) insights.push(rnd(messages.readyToTrade));
      else if (readiness >= 40) insights.push(rnd(messages.cautionToTrade));
      else insights.push(rnd(messages.notReadyToTrade));
      
      if (mental >= 8) insights.push(rnd(messages.mentalExcellent));
      else if (mental < 5) insights.push(rnd(messages.mentalPoor));
      
      if (sleep >= 8) insights.push(rnd(messages.sleepExcellent));
      else if (sleep < 5) insights.push(rnd(messages.sleepPoor));
      
      if (stress <= 3) insights.push(rnd(messages.stressLow));
      else if (stress > 7) insights.push(rnd(messages.stressHigh));
      
      if (todayCount > 0) {
        if (todayProfit > 2) insights.push(rnd(messages.profitHigh));
        else if (todayProfit < -2) insights.push(rnd(messages.lossHigh));
        else if (todayProfit < 0) insights.push(rnd(messages.profitLow));
        if (consecutiveLosses >= 2) insights.push(rnd(messages.consecutiveLoss));
        if (consecutiveWins >= 2) insights.push(rnd(messages.consecutiveWin));
      } else {
        insights.push(rnd(messages.noTrade));
      }
      
      if (hasAssessment && todayCount === 0) {
        insights.push({ icon: "🌅", text: "سنجش ثبت شد. حالا برو سراغ Pre-Trade و بعدش ترید." });
      }
    }
    
 // ========== حذف تکراری و محدودیت به 4 ==========
const unique = [];
const seen = new Set();
for (const ins of insights) {
  const compareKey = ins && typeof ins === 'object' ? ins.text : ins;
  if (!seen.has(compareKey)) {
    seen.add(compareKey);
    unique.push(ins);
  }
}
let finalInsights = unique.slice(0, 4);

while (finalInsights.length < 3) {
  finalInsights.push({ icon: "💡", text: "به سیستم پایبند باش و مدیریت ریسک رو فراموش نکن." });
}

// ✅ تبدیل مقاوم به رشته با پشتیبانی از text تو در تو
function extractTextFromInsight(item) {
  if (typeof item === 'string') return item;
  if (item && typeof item === 'object') {
    let rawText = item.text;
    if (rawText && typeof rawText === 'object') {
      rawText = rawText.text || JSON.stringify(rawText);
    }
    const icon = item.icon || '💡';
    const finalText = rawText || "نکته";
    return `${icon} ${finalText}`;
  }
  return "💡 نکته";
}

const stringInsights = finalInsights.map(extractTextFromInsight);

return NextResponse.json({
  readiness: readiness,
  momentum: momentum.toFixed(2),
  insights: stringInsights
});
    
  } catch (error) {
    console.error('Readiness API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}