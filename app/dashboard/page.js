// app/page.js
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import MentalAssessment from "../../components/MentalAssessment";
import PreTradePage from "../../components/PreTradePage";
import Calendar from "../../components/Calendar";
import Journal from "../../components/Journal";
import Setups from "../../components/Setups";
import ProfitChart from "../../components/ProfitChart";
import ReadinessEngine from "../../components/ReadinessEngine";
import Analytics from "../../components/Analytics";
import MotivationalPopup from "../../components/MotivationalPopup";
import ConfirmDialog from "../../components/ConfirmDialog";
import Settings from "../../components/Settings";


export default function TradingAppUI() {
  const [state, setState] = useState({
    mental: 0,
    sleep: 0,
    stress: 0,
  });
  
  const [showAssessment, setShowAssessment] = useState(false);
  const [preTradeDone, setPreTradeDone] = useState(false);
  const [assessmentDoneToday, setAssessmentDoneToday] = useState(false);
  const [lastAssessment, setLastAssessment] = useState(null);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [trades, setTrades] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshCalendar, setRefreshCalendar] = useState(0);
  const [popupMessage, setPopupMessage] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const isMounted = useRef(true);
  const hasLoadedInitialData = useRef(false);
  const [refreshAnalytics, setRefreshAnalytics] = useState(0);
  const [initialCapital, setInitialCapital] = useState(0);
  const [showPnLInDollar, setShowPnLInDollar] = useState(false);
  const [dailyLossLimitSetting, setDailyLossLimitSetting] = useState(5);
  const [dailyLossLimitReached, setDailyLossLimitReached] = useState(false); 
  const [showDeleteProfileConfirm, setShowDeleteProfileConfirm] = useState(false);
const [profileToDelete, setProfileToDelete] = useState(null);
const [profileModalKey, setProfileModalKey] = useState(0);
 
  // State برای پروفایل
const [profiles, setProfiles] = useState([]);
const [activeProfile, setActiveProfile] = useState(null);
const [showProfileModal, setShowProfileModal] = useState(false);
const [newProfileName, setNewProfileName] = useState("");
const [newProfileCapital, setNewProfileCapital] = useState("");
 // ✅ اضافه کن - State برای ویرایش پروفایل
  const [editingProfileId, setEditingProfileId] = useState(null);
  const [editingProfileName, setEditingProfileName] = useState("");

  // تابع تاریخ ایران
  const getIranDate = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tehran' });
  };

  const getAuthHeaders = () => {
  const user = JSON.parse(localStorage.getItem('trading_user') || '{}');
  console.log('🔐 Current user from localStorage:', user);
  return {
    'x-user-id': user.id?.toString() || '1'
  };
};

const refreshTrades = async (skipWarning = false) => {
  try {
    const headers = getAuthHeaders();
    
    const tradesRes = await fetch('/api/trades', { headers });
    const tradesData = await tradesRes.json();
    setTrades(tradesData);
    updateChartData(tradesData);
    setRefreshAnalytics(prev => prev + 1);
    
    // دریافت مجدد تنظیمات (سرمایه)
    const settingsRes = await fetch('/api/settings', { headers });
    const settingsData = await settingsRes.json();
    setInitialCapital(settingsData.initial_capital || 0);
    setDailyLossLimitSetting(settingsData.daily_loss_limit || 5);
    
    // دریافت مجدد پروفایل‌ها (برای بروزرسانی سرمایه فعلی در مودال)
    const profilesRes = await fetch('/api/profiles', { headers });
    const profilesData = await profilesRes.json();
    if (profilesRes.ok) {
      setProfiles(profilesData.profiles || []);
      setActiveProfile(profilesData.active);
      setProfileModalKey(prev => prev + 1);
    }
    
    if (!skipWarning) {
      await checkDailyLossLimit();
    }
    
    setRefreshCalendar(prev => prev + 1);
    
    console.log('✅ Trades, settings, and profiles refreshed');
  } catch (error) {
    console.error("Error refreshing trades:", error);
  }
};

const loadProfiles = async () => {
  try {
    const headers = getAuthHeaders();
    const res = await fetch('/api/profiles', { headers });
    const data = await res.json();
    console.log('📡 API response:', data); 
    if (res.ok) {
      setProfiles(data.profiles || []);
      setActiveProfile(data.active);
    } else {
      console.error("Error loading profiles:", data.error);
    }
  } catch (error) {
    console.error("Error loading profiles:", error);
  }
};

