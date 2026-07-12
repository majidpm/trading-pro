"use client";
import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function ProfitChart({ trades }) {
  const [filteredData, setFilteredData] = useState([]);
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const [showUsd, setShowUsd] = useState(false);

  // گرفتن همه تاریخ‌های موجود
  const allDates = trades.length > 0 
    ? [...new Set(trades.map(t => t.date))].sort()
    : [];
  const maxDate = allDates.length > 0 ? allDates[allDates.length - 1] : "";

  // تنظیم پیش‌فرض بازه زمانی (آخرین 30 روز)
  useEffect(() => {
    if (trades.length > 0) {
      const sortedDates = [...allDates].sort();
      const lastDate = sortedDates[sortedDates.length - 1];
      const firstDate = sortedDates[0];
      
      const lastDateObj = new Date(lastDate);
      const thirtyDaysAgo = new Date(lastDateObj);
      thirtyDaysAgo.setDate(lastDateObj.getDate() - 30);
      const defaultStart = thirtyDaysAgo.toISOString().split('T')[0];
      
      setDateRange({
        startDate: defaultStart > firstDate ? defaultStart : firstDate,
        endDate: lastDate,
      });
    }
  }, [trades]);

  // آپدیت داده‌های فیلتر شده
  useEffect(() => {
    if (!dateRange.startDate || !dateRange.endDate || trades.length === 0) {
      setFilteredData([]);
      return;
    }

    const dailyMap = new Map();
    
    const filteredTrades = trades.filter(trade => {
      return trade.date >= dateRange.startDate && trade.date <= dateRange.endDate;
    });

    for (const trade of filteredTrades) {
      const date = trade.date;
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { 
          date, 
          totalProfit: 0, 
          totalProfitUsd: 0,  // ✅ اضافه شد
          cumulativeProfit: 0, 
          count: 0 
        });
      }
      const entry = dailyMap.get(date);
      entry.totalProfit += (trade.profit || 0);
      entry.totalProfitUsd += (trade.profit_usd || 0);  // ✅ اضافه شد
      entry.count++;
    }

    let sorted = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    
    let cumulative = 0;
    let cumulativeUsd = 0;  // ✅ اضافه شد
    const result = sorted.map(item => {
      cumulative += item.totalProfit;
      cumulativeUsd += item.totalProfitUsd;  // ✅ اضافه شد
      return {
        date: item.date,
        totalProfit: parseFloat(item.totalProfit.toFixed(2)),
        totalProfitUsd: parseFloat(item.totalProfitUsd.toFixed(2)),  // ✅ اضافه شد
        cumulativeProfit: parseFloat(cumulative.toFixed(2)),
        cumulativeProfitUsd: parseFloat(cumulativeUsd.toFixed(2)),  // ✅ اضافه شد
        tradeCount: item.count
      };
    });

    setFilteredData(result);
  }, [trades, dateRange]);

  const formatDateForDisplay = (dateStr) => {
    const [year, month, day] = dateStr.split("-");
    return `${month}/${day}/${year.slice(2)}`;
  };

  const handleResetFilter = () => {
    if (trades.length > 0) {
      const sortedDates = [...allDates].sort();
      setDateRange({
        startDate: sortedDates[0],
        endDate: sortedDates[sortedDates.length - 1],
      });
    }
  };
  // تابع کمکی برای بدست آوردن دوشنبه هفته جاری
function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const daysToMonday = day === 0 ? 6 : day - 1; // اگر یکشنبه بود 6 روز به عقب، وگرنه day-1
  d.setDate(d.getDate() - daysToMonday);
  return d;
}

