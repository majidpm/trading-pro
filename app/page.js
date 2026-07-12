// app/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, Brain, Zap, Target, BookOpen, BarChart3, Users, Check, Clock } from 'lucide-react';

export default function TradingProLanding() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const plans = [
    {
      name: "رایگان",
      price: "0",
      period: "۲ هفته آزمایشی",
      features: [
        "سنجش ذهنی روزانه",
        "چارت پایه",
        "ژورنال ساده",
        "تقویم معاملاتی",
        "پشتیبانی جامعه",
      ],
      note: "پس از ۲ هفته به صورت خودکار به Professional تبدیل می‌شود",
      popular: false,
      buttonText: "شروع ۲ هفته رایگان",
      buttonLink: "/register"
    },
    {
      name: "Professional",
      price: "۳۰۰",
      period: "هزار تومان / ماه",
      features: [
        "همه امکانات دوره آزمایشی",
        "سنجش پیشرفته + Readiness Engine",
        "ژورنال هوشمند کامل",
        "آنالیز عملکرد پیشرفته",
        "تک پروفایل",
        "حذف محدودیت‌ها",
      ],
      popular: true,
      buttonText: "انتخاب Professional",
      buttonLink: "/register"
    },
    {
      name: "Elite",
      price: "۵۰۰",
      period: "هزار تومان / ماه",
      features: [
        "همه امکانات Professional",
        "چند پروفایل (نامحدود)",
        "سیگنال‌های هوش مصنوعی",
        "بک‌تستینگ پیشرفته",
        "گزارشات PDF حرفه‌ای",
        "پشتیبانی اولویت‌دار",
        "دسترسی API",
      ],
      popular: false,
      buttonText: "انتخاب Elite",
      buttonLink: "/register"
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden">
      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-[#0a0a0a]/95 backdrop-blur-lg border-b border-white/10' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center font-bold text-2xl">TP</div>
            <span className="text-3xl font-bold tracking-tighter">Trading Pro</span>
          </div>

          <div className="flex items-center gap-5">
            <a href="#features" className="hover:text-emerald-400 transition">ویژگی‌ها</a>
            <a href="#pricing" className="hover:text-emerald-400 transition">تعرفه‌ها</a>
            <button onClick={() => window.location.href = '/login'} className="px-6 py-2.5 text-sm font-medium hover:bg-white/10 rounded-full transition">ورود</button>
            <button onClick={() => window.location.href = '/register'} className="px-7 py-2.5 bg-white text-black font-semibold rounded-full hover:bg-white/90 transition">شروع رایگان</button>
          </div>
        </div>
      </nav>

      {/* Hero + Mockup */}
      <section className="pt-32 pb-20 text-center">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-6xl md:text-7xl font-bold tracking-tighter leading-tight mb-6">
            ترید حرفه‌ای<br />
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">با ذهن و ابزار کامل</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-gray-400 mb-10">
            سنجش ذهنی، آمادگی قبل از ترید، ژورنال هوشمند و آنالیز عملکرد در یک داشبورد قدرتمند
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button onClick={() => window.location.href = '/register'} className="px-10 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl text-lg font-semibold flex items-center gap-3 hover:scale-105 transition-all">
              شروع ۲ هفته رایگان
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Laptop + Mobile Mockup */}
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="relative mx-auto" style={{ maxWidth: '1100px' }}>
            <div className="relative z-10 bg-[#0f0f0f] border-[16px] border-[#1a1a1a] rounded-[3rem] shadow-2xl overflow-hidden">
              <div className="h-11 bg-[#111] flex items-center px-4">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
              </div>
              <img 
                src="/dashboard-preview.png" 
                alt="Trading Pro Dashboard" 
                className="w-full h-auto"
                onError={(e) => e.target.src = "https://picsum.photos/id/1015/1200/680"}
              />
            </div>

            <div className="absolute -bottom-12 -right-8 w-72 bg-[#0f0f0f] border-[12px] border-[#1a1a1a] rounded-[2.8rem] shadow-2xl overflow-hidden z-20">
              <div className="h-8 bg-[#111] flex items-center justify-center">
                <div className="w-28 h-3.5 bg-black rounded-full"></div>
              </div>
              <img 
                src="/dashboard-mobile.png" 
                alt="Mobile View" 
                className="w-full h-auto"
                onError={(e) => e.target.src = "https://picsum.photos/id/1018/400/720"}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">امکانات حرفه‌ای Trading Pro</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Brain, title: "سنجش ذهنی", desc: "پیگیری حال روحی، تمرکز و آمادگی" },
              { icon: Zap, title: "Readiness Engine", desc: "امتیاز آمادگی قبل از ترید" },
              { icon: Target, title: "Pre-Trade Checklist", desc: "چک‌لیست هوشمند" },
              { icon: BookOpen, title: "ژورنال ترید", desc: "ثبت هوشمند معاملات" },
              { icon: BarChart3, title: "آنالیز عملکرد", desc: "نمودارهای سود و زیان" },
              { icon: Users, title: "چند پروفایل", desc: "مدیریت چندین استراتژی" },
            ].map((f, i) => (
              <div key={i} className="bg-[#111] p-8 rounded-3xl border border-white/5 hover:border-emerald-500/40 transition-all group">
                <f.icon className="w-12 h-12 text-emerald-500 mb-6" />
                <h3 className="text-2xl font-semibold mb-3">{f.title}</h3>
                <p className="text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-[#050505]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">تعرفه‌ها</h2>
            <p className="text-gray-400 text-lg">انتخابی که به سبک تریدت می‌خورد</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-[#111] rounded-3xl p-8 border transition-all hover:-translate-y-2 ${plan.popular ? 'border-emerald-500 scale-105 shadow-2xl shadow-emerald-500/20' : 'border-white/10'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 right-6 bg-emerald-500 text-black text-xs font-bold px-5 py-1 rounded-full">
                    محبوب‌ترین
                  </div>
                )}

                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                
                <div className="flex items-end gap-1 mb-6">
                  <span className="text-5xl font-bold">{plan.price}</span>
                  {plan.price !== "0" && <span className="text-gray-400 mb-2">هزار تومان</span>}
                </div>
                
                <p className="text-emerald-400 mb-8 flex items-center gap-2">
                  <Clock className="w-5 h-5" /> {plan.period}
                </p>

                {plan.note && <p className="text-amber-400 text-sm mb-6">{plan.note}</p>}

                <ul className="space-y-4 mb-10">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-300">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => window.location.href = plan.buttonLink}
                  className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all ${
                    plan.popular
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-black'
                      : 'bg-white/10 hover:bg-white/20 border border-white/20'
                  }`}
                >
                  {plan.buttonText}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-16 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center font-bold text-2xl">TP</div>
                <span className="text-2xl font-bold">Trading Pro</span>
              </div>
              <p className="text-gray-500">داشبورد حرفه‌ای تریدینگ برای تریدرهای ایرانی</p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">محصول</h4>
              <div className="space-y-3 text-sm text-gray-400">
                <p>ویژگی‌ها</p>
                <p>تعرفه‌ها</p>
                <p>بلاگ</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">شرکت</h4>
              <div className="space-y-3 text-sm text-gray-400">
                <p>درباره ما</p>
                <p>تماس با ما</p>
                <p>حریم خصوصی</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">پشتیبانی</h4>
              <div className="space-y-3 text-sm text-gray-400">
                <p>مرکز کمک</p>
                <p>تلگرام</p>
                <p>اینستاگرام</p>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500 mt-16 pt-8 border-t border-white/10">
            © ۱۴۰۵ Trading Pro — تمامی حقوق محفوظ است.
          </div>
        </div>
      </footer>
    </div>
  );
}