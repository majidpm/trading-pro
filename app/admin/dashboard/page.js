// app/admin/dashboard/page.js
'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Users, TrendingUp, Trash2, Calendar, LogOut, Search, UserCheck } from "lucide-react";
import { motion } from "framer-motion";

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fa-IR', { 
    year: 'numeric', month: '2-digit', day: '2-digit' 
  });
};

const formatRelativeDate = (dateStr) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'امروز';
  if (diffDays === 1) return 'دیروز';
  if (diffDays < 7) return `${diffDays} روز پیش`;
  return formatDate(dateStr);
};

export default function ProfessionalAdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: [],
    summary: { totalUsers: 0, totalTrades: 0, activeUsers: 0 },
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [extendDays, setExtendDays] = useState(30);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const isAdmin = localStorage.getItem("adminLoggedIn");
    if (!isAdmin) {
      router.push("/admin/login");
      return;
    }
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('⚠️ این عمل غیرقابل بازگشت است.\nآیا از حذف کامل این کاربر مطمئن هستید؟')) return;
    
    const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
    if (res.ok) {
      alert('کاربر با موفقیت حذف شد');
      loadStats();
    } else {
      alert('خطا در حذف کاربر');
    }
  };

  const extendSubscription = async (userId) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'extend_subscription', days: extendDays })
    });
    if (res.ok) {
      alert(`اشتراک ${extendDays} روز تمدید شد`);
      loadStats();
      setSelectedUser(null);
    } else {
      alert('خطا در تمدید اشتراک');
    }
  };

  const toggleAdmin = async (userId) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_admin' })
    });
    if (res.ok) {
      alert('وضعیت ادمین تغییر کرد');
      loadStats();
    }
  };

  const filteredUsers = stats.users.filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fullname?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === "active") return matchesSearch && new Date(user.subscription_expiry) > new Date();
    if (filter === "expired") return matchesSearch && new Date(user.subscription_expiry) <= new Date();
    return matchesSearch;
  });

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    router.push("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-rose-500 border-t-transparent"></div>
          <p className="text-gray-400 mt-4">در حال بارگذاری پنل مدیریت...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-red-600 rounded-3xl flex items-center justify-center">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tighter">پنل مدیریت Trading Pro</h1>
              <p className="text-gray-400">کنترل کامل سیستم • نظارت realtime</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all hover:border-white/30"
          >
            <LogOut className="w-5 h-5" />
            <span>خروج</span>
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: "کل کاربران", value: stats.summary.totalUsers, icon: "👥" },
            { label: "کل تریدها", value: stats.summary.totalTrades, icon: "📈" },
            { label: "کاربران فعال", value: stats.summary.activeUsers, icon: "🟢", color: "emerald" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-zinc-900 border border-white/10 rounded-3xl p-8 hover:border-rose-500/30 transition-all group"
            >
              <div className="text-5xl mb-6 opacity-80 group-hover:scale-110 transition-transform">{stat.icon}</div>
              <div className={`text-5xl font-bold mb-1 ${stat.color === 'emerald' ? 'text-emerald-400' : 'text-white'}`}>
                {stat.value}
              </div>
              <div className="text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute right-5 top-4 text-gray-500" />
            <input
              type="text"
              placeholder="جستجوی کاربر (نام یا ایمیل)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 focus:border-rose-500 pl-12 pr-6 py-4 rounded-2xl outline-none text-white placeholder:text-zinc-500"
            />
          </div>

          <div className="flex gap-2">
            {["all", "active", "expired"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-3 rounded-2xl text-sm font-medium transition-all ${
                  filter === f 
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' 
                    : 'bg-zinc-900 border border-white/10 hover:bg-white/5'
                }`}
              >
                {f === "all" && "همه کاربران"}
                {f === "active" && "فعال"}
                {f === "expired" && "منقضی شده"}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-950 border-b border-white/10">
                <tr>
                  <th className="text-right p-6 text-gray-400 font-normal w-12">#</th>
                  <th className="text-right p-6 text-gray-400 font-normal">کاربر</th>
                  <th className="text-right p-6 text-gray-400 font-normal">تاریخ ثبت‌نام</th>
                  <th className="text-right p-6 text-gray-400 font-normal">تعداد ترید</th>
                  <th className="text-right p-6 text-gray-400 font-normal">تعداد پروفایل</th>
                  <th className="text-right p-6 text-gray-400 font-normal">آخرین فعالیت</th>
                  <th className="text-right p-6 text-gray-400 font-normal">انقضا</th>
                  <th className="text-right p-6 text-gray-400 font-normal">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((user, idx) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-6 text-gray-500">{idx + 1}</td>
                    <td className="p-6">
                      <div className="font-semibold text-white">{user.fullname || 'بدون نام'}</div>
                      <div className="text-sm text-gray-500 font-mono">{user.email}</div>
                    </td>
                    <td className="p-6 text-gray-400 text-sm">{formatDate(user.created_at)}</td>
                    <td className="p-6 font-medium text-white">{user.total_trades || 0}</td>
                    <td className="p-6 font-medium text-white text-center">{user.profile_count || 1}</td>
                    <td className="p-6 text-gray-400 text-sm">{formatRelativeDate(user.last_trade)}</td>
                    <td className="p-6">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-medium ${
                        new Date(user.subscription_expiry) > new Date() 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {formatDate(user.subscription_expiry)}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex gap-2 opacity-80 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => toggleAdmin(user.id)}
                          className="px-4 py-2 text-xs rounded-2xl bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition"
                        >
                          {user.is_admin ? 'حذف ادمین' : 'ادمین کردن'}
                        </button>
                        <button 
                          onClick={() => { setSelectedUser(user); setExtendDays(30); }}
                          className="px-4 py-2 text-xs rounded-2xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition"
                        >
                          تمدید
                        </button>
                        <button 
                          onClick={() => deleteUser(user.id)}
                          className="px-4 py-2 text-xs rounded-2xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Extend Subscription Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-3xl w-full max-w-md p-8 border border-white/10">
            <h2 className="text-2xl font-bold mb-6">تمدید اشتراک کاربر</h2>
            <p className="text-gray-400 mb-2">کاربر:</p>
            <p className="text-lg mb-8 font-medium">{selectedUser.email}</p>

            <div className="grid grid-cols-5 gap-3 mb-8">
              {[7, 15, 30, 90, 365].map(d => (
                <button
                  key={d}
                  onClick={() => setExtendDays(d)}
                  className={`py-3 rounded-2xl text-sm transition-all ${extendDays === d ? 'bg-emerald-500 text-black font-semibold' : 'bg-zinc-800 hover:bg-zinc-700'}`}
                >
                  {d}
                </button>
              ))}
            </div>

            <div className="flex gap-4">
              <button onClick={() => setSelectedUser(null)} className="flex-1 py-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 transition">
                انصراف
              </button>
              <button onClick={() => extendSubscription(selectedUser.id)} className="flex-1 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-black font-bold transition">
                تمدید {extendDays} روز
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}