useEffect(() => {
  loadProfiles();
}, []);
  
  const updateChartData = useCallback((tradesData) => {
    if (!tradesData || tradesData.length === 0) {
      setChartData([]);
      return;
    }

    
    const map = new Map();
    for (const trade of tradesData) {
      const date = trade.date;
      if (!map.has(date)) {
        map.set(date, { date, totalProfit: 0, count: 0 });
      }
      const entry = map.get(date);
      entry.totalProfit += (trade.profit || 0);
      entry.count++;
    }
    
    let sorted = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    let cumulative = 0;
    const result = sorted.map(item => {
      cumulative += item.totalProfit;
      return {
        date: item.date,
        totalProfit: parseFloat(item.totalProfit.toFixed(2)),
        cumulativeProfit: parseFloat(cumulative.toFixed(2)),
        tradeCount: item.count
      };
    });
    setChartData(result);
  }, []);
  
 const loadData = useCallback(async () => {
  try {
    console.log('🔄 loadData started...');
    
    const headers = getAuthHeaders();
    
    const assessmentRes = await fetch('/api/assessments', { headers });
    const assessmentData = await assessmentRes.json();
    
    const settingsRes = await fetch('/api/settings', { headers });
    const settingsData = await settingsRes.json();
    setDailyLossLimitSetting(settingsData.daily_loss_limit || 5);
    setInitialCapital(settingsData.initial_capital || 0);
    
    if (!isMounted.current) return;
    
    if (assessmentData && assessmentData.id) {
      setState({
        mental: assessmentData.mental,
        sleep: assessmentData.sleep,
        stress: assessmentData.stress
      });
      setAssessmentDoneToday(true);
      setLastAssessment(assessmentData);
    } else {
      setAssessmentDoneToday(false);
      setState({ mental: 0, sleep: 0, stress: 0 });
    }
    
    const tradesRes = await fetch('/api/trades', { headers });
    const tradesData = await tradesRes.json();
    
    if (!isMounted.current) return;
    
    setTrades(tradesData);
    updateChartData(tradesData);
    
    const today = getIranDate();
    const savedPreTradeDate = localStorage.getItem("preTradeDate");
    if (savedPreTradeDate === today) {
      setPreTradeDone(true);
    } else {
      setPreTradeDone(false);
      localStorage.removeItem("preTradeDone");
      localStorage.removeItem("preTradeDate");
    }
    
    console.log('✅ loadData completed');
  } catch (error) {
    console.error('❌ loadData error:', error);
  } finally {
    if (isMounted.current) {
      setLoading(false);
    }
  }
}, [updateChartData]);
  
// اول - فقط یک بار در ابتدا
useEffect(() => {
  isMounted.current = true;
  if (!hasLoadedInitialData.current) {
    hasLoadedInitialData.current = true;
    loadData();
  }
  return () => {
    isMounted.current = false;
  };
}, []);
useEffect(() => {
  if (currentPage === "dashboard" && hasLoadedInitialData.current) {
    // فقط اگه از صفحه دیگه اومدی، تازه کن
    const refreshFromStorage = localStorage.getItem("refreshDashboard");
    if (refreshFromStorage === "true") {
      localStorage.removeItem("refreshDashboard");
      loadData();
    }
  }
}, [currentPage]);

  
  // ========== سنجش وضعیت ==========
