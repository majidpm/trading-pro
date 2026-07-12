"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import MeditationModal from "./MeditationModal";

const getAuthHeaders = () => {
  const user = JSON.parse(localStorage.getItem('trading_user') || '{}');
  return {
    'x-user-id': user.id?.toString() || '1'
  };
};

export default function PreTradePage({ onComplete, onBack, onMeditationComplete }) {
  const [completedSteps, setCompletedSteps] = useState({
    step1: false,
    step2: false,
    step3: false,
  });
  
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [meditationDuration, setMeditationDuration] = useState(300);
  const [showMeditationModal, setShowMeditationModal] = useState(false);
  
  // قوانین
  const [savedRules, setSavedRules] = useState([]);
  const [showEditRules, setShowEditRules] = useState(false);
  const [editRules, setEditRules] = useState([""]);
  
  // ستاپ‌ها
  const [savedSetups, setSavedSetups] = useState([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedSetup, setSelectedSetup] = useState(null);
  const [showSetupDetail, setShowSetupDetail] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const rulesRes = await fetch('/api/rules', { headers: getAuthHeaders() });
      if (rulesRes.ok) {
        const rulesData = await rulesRes.json();
        if (rulesData && rulesData.length > 0) {
          setSavedRules(rulesData);
          setCompletedSteps(prev => ({ ...prev, step1: true }));
        }
      }
      
      const setupsRes = await fetch('/api/setups', { headers: getAuthHeaders() });
      if (setupsRes.ok) {
        const allSetups = await setupsRes.json();
        const aplusSetups = allSetups.filter(s => s.type === 'aplus');
        setSavedSetups(aplusSetups);
        if (aplusSetups.length > 0) {
          setCompletedSteps(prev => ({ ...prev, step2: true }));
        }
      }
    } catch (error) {
      console.error('Error loading pre-trade data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ========== قوانین ==========
  const addNewRule = () => setEditRules([...editRules, ""]);
  const removeRule = (index) => setEditRules(editRules.filter((_, i) => i !== index));
  const updateRule = (index, value) => {
    const newRules = [...editRules];
    newRules[index] = value;
    setEditRules(newRules);
  };

  const saveRules = async () => {
    const validRules = editRules.filter(rule => rule.trim() !== "");
    if (validRules.length === 0) {
      alert("لطفاً حداقل یک قانون وارد کنید");
      return;
    }
    
    try {
      const res = await fetch('/api/rules', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    ...getAuthHeaders()
  },
  body: JSON.stringify({ rules: validRules })
});
      
      if (res.ok) {
        setSavedRules(validRules);
        setShowEditRules(false);
        setCompletedSteps(prev => ({ ...prev, step1: true }));
        if (activeStep === 1) setActiveStep(2);
      } else {
        alert('خطا در ذخیره قوانین');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('خطا در ذخیره قوانین');
    }
  };

  const startEditRules = () => {
    setEditRules([...savedRules]);
    setShowEditRules(true);
  };

  const allStepsCompleted = completedSteps.step1 && completedSteps.step2 && completedSteps.step3;

  if (loading) {
    return (
      <div className="col-span-3 flex justify-center items-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-3">
      {/* هدر پریمیوم */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-purple-500/10 border border-white/10 p-6 mb-6">
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="relative z-10 text-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 via-sky-400 to-purple-400 bg-clip-text text-transparent">
            🧘 Pre-Trade Routine
          </h1>
          <p className="text-gray-400 text-sm mt-1">آماده‌سازی ذهن قبل از معامله</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs mb-3">
          {[
            { id: 1, name: "قوانین", icon: "📝", completed: completedSteps.step1 },
            { id: 2, name: "ستاپ A+", icon: "📸", completed: completedSteps.step2 },
            { id: 3, name: "مدیتیشن", icon: "🧘", completed: completedSteps.step3 }
          ].map((step) => (
            <div key={step.id} className="flex flex-col items-center gap-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-300 ${
                step.completed 
                  ? "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30" 
                  : activeStep === step.id
                    ? "bg-gradient-to-br from-sky-500 to-sky-600 shadow-lg shadow-sky-500/30"
                    : "bg-white/10"
              }`}>
                {step.completed ? "✅" : step.icon}
              </div>
              <span className={`text-[10px] ${step.completed ? "text-emerald-400" : activeStep === step.id ? "text-sky-400" : "text-gray-500"}`}>
                {step.name}
              </span>
            </div>
          ))}
        </div>
        <div className="relative w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 via-sky-500 to-purple-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(Object.values(completedSteps).filter(Boolean).length / 3) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* 3 کارت مرحله */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { id: 1, title: "قوانین شخصی", icon: "📝", desc: "مرور قوانین معاملاتی", completed: completedSteps.step1 },
          { id: 2, title: "ستاپ‌های A+", icon: "📸", desc: "بررسی ستاپ‌های برتر", completed: completedSteps.step2 },
          { id: 3, title: "مدیتیشن", icon: "🧘", desc: "تمرکز و آرامش ذهن", completed: completedSteps.step3 }
        ].map((item) => (
          <div
            key={item.id}
            onClick={() => setActiveStep(item.id)}
            className={`cursor-pointer rounded-2xl p-4 text-center transition-all duration-200 ${
              activeStep === item.id
                ? "bg-gradient-to-br from-sky-500/20 to-sky-600/10 border-2 border-sky-500/50 shadow-lg shadow-sky-500/20"
                : item.completed
                  ? "bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/30"
                  : "bg-white/5 border border-white/10"
            }`}
          >
            <div className="text-4xl mb-2">{item.icon}</div>
            <h3 className="font-bold text-white text-sm">{item.title}</h3>
            <p className="text-[10px] text-gray-400 mt-1">{item.desc}</p>
            {item.completed && (
              <div className="mt-2 text-[10px] text-emerald-400 flex items-center justify-center gap-1">
                <span>✅</span> انجام شد
              </div>
            )}
          </div>
        ))}
      </div>

      {/* محتوای اصلی */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl" />
        <CardContent className="p-6 relative z-10">
          
          {/* ==================== مرحله 1: قوانین ==================== */}
          {activeStep === 1 && (
            <div style={{ direction: "rtl" }}>
              {savedRules.length === 0 ? (
                <div>
                  <h2 className="text-xl font-bold text-center mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                    📝 قوانین شخصی خودت رو بنویس
                  </h2>
                  <p className="text-gray-400 text-center text-sm mb-6">
                    قوانینی که قبل از هر ترید باید رعایت کنی
                  </p>
                  
                  <div className="space-y-3 mb-4">
                    {editRules.map((rule, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25">
                          <span className="text-white text-sm font-bold">{index + 1}</span>
                        </div>
                        <input 
                          type="text" 
                          placeholder={`قانون ${index + 1}`} 
                          className="flex-1 bg-white/5 p-3 rounded-xl text-white border border-white/10 focus:border-emerald-500/50 focus:outline-none transition-all text-right" 
                          value={rule} 
                          onChange={(e) => updateRule(index, e.target.value)} 
                        />
                        {editRules.length > 1 && (
                          <Button onClick={() => removeRule(index)} className="bg-rose-500/20 hover:bg-rose-500/40 px-3 rounded-xl text-rose-400">❌</Button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <Button onClick={addNewRule} className="bg-white/5 hover:bg-white/10 w-full mb-4 rounded-xl text-gray-300 border border-white/10">
                    + اضافه کردن قانون جدید
                  </Button>
                  
                  <Button onClick={saveRules} className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white w-full rounded-xl font-semibold py-3 shadow-lg shadow-emerald-500/25">
                    ذخیره قوانین
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-emerald-400">📋 قوانین شخصی تو</h2>
                    <Button onClick={startEditRules} className="bg-amber-500/20 hover:bg-amber-500/30 rounded-xl text-amber-400">
                      ✏️ ویرایش
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {savedRules.map((rule, index) => (
                      <div key={index} className="p-3 rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 to-transparent">
                        <div className="flex gap-3">
                          <span className="text-emerald-400 font-bold">{index + 1}.</span>
                          <span className="text-white">{rule}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {!completedSteps.step1 && (
                    <Button onClick={() => setCompletedSteps(prev => ({ ...prev, step1: true }))} className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white w-full mt-4 rounded-xl py-3 shadow-lg shadow-emerald-500/25">
                      قوانین رو خوندم و قبول دارم ✅
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ==================== مرحله 2: ستاپ‌ها ==================== */}
          {activeStep === 2 && (
            <div>
              {savedSetups.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4 opacity-50">📭</div>
                  <p className="text-gray-400">هنوز ستاپ A+ ای نداری</p>
                  <Button 
                    onClick={() => window.location.href = '/setups'}
                    className="bg-gradient-to-r from-sky-500 to-sky-600 text-white mt-4 rounded-xl shadow-lg shadow-sky-500/25"
                  >
                    + اضافه کردن ستاپ A+
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-emerald-400">📸 ستاپ‌های A+ تو</h2>
                    <Button 
                      onClick={() => window.location.href = '/setups'}
                      className="bg-white/5 hover:bg-white/10 rounded-xl text-sm"
                    >
                      مدیریت ستاپ‌ها
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                    {savedSetups.map((setup, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setSelectedSetup(setup);
                          setShowSetupDetail(true);
                        }}
                        className="bg-gradient-to-r from-white/5 to-transparent p-3 rounded-xl flex items-center gap-4 border border-white/10 cursor-pointer transition-all duration-200 hover:border-emerald-500/50"
                      >
                        {setup.image && (
                          <img 
                            src={setup.image} 
                            alt={setup.name} 
                            className="w-16 h-16 rounded-xl object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-bold text-white text-right">{setup.name}</h3>
                          <div className="flex items-center gap-2 mt-1 justify-end">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 text-yellow-400">
                              ⭐ A+
                            </span>
                            {setup.rr && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400">
                                R:R {setup.rr}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-2xl">📈</div>
                      </div>
                    ))}
                  </div>
                  {!completedSteps.step2 && (
                    <Button onClick={() => setCompletedSteps(prev => ({ ...prev, step2: true }))} className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white w-full mt-4 rounded-xl py-3 shadow-lg shadow-emerald-500/25">
                      ستاپ‌ها رو مرور کردم و آماده‌ام ✅
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ==================== مرحله 3: مدیتیشن ==================== */}
          {activeStep === 3 && (
            <div className="text-center py-8">
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-3">⏱️ مدت زمان مدیتیشن</label>
                <div className="flex justify-center gap-3 flex-wrap">
                  {[
                     { sec: 5, label: "5 ثانیه" },   // ✅ برای تست
                    { sec: 60, label: "1 دقیقه" },
                    { sec: 120, label: "2 دقیقه" },
                    { sec: 180, label: "3 دقیقه" },
                    { sec: 300, label: "5 دقیقه" },
                    { sec: 600, label: "10 دقیقه" }
                  ].map(opt => (
                    <button
                      key={opt.sec}
                      onClick={() => setMeditationDuration(opt.sec)}
                      className={`px-4 py-2 rounded-xl transition-all ${
                        meditationDuration === opt.sec 
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg" 
                          : "bg-white/10 text-gray-400 hover:bg-white/20"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="text-8xl mb-6">🧘</motion.div>
              <h2 className="text-2xl font-bold text-white mb-3">مدیتیشن و تنفس عمیق</h2>
              <p className="text-gray-400 mb-8">با مدیتیشن ذهن خود را آماده کن</p>
              
              {!completedSteps.step3 ? (
                <Button 
                  onClick={() => setShowMeditationModal(true)} 
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-lg px-10 py-5 rounded-2xl font-semibold shadow-xl"
                >
                  شروع مدیتیشن
                </Button>
              ) : (
                <div className="text-emerald-400 text-xl flex items-center justify-center gap-2">
                  <span>✅</span> مدیتیشن امروز انجام شد
                </div>
              )}
            </div>
          )}

          {/* دکمه‌های پایین */}
          <div className="flex gap-3 mt-8 pt-4 border-t border-white/10">
            <Button onClick={onBack} className="bg-white/5 hover:bg-white/10 rounded-xl text-gray-300">
              🔙 برگشت
            </Button>
            {allStepsCompleted && (
              <motion.button
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onComplete}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold py-3 shadow-lg shadow-emerald-500/25"
              >
                ✅ تموم شد، برو ترید 🚀
              </motion.button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ==================== مودال مدیتیشن ==================== */}
   {/* مودال مدیتیشن */}
<AnimatePresence>
  {showMeditationModal && (
    <MeditationModal
      duration={meditationDuration}
      onComplete={(result) => {
        setShowMeditationModal(false);
        // همیشه مرحله تکمیل می‌شود
        setCompletedSteps(prev => ({ ...prev, step3: true }));
        localStorage.setItem("meditationScore", result.score);
        localStorage.setItem("meditationImpact", result.impact);
        localStorage.setItem("meditationDate", new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tehran' }));
        
        if (onMeditationComplete) {
          onMeditationComplete({
            score: result.score,
            impact: result.impact
          });
        }
      }}
      onClose={() => setShowMeditationModal(false)}
    />
  )}
</AnimatePresence>

      {/* ==================== مودال جزئیات ستاپ ==================== */}
      <AnimatePresence>
        {showSetupDetail && selectedSetup && (
          <motion.div 
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSetupDetail(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="relative overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/10 rounded-2xl">
                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl" />
                {selectedSetup.image && (
                  <div className="relative">
                    <img 
                      src={selectedSetup.image} 
                      alt={selectedSetup.name} 
                      className="w-full h-56 object-cover cursor-pointer"
                      onClick={() => {
                        setSelectedImage(selectedSetup.image);
                        setShowImageModal(true);
                        setShowSetupDetail(false);
                      }}
                    />
                    <button
                      onClick={() => setShowSetupDetail(false)}
                      className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center text-white hover:bg-black/70 transition-all"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <CardContent className="p-6 relative z-10" style={{ direction: "rtl" }}>
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="text-xl font-bold text-white">{selectedSetup.name}</h2>
                    <span className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 text-yellow-400 border border-yellow-500/30">
                      ⭐ ستاپ A+
                    </span>
                  </div>
                  
                  {selectedSetup.description && (
                    <div className="p-4 bg-white/5 rounded-xl mb-4">
                      <p className="text-gray-300 text-sm leading-relaxed text-right">
                        {selectedSetup.description}
                      </p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white/5 rounded-xl text-center">
                      <p className="text-gray-400 text-xs mb-1">نسبت ریسک به ریوارد</p>
                      <p className="text-xl font-bold text-sky-400">{selectedSetup.rr || 1}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl text-center">
                      <p className="text-gray-400 text-xs mb-1">نوع</p>
                      <p className="text-xl font-bold text-yellow-400">A+</p>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => setShowSetupDetail(false)}
                    className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl"
                  >
                    بستن
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== مودال بزرگنمایی عکس ==================== */}
      <AnimatePresence>
        {showImageModal && (
          <motion.div 
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowImageModal(false)}
          >
            <div className="relative max-w-4xl max-h-[90vh]">
              <img src={selectedImage} alt="large" className="max-w-full max-h-[90vh] rounded-2xl object-contain" />
              <button 
                onClick={() => setShowImageModal(false)}
                className="absolute -top-4 -right-4 bg-rose-600 text-white w-10 h-10 rounded-full text-xl hover:bg-rose-700 transition-all shadow-lg"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== مودال ویرایش قوانین ==================== */}
      <AnimatePresence>
        {showEditRules && (
          <motion.div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="w-full max-w-2xl">
              <Card className="relative overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/10 rounded-2xl">
                <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl" />
                <CardContent className="p-6 relative z-10" style={{ direction: "rtl" }}>
                  <h2 className="text-xl font-bold mb-4 text-center bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
                    ✏️ ویرایش قوانین
                  </h2>
                  <div className="space-y-3 mb-4">
                    {editRules.map((rule, index) => (
                      <div key={index} className="flex gap-2">
                        <input type="text" className="flex-1 bg-white/5 p-3 rounded-xl text-white border border-white/10 focus:border-amber-500/50 focus:outline-none transition-all text-right" value={rule} onChange={(e) => updateRule(index, e.target.value)} />
                        {editRules.length > 1 && <Button onClick={() => removeRule(index)} className="bg-rose-500/20 hover:bg-rose-500/40 px-3 rounded-xl text-rose-400">❌</Button>}
                      </div>
                    ))}
                  </div>
                  <Button onClick={addNewRule} className="bg-white/5 hover:bg-white/10 w-full mb-4 rounded-xl text-gray-300 border border-white/10">+ اضافه کردن قانون جدید</Button>
                  <div className="flex gap-3">
                    <Button onClick={() => setShowEditRules(false)} className="bg-white/5 hover:bg-white/10 flex-1 rounded-xl text-gray-300">انصراف</Button>
                    <Button onClick={saveRules} className="bg-gradient-to-r from-amber-500 to-amber-600 text-white flex-1 rounded-xl font-semibold shadow-lg shadow-amber-500/25">ذخیره</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}