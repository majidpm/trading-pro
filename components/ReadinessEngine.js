"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import ReadinessGauge from "./ReadinessGauge";

const getAuthHeaders = () => {
  const user = JSON.parse(localStorage.getItem('trading_user') || '{}');
  return {
    'x-user-id': user.id?.toString() || '1'
  };
};

export default function ReadinessEngine({ todayMental, todaySleep, todayStress, refreshTrigger }) {
  const [readiness, setReadiness] = useState(null);
  const [momentum, setMomentum] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [meditationBonus, setMeditationBonus] = useState(0);

  const getMeditationBonus = () => {
    const meditationScore = parseInt(localStorage.getItem("meditationScore") || "0");
    const meditationImpact = localStorage.getItem("meditationImpact") || "neutral";
    const meditationDate = localStorage.getItem("meditationDate");
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tehran' });
    const preTradeDone = localStorage.getItem("preTradeDone") === "true";
    if (preTradeDone && meditationDate === today && meditationScore > 0) {
      if (meditationImpact === "positive") return Math.min(Math.floor(meditationScore * 1.5), 15);
      return 0;
    }
    return 0;
  };

  useEffect(() => {
    loadReadiness();
  }, [refreshTrigger, todayMental, todaySleep, todayStress]);

  const loadReadiness = async () => {
    setLoading(true);
    try {
      const mental = todayMental || 0;
      const sleep = todaySleep || 0;
      const stress = todayStress || 0;
      const res = await fetch(`/api/insights/readiness?mental=${mental}&sleep=${sleep}&stress=${stress}`, {
  headers: getAuthHeaders()
});
      const data = await res.json();
      const bonus = getMeditationBonus();
      let finalReadiness = data.readiness;
      if (bonus !== 0) finalReadiness = Math.min(100, Math.max(0, data.readiness + bonus));
      setReadiness(finalReadiness);
      setMomentum(data.momentum);

      // ✅ ایمن‌سازی insights: هر آیتم را به یک رشته ساده تبدیل کن
      let safeInsights = [];
      if (Array.isArray(data.insights)) {
        safeInsights = data.insights.map(item => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object') return `${item.icon || '💡'} ${item.text}`;
          return "نکته";
        });
      }
      setInsights(safeInsights);
      setMeditationBonus(bonus);
    } catch (error) {
      console.error("Error loading readiness:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMomentumText = (momentumValue) => {
    const val = parseFloat(momentumValue);
    if (val > 0.3) return { text: "روند صعودی", icon: "📈", color: "#22c55e", bg: "rgba(34,197,94,0.15)" };
    if (val > 0) return { text: "روند مثبت", icon: "📈", color: "#4ade80", bg: "rgba(74,222,128,0.1)" };
    if (val < -0.3) return { text: "روند نزولی", icon: "📉", color: "#ef4444", bg: "rgba(239,68,68,0.15)" };
    if (val < 0) return { text: "روند منفی", icon: "📉", color: "#f87171", bg: "rgba(248,113,113,0.1)" };
    return { text: "روند متعادل", icon: "⚖️", color: "#a1a1aa", bg: "rgba(161,161,170,0.1)" };
  };

  const momentumInfo = getMomentumText(momentum);

  const getStatusColors = () => {
    if (readiness < 40) {
      return {
        from: "#dc2626", to: "#ef4444", glow: "rgba(220,38,38,0.3)", border: "rgba(220,38,38,0.5)",
        bg: "linear-gradient(135deg, rgba(220,38,38,0.15), rgba(239,68,68,0.05))",
        text: "سطح آمادگی: ضعیف", textColor: "#ef4444"
      };
    }
    if (readiness < 70) {
      return {
        from: "#d97706", to: "#f59e0b", glow: "rgba(217,119,6,0.3)", border: "rgba(217,119,6,0.5)",
        bg: "linear-gradient(135deg, rgba(217,119,6,0.15), rgba(245,158,11,0.05))",
        text: "سطح آمادگی: متوسط", textColor: "#f59e0b"
      };
    }
    return {
      from: "#059669", to: "#10b981", glow: "rgba(5,150,105,0.3)", border: "rgba(5,150,105,0.5)",
      bg: "linear-gradient(135deg, rgba(5,150,105,0.15), rgba(16,185,129,0.05))",
      text: "سطح آمادگی: عالی", textColor: "#10b981"
    };
  };

  const colors = getStatusColors();

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-3"></div>
        <p className="text-gray-400 text-xs">تحلیل آمادگی...</p>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >

      <AnimatePresence mode="wait">
        <motion.div
          key={readiness}
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <Card 
            className="relative overflow-hidden rounded-2xl border-2 transition-all duration-500"
            style={{
              background: colors.bg,
              borderColor: colors.border,
              boxShadow: isHovered ? `0 0 25px ${colors.glow}` : `0 0 10px ${colors.glow}`,
            }}
          >
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{ background: `radial-gradient(circle at 30% 20%, ${colors.from}20, transparent 70%)` }}
            />
            
            <motion.div
              className="absolute top-0 left-0 right-0 h-0.5"
              style={{
                background: `linear-gradient(90deg, ${colors.from}, ${colors.to}, ${colors.from})`,
                backgroundSize: "200% 100%",
              }}
              animate={{ backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
            
            <CardContent className="p-4 relative z-10">
              <div className="flex flex-row gap-5 items-start">
                <div>
                  <ReadinessGauge score={readiness || 0} size={150} />
                  {meditationBonus > 0 && (
                    <div className="text-center mt-2">
                      <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                        +{meditationBonus} از مدیتیشن
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col" style={{ direction: "rtl", textAlign: "right" }}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-1.5">
                      <motion.div 
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: colors.from }}
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <span className="text-[14px] font-medium text-gray-400">وضعیت آمادگی</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ backgroundColor: momentumInfo.bg }}>
                      <span className="text-xs">{momentumInfo.icon}</span>
                      <span className="text-[12px] font-medium" style={{ color: momentumInfo.color }}>{momentumInfo.text}</span>
                    </div>
                  </div>
                  
                  <div className="mb-1">
                    <p className="text-xs" style={{ color: colors.textColor }}>{colors.text}</p>
                  </div>
                  
  {insights.length > 0 && (
  <div className="mt-2 space-y-1">
    {insights.slice(0, 3).map((item, idx) => {
      // اگر هنوز هم آبجکت رسید، آن را به رشته تبدیل کن
      let displayText = item;
      if (typeof item === 'object' && item !== null) {
        displayText = item.text || JSON.stringify(item);
      }
      return (
        <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10">
          <span className="text-xs text-gray-300 leading-relaxed flex-1 text-right">{displayText}</span>
        </div>
      );
    })}
  </div>
)}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}