const handleAssessmentComplete = async (result) => {
  console.log('1️⃣ Assessment completed:', result);
  
  try {
    let finalMental = result.mental;
    let finalStress = result.stress;
    
    const res = await fetch('/api/assessments', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        mental: finalMental,
        sleep: result.sleep,
        stress: finalStress
      })
    });
    
    const data = await res.json();
    console.log("📝 API Response:", data);
    
    if (res.ok) {
      setState({
        mental: finalMental,
        sleep: result.sleep,
        stress: finalStress
      });
      setLastAssessment(result);
      setAssessmentDoneToday(true);
      setShowAssessment(false);
      setRefreshCalendar(prev => prev + 1);
      
      const today = getIranDate();
      const savedCalendar = localStorage.getItem("tradingCalendar");
      const calendarData = savedCalendar ? JSON.parse(savedCalendar) : {};
      calendarData[today] = true;
      localStorage.setItem("tradingCalendar", JSON.stringify(calendarData));
      
      // بارگذاری مجدد داده‌ها
      await loadData();
      
      // ========== تولید پیام هدف و انگیزشی ==========
      let popupData = {};
      
      if (finalMental >= 8 && result.sleep >= 8 && finalStress <= 3) {
        popupData = {
          icon: "🚀",
          title: "🎯 هدف امروز:",
          goal: "اجرای بی‌نقص سیستم معاملاتی",
          motivation: "ذهنت مثل تیغ تیزه، هر فرصتی رو شکار کن!"
        };
      } else if (finalStress > 7) {
        popupData = {
          icon: "🧘",
          title: "🎯 هدف امروز:",
          goal: "مدیریت استرس و حفظ آرامش",
          motivation: "نفس عمیق بکش، بازار همیشه فرصت داره، عجله نکن!"
        };
      } else if (finalMental < 5) {
        popupData = {
          icon: "🎯",
          title: "🎯 هدف امروز:",
          goal: "بازیابی تمرکز و انرژی",
          motivation: "یک قدم به عقب، دو قدم به جلو. امروز استراحت کن، فردا قوی‌تری!"
        };
      } else if (result.sleep < 5) {
        popupData = {
          icon: "⚡",
          title: "🎯 هدف امروز:",
          goal: "مدیریت انرژی و کاهش حجم معاملات",
          motivation: "خستگی دشمن تصمیمات درسته، فقط روی بهترین فرصت‌ها تمرکز کن!"
        };
      } else {
        popupData = {
          icon: "💎",
          title: "🎯 هدف امروز:",
          goal: "پایبندی به قوانین و روتین معاملاتی",
          motivation: "شرایط خوبه، به سیستم اعتماد کن و بدرخش!"
        };
      }
      
      setPopupMessage(popupData);
      
    } else {
      console.error("Error saving assessment:", data);
      alert('Error saving assessment');
    }
  } catch (error) {
    console.error("Fetch error:", error);
    alert('Error saving assessment');
  }
};
  
  // ========== مدیتیشن ==========
 const handleMeditationComplete = async (meditationResult) => {


    // ذخیره در localStorage
  localStorage.setItem("meditationScore", meditationResult.score);
  localStorage.setItem("meditationImpact", meditationResult.impact);
  localStorage.setItem("meditationDate", getIranDate());
    
  
   
    
    // رفرش readiness engine
    setRefreshCalendar(prev => prev + 1);
 
  // اگر تأثیر منفی بود، هیچ کاری انجام نده
};
  
  // ========== ریست سنجش ==========