const handleLast7Days = () => {
  const lastDate = new Date(maxDate);
  console.log("Last date:", maxDate);
  
  // محاسبه دوشنبه هفته جاری
  const day = lastDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  const daysToMonday = day === 0 ? 6 : day - 1;
  
  const startOfWeek = new Date(lastDate);
  startOfWeek.setDate(lastDate.getDate() - daysToMonday);
  
  const startDate = startOfWeek.toISOString().split('T')[0];
  console.log("Start of week (Monday):", startDate);
  
  setDateRange({
    startDate: startDate,
    endDate: maxDate,
  });
};

  const handleLast30Days = () => {
    const lastDate = new Date(maxDate);
    const startDate = new Date(lastDate);
    startDate.setDate(lastDate.getDate() - 30);
    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: maxDate,
    });
  };

  const handleLast90Days = () => {
    const lastDate = new Date(maxDate);
    const startDate = new Date(lastDate);
    startDate.setDate(lastDate.getDate() - 90);
    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: maxDate,
    });
  };

  if (!trades || trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-6xl mb-4 opacity-50">📊</div>
        <p className="text-gray-500">No data to display</p>
        <p className="text-xs text-gray-600 mt-1">Add trades to see chart</p>
      </div>
    );
  }

  // ✅ داده‌ها مستقیم از دیتابی (بدون محاسبه مجدد)
  const chartData = {
    labels: filteredData.map((item) => formatDateForDisplay(item.date)),
    datasets: [
      {
        label: showUsd ? "Daily PnL ($)" : "Daily PnL (%)",
        data: filteredData.map((item) => showUsd ? item.totalProfitUsd : item.totalProfit),
        borderColor: "#22c55e",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: "#22c55e",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
      },
      {
        label: showUsd ? "Cumulative PnL ($)" : "Cumulative PnL (%)",
        data: filteredData.map((item) => showUsd ? item.cumulativeProfitUsd : item.cumulativeProfit),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.05)",
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: "#3b82f6",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
      },
    ],
  };

  // محاسبه محدوده متقارن برای محور Y
  const allValues = showUsd 
    ? [...filteredData.map(d => d.totalProfitUsd), ...filteredData.map(d => d.cumulativeProfitUsd)]
    : [...filteredData.map(d => d.totalProfit), ...filteredData.map(d => d.cumulativeProfit)];
  
  const maxAbsValue = allValues.length > 0 ? Math.max(...allValues.map(v => Math.abs(v)), 1) : 1;
  const yLimit = Math.ceil(maxAbsValue * 1.2);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#a1a1aa",
          font: { size: 11 },
          boxWidth: 10,
        },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "#18181b",
        titleColor: "#ffffff",
        bodyColor: "#a1a1aa",
        borderColor: "#3f3f46",
        borderWidth: 1,
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || "";
            let value = context.parsed.y;
            if (showUsd) {
              return `${label}: ${value > 0 ? "+" : ""}$${value.toFixed(2)}`;
            }
            return `${label}: ${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
          },
        },
      },
    },
    scales: {
      y: {
        grid: { color: "#3f3f46" },
        ticks: { 
          color: "#a1a1aa", 
          callback: (value) => {
            if (showUsd) {
              return `${value > 0 ? "+" : ""}$${value.toFixed(2)}`;
            }
            return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
          }
        },
        title: { 
          display: true, 
          text: showUsd ? "Profit / Loss ($)" : "Profit / Loss (%)", 
          color: "#a1a1aa" 
        },
        min: -yLimit,
        max: yLimit,
        beginAtZero: false,
      },
      x: {
        grid: { display: false },
        ticks: { 
          color: "#a1a1aa", 
          rotation: 45,
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: 8
        },
        title: { display: true, text: "Date", color: "#a1a1aa" },
      },
    },
  };

  return (
    <div>
      {/* فیلتر تاریخ و دکمه Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-sm">📅</span>
          <span className="text-xs text-gray-400">بازه زمانی:</span>
          
          <div className="flex gap-1">
            <button
              onClick={handleLast7Days}
              className="px-2 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-all outline outline-1 outline-white/10"
            >
              ۷ روز
            </button>
            <button
              onClick={handleLast30Days}
              className="px-2 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-all outline outline-1 outline-white/10"
            >
              ۳۰ روز
            </button>
            <button
              onClick={handleLast90Days}
              className="px-2 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-all outline outline-1 outline-white/10"
            >
              ۹۰ روز
            </button>
            <button
              onClick={handleResetFilter}
              className="px-2 py-1 text-xs rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-all outline outline-1 outline-emerald-500/30"
            >
              همه
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-500">
            {dateRange.startDate && dateRange.endDate && (
              <>از {formatDateForDisplay(dateRange.startDate)} تا {formatDateForDisplay(dateRange.endDate)}</>
            )}
          </span>
          
          {/* دکمه Toggle درصد / دلار */}
          <button
            onClick={() => setShowUsd(!showUsd)}
            className="flex items-center gap-1 px-3 py-1 text-xs rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 transition-all"
          >
            <span>{showUsd ? "%" : "$"}</span>
            <span className="text-[10px] text-gray-500">|</span>
            <span>{showUsd ? "نمایش درصد" : "نمایش دلار"}</span>
          </button>
        </div>
      </div>

      {/* نمودار */}
      <div style={{ height: "320px", width: "100%" }}>
        {filteredData.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-500 text-sm">No data in selected range</p>
          </div>
        )}
      </div>
    </div>
  );
}