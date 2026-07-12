// app/admin/login/page.js
'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, AlertTriangle } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ADMIN_PASSWORD = "admin123"; // بعداً این را امن‌تر کنید

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // شبیه‌سازی تأخیر
    await new Promise(resolve => setTimeout(resolve, 600));

    if (password === ADMIN_PASSWORD) {
      localStorage.setItem("adminLoggedIn", "true");
      localStorage.setItem("adminLoginTime", Date.now().toString());
      router.push("/admin/dashboard");
    } else {
      setError("رمز عبور ادمین اشتباه است");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex w-5/12 bg-gradient-to-br from-zinc-900 to-black items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(at_center,#ef444430_0%,transparent_70%)]" />
        
        <div className="relative z-10 text-center px-10">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-red-600 rounded-3xl flex items-center justify-center shadow-2xl">
              <Shield className="w-10 h-10 text-white" />
            </div>
          </div>
          <h2 className="text-4xl font-bold mb-4 text-white">پنل مدیریت</h2>
          <p className="text-gray-400 text-lg">Trading Pro Admin Panel</p>

          <div className="mt-12 text-left max-w-xs mx-auto space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">دسترسی محدود</span>
            </div>
            <p className="text-sm text-gray-500">
              این بخش فقط برای مدیران سیستم است و تمام فعالیت‌ها ثبت می‌شود.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl flex items-center justify-center">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">ورود ادمین</h1>
            </div>
            <p className="text-rose-400">دسترسی به پنل مدیریت Trading Pro</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">رمز عبور ادمین</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 focus:border-rose-500 rounded-2xl px-6 py-4 outline-none placeholder:text-zinc-400 text-white"
                placeholder="رمز عبور ادمین"
                autoFocus
                required
              />
            </div>

            {error && (
              <p className="text-rose-500 text-sm text-center bg-rose-500/10 py-3 rounded-2xl border border-rose-500/20">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-semibold rounded-2xl transition-all text-lg disabled:opacity-70"
            >
              {loading ? "در حال ورود..." : "ورود به پنل ادمین"}
            </button>
          </form>

          <p className="text-center text-gray-500 text-xs mt-8">
            ⚠️ این بخش فقط برای مدیران سیستم است و تمام ورودها ثبت می‌شود
          </p>
        </div>
      </div>
    </div>
  );
}