const resetTodayAssessment = async () => {
  const today = getIranDate();
  console.log("🗑️ Reset - Today Iran:", today);
  
  try {
    const res = await fetch(`/api/assessments?date=${today}`, { 
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    console.log("🗑️ Reset response:", data);
    
    if (res.ok && data.deleted > 0) {
      // پاک کردن از localStorage تقویم
      const savedCalendar = localStorage.getItem("tradingCalendar");
      if (savedCalendar) {
        const calendarData = JSON.parse(savedCalendar);
        delete calendarData[today];
        localStorage.setItem("tradingCalendar", JSON.stringify(calendarData));
      }
      
      // پاک کردن Pre-Trade
      localStorage.removeItem("preTradeDone");
      localStorage.removeItem("preTradeDate");
      localStorage.removeItem("meditationScore");
      localStorage.removeItem("meditationImpact");
      localStorage.removeItem("meditationDate");
      
      // به‌روزرسانی stateها
      setState({ mental: 0, sleep: 0, stress: 0 });
      setAssessmentDoneToday(false);
      setLastAssessment(null);
      setPreTradeDone(false);
      setDailyLossLimitReached(false);
      
      // رفرش داده‌ها
      await loadData();
      await loadProfiles();
      setRefreshCalendar(prev => prev + 1);
      setRefreshAnalytics(prev => prev + 1);
      setProfileModalKey(prev => prev + 1);
    }
  } catch (error) {
    console.error('Error deleting assessment:', error);
  }
};

const handleResetClick = () => {
  setShowResetConfirm(true);
};

const handleConfirmReset = async () => {
  setShowResetConfirm(false);
  await resetTodayAssessment();
};
  
  const getTodayStatus = () => {
    if (!assessmentDoneToday) return { label: "سنجش انجام نشده", color: "gray" };
    if (state.stress > 7) return { label: "آماده ترید نیستی", color: "red" };
    if (state.mental < 5) return { label: "بی‌تمرکز", color: "red" };
    if (state.sleep < 5) return { label: "خسته", color: "yellow" };
    return { label: "آماده ترید", color: "green" };
  };
  
  const todayStatus = getTodayStatus();
  
  const getMetricColor = (value, type) => {
    if (type === "stress") {
      if (value <= 3) return { color: "#22c55e", bg: "rgba(34,197,94,0.15)", label: "Low" };
      if (value <= 6) return { color: "#eab308", bg: "rgba(234,179,8,0.15)", label: "Medium" };
      return { color: "#ef4444", bg: "rgba(239,68,68,0.15)", label: "High" };
    } else {
      if (value <= 3) return { color: "#ef4444", bg: "rgba(239,68,68,0.15)", label: "Poor" };
      if (value <= 6) return { color: "#eab308", bg: "rgba(234,179,8,0.15)", label: "Fair" };
      return { color: "#22c55e", bg: "rgba(34,197,94,0.15)", label: "Excellent" };
    }
  };
  
  const getStatusLabel = (value, type) => {
    if (value === 0) return "ثبت نشده";
    if (type === "stress") {
      if (value <= 3) return " عالی";
      if (value <= 6) return " قابل قبول";
      return " زیاد";
    } else {
      if (value >= 8) return " عالی";
      if (value >= 5) return " قابل قبول";
      return " ضعیف";
    }
  };
  
  const MetricCard = ({ title, value, type, icon }) => {
    const metric = getMetricColor(value, type);
    const displayValue = assessmentDoneToday ? value : 0;
    const statusLabel = getStatusLabel(displayValue, type);
    
    return (
      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
        <Card className="relative overflow-hidden bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-zinc-700">
          <div className="absolute -bottom-10 -right-10 w-32 h-32 blur-3xl opacity-20" style={{ background: metric.color }} />
          <CardContent className="p-4 relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-400 text-sm">{title}</span>
              <span className="text-lg">{icon}</span>
            </div>
            <div className="flex items-end gap-2">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold tracking-tight"
                style={{ color: displayValue > 0 ? metric.color : "#3f3f46" }}
              >
                {displayValue}
              </motion.span>
              <span className="text-xs text-zinc-500 mb-1">از 10</span>
            </div>
            <div className="mt-1 text-xs" style={{ color: displayValue > 0 ? metric.color : "#71717a" }}>
              {statusLabel}
            </div>
            <div className="mt-3 relative h-2 rounded-full bg-zinc-800 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${displayValue * 10}%` }}
                transition={{ duration: 0.6 }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${metric.color}, ${metric.color}aa)` }}
              />
              <div className="absolute inset-0 blur-sm opacity-30" style={{ background: metric.color }} />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };
  
  const canTrade = () => {
    if (!assessmentDoneToday) return false;
    if (state.stress > 7) return false;
    if (state.mental < 5) return false;

    // ✅ بررسی حد ضرر روزانه
  if (dailyLossLimitReached) return false;

    return true;
  };
  
  const isLockedForPsychology = () => {
    if (!assessmentDoneToday) return true;
    if (state.stress > 7) return true;
    if (state.mental < 5) return true;
    return false;
  };
  
  const handleOpenPreTrade = () => {
    if (assessmentDoneToday && canTrade() && !preTradeDone) {
      setCurrentPage("pretrade");
    }
  };
  
  const handlePreTradeComplete = () => {
    const today = getIranDate();
    setPreTradeDone(true);
    setCurrentPage("dashboard");
    localStorage.setItem("preTradeDone", "true");
    localStorage.setItem("preTradeDate", today);
    localStorage.setItem("refreshDashboard", "true");
      setRefreshAnalytics(prev => prev + 1);  // ✅ اضافه کن
  };
  
  const totalProfitUsd = trades.reduce((s, t) => s + (t.profit_usd || 0), 0);
const totalProfitPercent = initialCapital > 0 ? (totalProfitUsd / initialCapital) * 100 : 0;
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }
  
// ========== مدیریت پروفایل ==========
const createNewProfile = async () => {
  if (!newProfileName) {
    alert("لطفاً نام پروفایل را وارد کنید");
    return;
  }
  try {
    const res = await fetch('/api/profiles', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
     body: JSON.stringify({ 
        name: newProfileName
      })
    });
    if (res.ok) {
      const data = await res.json();
      setNewProfileName("");
      await loadProfiles();
      
      // سوییچ خودکار به پروفایل جدید
      if (data.id) {
        await switchToProfile(data.id);
      } else {
        window.location.reload();
      }
    } else {
      const errorData = await res.json();
      alert(errorData.error || "خطا در ایجاد پروفایل");
    }
  } catch (error) {
    console.error("Error creating profile:", error);
    alert("خطا در ایجاد پروفایل");
  }
};



const switchToProfile = async (profileId) => {
  try {
    const res = await fetch('/api/profiles', {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ profileId })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      // پاک کردن داده‌های موقت localStorage
      localStorage.removeItem("preTradeDone");
      localStorage.removeItem("preTradeDate");
      localStorage.removeItem("meditationScore");
      localStorage.removeItem("meditationImpact");
      localStorage.removeItem("meditationDate");
      
      // بارگذاری مجدد پروفایل‌ها و داده‌ها
      await loadProfiles();
      await loadData();
      
      // بستن مودال
      setShowProfileModal(false);
      
      // رفرش کامپوننت‌ها
      setRefreshCalendar(prev => prev + 1);
      setRefreshAnalytics(prev => prev + 1);
      setProfileModalKey(prev => prev + 1);
      
      // رفرش صفحه برای اطمینان از اعمال تغییرات
      window.location.reload();
    } else {
      alert("خطا در تغییر پروفایل: " + (data.error || "خطای ناشناخته"));
    }
  } catch (error) {
    console.error("Error switching profile:", error);
    alert("خطا در تغییر پروفایل");
  }
};
// ========== ویرایش پروفایل ==========
const updateProfile = async (profileId, newName, newCapital) => {
  try {
    const res = await fetch('/api/profiles', {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ 
        profileId, 
        name: newName, 
        current_capital: newCapital 
      })
    });
    if (res.ok) {
      await loadProfiles();
      window.location.reload();
    } else {
      alert("خطا در ویرایش پروفایل");
    }
  } catch (error) {
    console.error("Error updating profile:", error);
  }
};

// ========== حذف پروفایل ==========
const openDeleteProfileConfirm = (profile) => {
  setProfileToDelete(profile);
  setShowDeleteProfileConfirm(true);
  setShowProfileModal(false);  // ✅ بستن مودال اصلی
};

const confirmDeleteProfile = async () => {
  if (!profileToDelete) return;
  
  try {
    const res = await fetch('/api/profiles', {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ profileId: profileToDelete.id })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      setShowDeleteProfileConfirm(false);
      setProfileToDelete(null);
      await loadProfiles();
      
      if (activeProfile?.id === profileToDelete.id) {
        window.location.href = window.location.pathname;
      } else {
        window.location.reload();
      }
    } else {
      alert(data.error || "خطا در حذف پروفایل");
      setShowDeleteProfileConfirm(false);
      setShowProfileModal(true);  // ✅ برگرداندن مودال اصلی در صورت خطا
    }
  } catch (error) {
    console.error("Error deleting profile:", error);
    alert("خطا در حذف پروفایل");
    setShowDeleteProfileConfirm(false);
    setShowProfileModal(true);   // ✅ برگرداندن مودال اصلی در صورت خطا
  }
};

// ========== بررسی حد ضرر روزانه ==========
const checkDailyLossLimit = async () => {
  const today = getIranDate();
  const dailyLossLimit = parseFloat(dailyLossLimitSetting) || 5;
  
  try {
    const headers = getAuthHeaders();
    const tradesRes = await fetch('/api/trades', { headers });
    const allTrades = await tradesRes.json();
    const todayTrades = allTrades.filter(t => t.date === today);
    const todayNetProfit = todayTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
    
    if (todayNetProfit < -dailyLossLimit) {
      setDailyLossLimitReached(true);
      setPopupMessage({
        icon: "🛑🔥",
        title: "⚠️ هشدار فوری - حد ضرر روزانه",
        goal: `⚠️ امروز ${Math.abs(todayNetProfit).toFixed(1)}% ضرر کرده‌اید!`,
        motivation: `⚠️ حد ضرر شما ${dailyLossLimit}% است. طبق قانون مدیریت سرمایه، امروز دیگر معامله نکنید!`,
        isWarning: true
      });
      return true;
    } else {
      setDailyLossLimitReached(false);
      return false;
    }
  } catch (error) {
    console.error("Error checking daily loss:", error);
    return false;
  }
};
  const renderDashboard = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <motion.div
        initial={{ scale: 0.98 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300 }}
        className={`relative overflow-hidden rounded-2xl p-6 ${
          todayStatus.color === "green" ? "bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30" :
          todayStatus.color === "yellow" ? "bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border border-yellow-500/30" :
          todayStatus.color === "red" ? "bg-gradient-to-r from-red-900/30 to-rose-900/30 border border-red-500/30" :
          "bg-gradient-to-r from-zinc-800 to-zinc-900 border border-zinc-700"
        }`}
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-left">
             <div className="flex items-center gap-3">
  <div className={`text-2xl font-bold ${totalProfitPercent >= 0 ? "text-green-400" : "text-red-400"}`}>
    PnL: {showPnLInDollar ? (
      <span>${totalProfitUsd.toFixed(2)}</span>
    ) : (
      <span>{totalProfitPercent >= 0 ? "+" : ""}{totalProfitPercent.toFixed(1)}%</span>
    )}
  </div>
  
  {/* دکمه پریمیوم Toggle */}
  <button
    onClick={() => setShowPnLInDollar(!showPnLInDollar)}
    className="relative group px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 overflow-hidden"
    style={{
      background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.15))",
      border: "1px solid rgba(16,185,129,0.3)",
      backdropFilter: "blur(4px)",
    }}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-sky-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <span className="relative flex items-center gap-1.5">
      {showPnLInDollar ? (
        <>
          <span className="text-emerald-400">📊</span>
          <span className="text-gray-300"> </span>
        </>
      ) : (
        <>
          <span className="text-sky-400">💰</span>
          <span className="text-gray-300"> </span>
        </>
      )}
    </span>
  </button>
</div>
            </div>
            <div className="flex-1 flex justify-center">
              {!assessmentDoneToday ? (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowAssessment(true)}
                  className="relative flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 overflow-visible group"
                  style={{
                    background: "rgba(184, 184, 184, 0.18)",
                    border: "1px solid rgba(192, 194, 186, 0.5)",
                    color: "#77bda0",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  <div 
                    className="absolute inset-0 rounded-full animate-pulse-glow"
                    style={{
                      background: "radial-gradient(circle at center, rgba(115, 129, 125, 0.4), transparent 80%)",
                      opacity: 0.6,
                    }} 
                  />
                  <div className="relative flex items-center gap-2">
                    <span>🧠</span>
                    <span>سنجش وضعیت</span>
                  </div>
                </motion.button>
              ) : (
                <div className="text-center" />
              )}
            </div>
            <div className="flex-1 text-right">
              <p className="text-xs text-gray-400 mb-1">وضعیت امروز</p>
              <h2 className="text-3xl font-bold" style={{ color: todayStatus.color === "green" ? "#22c55e" : todayStatus.color === "yellow" ? "#eab308" : todayStatus.color === "red" ? "#ef4444" : "#a1a1aa" }}>
                {todayStatus.label}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {assessmentDoneToday ? "سنجش انجام شده" : "برای ترید کردن نیاز هست"}
              </p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl" />
      </motion.div>
      
      <div className="grid grid-cols-3 gap-4">
        <MetricCard title="Mental State" value={state.mental} type="mental" icon="🧠" />
        <MetricCard title="Sleep Quality" value={state.sleep} type="mental" icon="😴" />
        <MetricCard title="Stress Level" value={state.stress} type="stress" icon="⚡" />
      </div>
      
      <ReadinessEngine
  todayMental={state.mental} 
  todaySleep={state.sleep} 
  todayStress={state.stress} 
  refreshTrigger={refreshCalendar} 
/> 

      
      <Card className="bg-zinc-900/50 border border-zinc-800 rounded-xl">
        <CardContent className="p-5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-300">PERFORMANCE</h3>
              <p className="text-xs text-gray-500 mt-0.5">Daily profit & loss tracking</p>
            </div>
          </div>
          <ProfitChart trades={trades} />
        </CardContent>
      </Card>
      
      {assessmentDoneToday && preTradeDone && (
        <div className="bg-green-900/20 border border-green-500 rounded-2xl p-4">
          <span className="text-green-400 text-sm">✅ Ready to trade - Good luck!</span>
        </div>
      )}
    </motion.div>
  );
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 to-black">
      <div className="p-6 flex gap-5 max-w-[1600px] mx-auto">
        {/* سایدبار */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative overflow-hidden bg-zinc-900/30 backdrop-blur-xl rounded-2xl border border-white/10 h-fit sticky top-6 w-[260px] p-4"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        <div className="mb-6">
  <button
    onClick={() => setShowProfileModal(true)}
    className="w-full flex items-center gap-3 p-2 rounded-xl bg-gradient-to-r from-emerald-500/10 to-sky-500/10 border border-white/10 hover:border-emerald-500/30 transition-all duration-200 group"
  >
    <div className="relative">
      <div className="absolute inset-0 bg-emerald-500/30 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/25">
        <span className="text-white font-bold text-sm">TP</span>
      </div>
    </div>
    <div className="flex-1 text-left">
      <h2 className="text-sm font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Trading Pro</h2>
      <div className="flex items-center gap-1 mt-0.5">
        <span className="text-[9px] text-emerald-400">📁</span>
        <p className="text-[10px] text-gray-400">{activeProfile?.name || "Default"}</p>
      </div>
    </div>
    <div className="text-gray-500 group-hover:text-emerald-400 transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    </div>
  </button>
</div>
          <ul className="space-y-1.5">
            {[
              { id: "dashboard", label: "Dashboard", icon: "📊", desc: "Overview", locked: false },
              { id: "pretrade", label: "Pre-Trade", icon: "🧘", desc: "Preparation", locked: !assessmentDoneToday || !canTrade() || preTradeDone },
              { id: "journal", label: "Journal", icon: "📔", desc: "Trades", locked: isLockedForPsychology() },
              { id: "setups", label: "Setups", icon: "📸", desc: "Library", locked: isLockedForPsychology() },
              { id: "analytics", label: "Analytics", icon: "📈", desc: "Insights", locked: false },
              { id: "settings", label: "Settings", icon: "⚙️", desc: "Capital & Commission", locked: false },
            ].map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    if (document.activeElement && document.activeElement.blur) {
                      document.activeElement.blur();
                    }
                    if (item.locked) return;
                    if (item.id === "pretrade") handleOpenPreTrade();
                    else if (item.id === "journal") setCurrentPage("journal");
                    else if (item.id === "setups") setCurrentPage("setups");
                    else if (item.id === "analytics") setCurrentPage("analytics");
                    else if (item.id === "dashboard") setCurrentPage("dashboard");
                    else if (item.id === "settings") setCurrentPage("settings");
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.blur();
                    e.preventDefault();
                  }}
                  disabled={item.locked}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-200
                    focus:outline-none focus:ring-0 active:outline-none
                    ${currentPage === item.id 
                      ? "bg-gradient-to-r from-emerald-500/15 to-emerald-600/10 border border-emerald-500/30 shadow-sm shadow-emerald-500/10 hover:from-emerald-500/15 hover:to-emerald-600/10" 
                      : item.locked
                        ? "text-zinc-600 cursor-not-allowed opacity-50"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                    }
                  `}
                >
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className="text-[10px] text-gray-500">{item.desc}</div>
                  </div>
                  {item.locked && <span className="text-xs text-gray-600">🔒</span>}
                  {item.id === "pretrade" && preTradeDone && <span className="text-xs text-emerald-400">✓</span>}
                </button>
              </li>
            ))}
          </ul>
          <Calendar refreshTrigger={refreshCalendar} />
          <Button 
            onClick={handleResetClick}
            className="mt-3 w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs py-2 rounded-xl transition-all duration-200 outline outline-1 outline-rose-500/20"
          >
            🔄 Reset Today
          </Button>
          
          <div className="mt-4 pt-3 border-t border-white/10 text-center">
            <p className="text-[10px] text-gray-600">© 2026 Trading Pro</p>
            <p className="text-[9px] text-gray-700">instagram: 0xfutures</p>
          </div>
        </motion.div>
        
        {/* محتوای اصلی */}
        <div className="flex-1">
          {currentPage === "dashboard" && renderDashboard()}
          {currentPage === "pretrade" && (
            <PreTradePage 
              onComplete={handlePreTradeComplete}
              onBack={() => setCurrentPage("dashboard")}
              onMeditationComplete={handleMeditationComplete}
            />
          )}
          {currentPage === "journal" && <Journal onTradeUpdate={(isDelete = false) => refreshTrades(isDelete)}  />}
          {currentPage === "setups" && <Setups />}
          {currentPage === "analytics" &&<Analytics refreshTrigger={refreshAnalytics} />}
          {currentPage === "settings" && <Settings />}
        </div>
        
        {/* مودال‌ها */}
        {showAssessment && (
          <MentalAssessment 
            onComplete={handleAssessmentComplete}
            onClose={() => setShowAssessment(false)}
          />
        )}
        
     {popupMessage && (
  <MotivationalPopup 
    message={popupMessage} 
    onClose={() => setPopupMessage(null)} 
    duration={popupMessage.isWarning ? 10000 : 8000}
  />
)}


        
        {showResetConfirm && (
          <ConfirmDialog
            isOpen={showResetConfirm}
            onClose={() => setShowResetConfirm(false)}
            onConfirm={handleConfirmReset}
            title="🗑️ پاک کردن سنجش امروز"
            message="آیا مطمئنی که می‌خوای سنجش امروز رو پاک کنی؟ تمام داده‌های امروز (سنجش وضعیت و Pre-Trade) حذف می‌شه."
            confirmText="بله، پاک کن"
            cancelText="نه، منصرف شدم"
          />
        )}
      </div>
{/* مودال پروفایل */}
{showProfileModal && (
  <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
    <div className="w-full max-w-md bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
          👤 مدیریت پروفایل‌ها
        </h2>
        <button onClick={() => setShowProfileModal(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
      </div>
      
      <div className="space-y-4" style={{ direction: "rtl", textAlign: "right" }}>

        {/* ساخت پروفایل جدید */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <label className="block text-sm text-gray-400 mb-2">➕ پروفایل جدید</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="نام پروفایل"
              className="flex-1 bg-zinc-800 p-2 rounded-xl text-white text-sm outline outline-1 outline-white/10 focus:outline-emerald-500/50"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
            />
            <button 
              onClick={createNewProfile}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium shadow-lg shadow-emerald-500/25"
            >
              ایجاد
            </button>
          </div>
        </div>
        
        {/* لیست پروفایل‌ها */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <label className="block text-sm text-gray-400 mb-2">📋 پروفایل‌های موجود</label>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {profiles.map(profile => {
              const isEditing = editingProfileId === profile.id;
              
              return (
                <div 
                  key={profile.id}
                  className={`p-3 rounded-xl transition-all duration-200 ${
                    activeProfile?.id === profile.id 
                      ? "bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30" 
                      : "bg-white/5 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="text"
                        value={editingProfileName}
                        onChange={(e) => setEditingProfileName(e.target.value)}
                        className="flex-1 bg-zinc-800 p-2 rounded-lg text-white text-sm outline outline-1 outline-emerald-500/50 focus:outline-emerald-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updateProfile(profile.id, editingProfileName, profile.current_capital);
                            setEditingProfileId(null);
                            setEditingProfileName("");
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          updateProfile(profile.id, editingProfileName, profile.current_capital);
                          setEditingProfileId(null);
                          setEditingProfileName("");
                        }}
                        className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                      >
                        ✅
                      </button>
                      <button
                        onClick={() => {
                          setEditingProfileId(null);
                          setEditingProfileName("");
                        }}
                        className="p-1.5 rounded-lg bg-white/10 text-gray-400 hover:bg-white/20 transition-colors"
                      >
                        ❌
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => switchToProfile(profile.id)}
                      >
                        <div className="font-medium text-white text-sm">{profile.name}</div>
                        <div className="text-xs text-gray-400">سرمایه: ${profile.current_capital?.toFixed(2)}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        {activeProfile?.id === profile.id && (
                          <span className="text-emerald-400 text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 ml-2">✓ فعال</span>
                        )}
                        <button
                          onClick={() => {
                            setEditingProfileId(profile.id);
                            setEditingProfileName(profile.name);
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-sky-400 transition-colors"
                          title="ویرایش نام"
                        >
                          ✏️
                        </button>
                        {profile.name !== "Default" && (
                          <button
                            onClick={() => openDeleteProfileConfirm(profile)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-rose-400 transition-colors"
                            title="حذف"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {profiles.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">هیچ پروفایلی وجود ندارد</div>
            )}
          </div>
        </div>
        
        <button 
          onClick={() => setShowProfileModal(false)}
          className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 transition-all duration-200"
        >
          بستن
        </button>
        <button 
  onClick={() => {
    localStorage.removeItem('trading_user');
    window.location.href = '/login';
  }}
  className="w-full py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all duration-200 border border-red-500/30 mt-2"
>
  🚪 خروج از حساب
</button>
      </div>
    </div>
  </div>
)}

{/* مودال تأیید حذف پروفایل */}
{showDeleteProfileConfirm && profileToDelete && (
  <div 
    className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
    style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)', backdropFilter: 'blur(4px)' }}
  >
    <div className="w-full max-w-md bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl border border-rose-500/30 p-6 shadow-2xl shadow-rose-500/20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
          <span className="text-2xl">🗑️</span>
        </div>
        <h2 className="text-xl font-bold text-white">حذف پروفایل</h2>
      </div>
      
      <div className="space-y-4 text-right" style={{ direction: "rtl" }}>
        <p className="text-gray-300">
          آیا از حذف پروفایل <span className="text-rose-400 font-bold">{profileToDelete.name}</span> مطمئن هستید؟
        </p>
        
   <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
  <p className="text-xs text-white flex items-center gap-2">
    <span>⚠️</span> تمام اطلاعات زیر برای همیشه حذف خواهند شد:
  </p>
  <ul className="text-xs text-gray-300 mt-2 space-y-1 pr-5">
    <li>• 📊 تریدها</li>
    <li>• 📸 ستاپ‌ها</li>
    <li>• 🧠 سنجش‌ها</li>
    <li>• 📋 قوانین معاملاتی</li>
  </ul>
</div>
        
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => {
              setShowDeleteProfileConfirm(false);
              setProfileToDelete(null);
              setShowProfileModal(true);
            }}
            className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 transition-all"
          >
            انصراف
          </button>
          <button
            onClick={confirmDeleteProfile}
            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-semibold shadow-lg shadow-rose-500/25 transition-all hover:scale-[1.02]"
          >
            بله، حذف شود
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
 
)
}