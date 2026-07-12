// app/login/page.js
'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, TrendingUp, Users, LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('trading_user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else {
        setError(data.error || "ایمیل یا رمز عبور اشتباه است");
      }
    } catch (err) {
      setError("خطا در اتصال به سرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex w-5/12 bg-gradient-to-br from-zinc-900 to-black items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(at_center,#10b98130_0%,transparent_70%)]" />
        
        <div className="relative z-10 text-center px-10">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-3xl flex items-center justify-center shadow-xl">
              <span className="text-4xl font-bold">TP</span>
            </div>
          </div>
          <h2 className="text-4xl font-bold mb-4">خوش آمدید</h2>
          <p className="text-gray-400 text-lg">به داشبورد حرفه‌ای Trading Pro</p>

          <div className="mt-12 space-y-6 text-left max-w-xs mx-auto">
            <div className="flex gap-4 items-start">
              <Shield className="w-6 h-6 text-emerald-500 mt-1" />
              <div>
                <p className="font-medium">امنیت بالا</p>
                <p className="text-sm text-gray-500">ورود امن با حفاظت کامل</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <TrendingUp className="w-6 h-6 text-emerald-500 mt-1" />
              <div>
                <p className="font-medium">ابزارهای پیشرفته</p>
                <p className="text-sm text-gray-500">سنجش ذهنی و آنالیز realtime</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <Users className="w-6 h-6 text-emerald-500 mt-1" />
              <div>
                <p className="font-medium">جامعه تریدرها</p>
                <p className="text-sm text-gray-500">ارتباط با تریدرهای حرفه‌ای</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
              ورود به Trading Pro
            </h1>
            <p className="text-emerald-400 text-lg">به حساب خود خوش آمدید</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="email"
              placeholder="ایمیل"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 focus:border-emerald-500 rounded-2xl px-6 py-4 outline-none placeholder:text-zinc-400 text-white"
              required
            />
            <input
              type="password"
              placeholder="رمز عبور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 focus:border-emerald-500 rounded-2xl px-6 py-4 outline-none placeholder:text-zinc-400 text-white"
              required
            />

            {error && (
              <p className="text-rose-500 text-sm text-center bg-rose-500/10 py-3 rounded-2xl border border-rose-500/20">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-black font-semibold rounded-2xl transition-all text-lg disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? "در حال ورود..." : "ورود به حساب"}
            </button>
          </form>

         

          <p className="text-center text-gray-400 mt-8">
            حساب ندارید؟{' '}
            <Link href="/register" className="text-emerald-400 hover:underline font-medium">
              ثبت‌نام کنید
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}