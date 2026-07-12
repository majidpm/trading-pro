"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function Calendar({ refreshTrigger }) {
  const [calendarData, setCalendarData] = useState({});
  
  // تابع کمکی برای گرفتن هدر احراز هویت
  const getAuthHeaders = () => {
    const user = JSON.parse(localStorage.getItem('trading_user') || '{}');
    return {
      'x-user-id': user.id?.toString() || '1'
    };
  };
  
  // محاسبه دستی تاریخ ایران (مستقل از تایم‌زون)
  const getIranDate = () => {
    return new Date().toLocaleDateString('en-CA', {
      timeZone: 'Asia/Tehran'
    });
  };

  const [viewDate, setViewDate] = useState(() => {
    const today = getIranDate();
    const [y, m] = today.split('-');
    return { year: parseInt(y), month: parseInt(m) - 1 };
  });

  useEffect(() => {
    loadAssessments();
  }, [refreshTrigger]);

  const loadAssessments = async () => {
    try {
      const res = await fetch('/api/assessments/all', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const calendarMap = {};
        data.forEach(assessment => {
          if (assessment && assessment.date) {
            calendarMap[assessment.date] = true;
          }
        });
        console.log("📅 Calendar data loaded:", calendarMap);
        setCalendarData(calendarMap);
      }
    } catch (error) {
      console.error('Error loading assessments:', error);
    }
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

  const getDaysInMonth = () => {
    return new Date(viewDate.year, viewDate.month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = () => {
    return new Date(viewDate.year, viewDate.month, 1).getDay();
  };

  const hasData = (day) => {
    const month = String(viewDate.month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const key = `${viewDate.year}-${month}-${dayStr}`;
    const result = calendarData[key] === true;
    if (result) console.log(`✅ Day ${day} (${key}) has data`);
    return result;
  };

  const isToday = (day) => {
    const today = getIranDate();
    const [y, m, d] = today.split('-').map(Number);
    return viewDate.year === y && viewDate.month === m - 1 && day === d;
  };

  const prevMonth = () => {
    setViewDate(prev => {
      const m = prev.month - 1;
      if (m < 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: m };
    });
  };

  const nextMonth = () => {
    setViewDate(prev => {
      const m = prev.month + 1;
      if (m > 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: m };
    });
  };

  const daysInMonth = getDaysInMonth();
  const firstDay = getFirstDayOfMonth();
  const monthName = monthNames[viewDate.month];
  const year = viewDate.year;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 pt-4 border-t border-white/10"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm">📅</span>
        <h3 className="text-xs font-medium text-gray-400 tracking-wider">TRADING CALENDAR</h3>
      </div>

      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white">◀</button>
        <div className="text-center">
          <span className="text-sm font-semibold text-white">{monthName}</span>
          <span className="text-xs text-gray-500 ml-1">{year}</span>
        </div>
        <button onClick={nextMonth} className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white">▶</button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-gray-500 py-1">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const hasEntry = hasData(day);
          const today = isToday(day);
          
          let bgClass = "";
          let titleText = "";
          
          if (today) {
            bgClass = "bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-lg shadow-sky-500/30 outline outline-1 outline-sky-400";
            titleText = hasEntry ? "امروز - ✅ سنجش انجام شده" : "امروز - ❌ سنجش انجام نشده";
          } else if (hasEntry) {
            bgClass = "bg-gradient-to-br from-emerald-500/80 to-emerald-600/80 text-white shadow-sm shadow-emerald-500/25";
            titleText = "✅ سنجش انجام شده";
          } else {
            bgClass = "bg-white/5 text-gray-400 hover:bg-white/10";
            titleText = "❌ سنجش انجام نشده";
          }
          
          return (
            <motion.div
              key={day}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`aspect-square flex items-center justify-center text-xs rounded-full cursor-pointer transition-all duration-200 ${bgClass}`}
              title={titleText}
            >
              {day}
            </motion.div>
          );
        })}
      </div>

      <div className="flex justify-center gap-4 mt-4 pt-3 border-t border-white/5">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
          <span className="text-[10px] text-gray-500">Today</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] text-gray-500">Done</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
          <span className="text-[10px] text-gray-500">Not done</span>
        </div>
      </div>
    </motion.div>
  );
}