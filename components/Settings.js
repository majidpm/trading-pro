"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const getAuthHeaders = () => {
  const user = JSON.parse(localStorage.getItem('trading_user') || '{}');
  return {
    'x-user-id': user.id?.toString() || '1'
  };
};

export default function Settings() {
  const [initialCapital, setInitialCapital] = useState("");
  const [currentCapital, setCurrentCapital] = useState(0);
  const [dailyLossLimit, setDailyLossLimit] = useState("");
  const [editCurrentCapital, setEditCurrentCapital] = useState(false);
  const [newCurrentCapital, setNewCurrentCapital] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings', {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      console.log('⚙️ Settings loaded:', data);
      setInitialCapital(data.initial_capital?.toString() || "");
      setCurrentCapital(data.current_capital || 0);
      setDailyLossLimit(data.daily_loss_limit?.toString() || "5");
      setNewCurrentCapital(data.current_capital?.toString() || "");
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          initial_capital: parseFloat(initialCapital) || 0,
          daily_loss_limit: parseFloat(dailyLossLimit) || 5
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setCurrentCapital(data.settings.current_capital);
        setNewCurrentCapital(data.settings.current_capital?.toString() || "");
        setMessage({ type: "success", text: "تنظیمات با موفقیت ذخیره شد" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: "خطا در ذخیره تنظیمات" });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: "خطا در ذخیره تنظیمات" });
    } finally {
      setSaving(false);
    }
  };

  const updateCurrentCapital = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const newCapital = parseFloat(newCurrentCapital) || 0;
      const res = await fetch('/api/settings/capital', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ current_capital: newCapital })
      });
      
      if (res.ok) {
        setCurrentCapital(newCapital);
        setEditCurrentCapital(false);
        setMessage({ type: "success", text: "سرمایه فعلی با موفقیت به‌روز شد" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: "خطا در به‌روزرسانی سرمایه" });
      }
    } catch (error) {
      console.error("Error updating capital:", error);
      setMessage({ type: "error", text: "خطا در به‌روزرسانی سرمایه" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="col-span-3 flex justify-center items-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-400">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-3">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-purple-500/10 border border-white/10 p-6 mb-6">
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 via-sky-400 to-purple-400 bg-clip-text text-transparent">
            ⚙️ تنظیمات معاملاتی
          </h1>
          <p className="text-gray-400 text-sm mt-1">مدیریت سرمایه</p>
        </div>
      </div>

      <Card className="relative overflow-hidden bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl" />
        <CardContent className="p-6 relative z-10">
          <div className="space-y-6" style={{ direction: "rtl", textAlign: "right" }}>
            {/* سرمایه اولیه */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">💰 سرمایه اولیه (دلار)</label>
              <input
                type="number"
                step="0.01"
                value={initialCapital}
                onChange={(e) => setInitialCapital(e.target.value)}
                className="w-full bg-zinc-800 p-3 rounded-xl text-white outline outline-1 outline-white/10 focus:outline-emerald-500/50 transition-all"
                placeholder="مثال: 1000"
              />
              <p className="text-xs text-gray-500 mt-1">سرمایه‌ای که با آن شروع می‌کنید</p>
            </div>

            {/* حد ضرر روزانه */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">🛑 حد ضرر روزانه (درصد)</label>
              <input
                type="number"
                step="0.5"
                value={dailyLossLimit}
                onChange={(e) => setDailyLossLimit(e.target.value)}
                className="w-full bg-zinc-800 p-3 rounded-xl text-white outline outline-1 outline-white/10 focus:outline-emerald-500/50 transition-all"
                placeholder="مثال: 5"
              />
              <p className="text-xs text-gray-500 mt-1">
                اگر ضرر روزانه شما به این مقدار برسد، سیستم هشدار می‌دهد
              </p>
            </div>

            {/* سرمایه فعلی با دکمه ویرایش */}
            <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">💰 سرمایه فعلی</span>
                <div className="flex items-center gap-2">
                  {!editCurrentCapital ? (
                    <>
                      <span className="text-xl font-bold text-emerald-400">${currentCapital.toFixed(2)}</span>
                      <button
                        onClick={() => {
                          setEditCurrentCapital(true);
                          setNewCurrentCapital(currentCapital.toString());
                        }}
                        className="text-xs bg-white/10 hover:bg-white/20 text-gray-300 px-2 py-1 rounded-lg transition-all"
                      >
                        ✏️ ویرایش
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={newCurrentCapital}
                        onChange={(e) => setNewCurrentCapital(e.target.value)}
                        className="w-32 bg-zinc-800 p-2 rounded-lg text-white outline outline-1 outline-emerald-500/50 text-right"
                      />
                      <button
                        onClick={updateCurrentCapital}
                        disabled={saving}
                        className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1 rounded-lg transition-all"
                      >
                        ذخیره
                      </button>
                      <button
                        onClick={() => {
                          setEditCurrentCapital(false);
                          setNewCurrentCapital(currentCapital.toString());
                        }}
                        className="text-xs bg-rose-500/50 hover:bg-rose-600 text-white px-2 py-1 rounded-lg transition-all"
                      >
                        انصراف
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                این مقدار پس از هر ترید به‌طور خودکار به‌روز می‌شود
              </p>
            </div>

            {/* پیغام */}
            {message && (
              <div className={`p-3 rounded-xl text-center text-sm ${
                message.type === "success" 
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                  : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
              }`}>
                {message.text}
              </div>
            )}

            {/* دکمه ذخیره تنظیمات اولیه */}
            <Button
              onClick={saveSettings}
              disabled={saving}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/25 disabled:opacity-50"
            >
              {saving ? "در حال ذخیره..." : "💾 ذخیره تنظیمات"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}