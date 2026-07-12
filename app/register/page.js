// app/register/page.js
'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, TrendingUp, Users } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullname: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("رمز عبور و تکرار آن مطابقت ندارند");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullname: form.fullname,
          email: form.email,
          password: form.password
        })
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/login?registered=true');
      } else {
        setError(data.error || "ثبت‌نام ناموفق بود");
      }
    } catch (err) {
      setError("خطا در ارتباط با سرور");
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
          <h2 className="text-4xl font-bold mb-4">به Trading Pro خوش آمدید</h2>
          <p className="text-gray-400 text-lg">سطح ترید خود را همین امروز ارتقا دهید</p>

          <div className="mt-12 space-y-6 text-left max-w-xs mx-auto">
            <div className="flex gap-4 items-start">
              <Shield className="w-6 h-6 text-emerald-500 mt-1" />
              <div>
                <p className="font-medium">امنیت بالا</p>
                <p className="text-sm text-gray-500">حفاظت کامل از اطلاعات شما</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <TrendingUp className="w-6 h-6 text-emerald-500 mt-1" />
              <div>
                <p className="font-medium">ابزارهای حرفه‌ای</p>
                <p className="text-sm text-gray-500">سنجش ذهنی و آنالیز پیشرفته</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <Users className="w-6 h-6 text-emerald-500 mt-1" />
              <div>
                <p className="font-medium">جامعه تریدرها</p>
                <p className="text-sm text-gray-500">اتصال به تریدرهای موفق ایرانی</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-10">
            {/* عنوان اصلاح شده */}
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
              ثبت‌نام در Trading Pro
            </h1>
            <p className="text-emerald-400 text-lg">۲ هفته تست رایگان — بدون نیاز به کارت</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="text"
              placeholder="نام کامل"
              value={form.fullname}
              onChange={(e) => setForm({ ...form, fullname: e.target.value })}
              className="w-full bg-zinc-900 border border-white/10 focus:border-emerald-500 rounded-2xl px-6 py-4 outline-none placeholder:text-zinc-400 text-white"
              required
            />
            <input
              type="email"
              placeholder="ایمیل"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-zinc-900 border border-white/10 focus:border-emerald-500 rounded-2xl px-6 py-4 outline-none placeholder:text-zinc-400 text-white"
              required
            />
            <input
              type="password"
              placeholder="رمز عبور"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-zinc-900 border border-white/10 focus:border-emerald-500 rounded-2xl px-6 py-4 outline-none placeholder:text-zinc-400 text-white"
              required
            />
            <input
              type="password"
              placeholder="تکرار رمز عبور"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
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
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-black font-semibold rounded-2xl transition-all text-lg disabled:opacity-70"
            >
              {loading ? "در حال ثبت‌نام..." : "ایجاد حساب و شروع تست رایگان"}
            </button>
          </form>

          <p className="text-center text-gray-400 mt-8">
            قبلاً حساب دارید؟{' '}
            <Link href="/login" className="text-emerald-400 hover:underline font-medium">
              وارد شوید
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}