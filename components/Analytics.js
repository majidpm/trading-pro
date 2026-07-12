"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import ProfitChart from "./ProfitChart";


export default function Analytics({ refreshTrigger }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");
  const [currentCapital, setCurrentCapital] = useState(0);
  const [initialCapital, setInitialCapital] = useState(0);
  
  const [weeklyData, setWeeklyData] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState("html");
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [setups, setSetups] = useState([]);


  const getAuthHeaders = () => {
  const user = JSON.parse(localStorage.getItem('trading_user') || '{}');
  return {
    'x-user-id': user.id?.toString() || '1'
  };
};

  // دریافت سرمایه
  useEffect(() => {
    const loadCapital = async () => {
      try {
        const res = await fetch('/api/settings', { headers: getAuthHeaders() });
        const settings = await res.json();
        setCurrentCapital(settings.current_capital || 0);
        setInitialCapital(settings.initial_capital || 0);
      } catch (error) {
        console.error("Error loading capital:", error);
      }
    };
    loadCapital();
  }, []);

  const trades = data?.trades || [];
  const totalProfitUsd = trades.reduce((s, t) => s + (t.profit_usd || 0), 0);
  const totalProfitPercent = initialCapital > 0 ? (totalProfitUsd / initialCapital) * 100 : 0;
  const totalTrades = trades.length;
  const winningTrades = trades.filter(t => t.profit > 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades * 100).toFixed(1) : 0;
  const profitFactor = data?.summary?.profitFactor || "0";
  const recoveryFactor = data?.summary?.recoveryFactor || "—";
  const maxConsecutiveWins = data?.summary?.maxConsecutiveWins || 0;
  const maxConsecutiveLosses = data?.summary?.maxConsecutiveLosses || 0;

const calculateDrawdowns = () => {
  if (trades.length === 0) {
    return {
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      equityDrawdown: 0,
      equityDrawdownPercent: 0,
      currentDrawdownDaily: 0,
      currentDrawdownDailyPercent: 0,
      recoveryCount: 0
    };
  }

  const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  const today = new Date().toISOString().split('T')[0];
  
  let equity = initialCapital;
  let peakEquity = equity;
  let maxDrawdown = 0;
  let maxDrawdownPercent = 0;
  let minEquity = equity;
  let recoveryCount = 0;
  let inDrawdown = false;
  
  // ✅ برای افت امروز نسبت به سرمایه اولیه روز
  let startOfDayCapital = initialCapital;
  let dailyDrawdown = 0;
  let hasTodayTrade = false;

  for (const trade of sortedTrades) {
    equity += trade.profit_usd || 0;
    
    // ✅ اگر روز جدید شروع شد، سرمایه اولیه روز را به‌روز کن
    if (trade.date === today && !hasTodayTrade) {
      startOfDayCapital = equity - (trade.profit_usd || 0);
      hasTodayTrade = true;
    }
    
    // محاسبه افت امروز (نسبت به سرمایه اولیه روز)
    if (trade.date === today) {
      const currentDrawdownFromStart = startOfDayCapital - equity;
      if (currentDrawdownFromStart > dailyDrawdown) {
        dailyDrawdown = currentDrawdownFromStart;
      }
    }
    
    if (equity > peakEquity) {
      peakEquity = equity;
      if (inDrawdown) {
        recoveryCount++;
        inDrawdown = false;
      }
    }
    
    const drawdown = peakEquity - equity;
    const drawdownPercent = (drawdown / peakEquity) * 100;
    
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownPercent = drawdownPercent;
      inDrawdown = true;
    }
    
    if (equity < minEquity) {
      minEquity = equity;
    }
  }
  
  const equityDrawdown = Math.abs(minEquity - initialCapital);
  const equityDrawdownPercent = (equityDrawdown / initialCapital) * 100;
  const dailyDrawdownPercent = startOfDayCapital > 0 ? (dailyDrawdown / startOfDayCapital) * 100 : 0;
  
  return {
    maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
    maxDrawdownPercent: parseFloat(maxDrawdownPercent.toFixed(1)),
    equityDrawdown: parseFloat(equityDrawdown.toFixed(2)),
    equityDrawdownPercent: parseFloat(equityDrawdownPercent.toFixed(1)),
    currentDrawdownDaily: parseFloat(dailyDrawdown.toFixed(2)),
    currentDrawdownDailyPercent: parseFloat(dailyDrawdownPercent.toFixed(1)),
    recoveryCount
  };
};
  const drawdowns = calculateDrawdowns();
  const maxDrawdownPercentOfCapital = initialCapital > 0 ? (drawdowns.maxDrawdown / initialCapital) * 100 : 0;

 // ========== آمار پیشرفته ==========
// Gross Profit & Gross Loss
const grossProfit = trades.filter(t => t.profit > 0).reduce((s, t) => s + (t.profit_usd || 0), 0);
const grossLoss = trades.filter(t => t.profit < 0).reduce((s, t) => s + (t.profit_usd || 0), 0);

// تریدهای برنده Long و Short
const totalLongWon = trades.filter(t => t.side === "Buy" && t.profit > 0).length;
const totalShortWon = trades.filter(t => t.side === "Sell" && t.profit > 0).length;

// میانگین سود و ضرر
const winningTradesList = trades.filter(t => t.profit > 0);
const losingTradesList = trades.filter(t => t.profit < 0);

const avgProfitTrade = winningTradesList.length > 0 
  ? winningTradesList.reduce((s, t) => s + (t.profit_usd || 0), 0) / winningTradesList.length 
  : 0;

const avgLossTrade = losingTradesList.length > 0 
  ? losingTradesList.reduce((s, t) => s + (t.profit_usd || 0), 0) / losingTradesList.length 
  : 0;

// Sharpe Ratio (سالانه شده با فرض 252 روز معاملاتی)
const returns = trades.map(t => (t.profit_usd || 0) / initialCapital);
const avgReturn = returns.reduce((a, b) => a + b, 0) / (returns.length || 1);
const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length || 1);
const stdDev = Math.sqrt(variance);
const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

// Expected Payoff
const expectedPayoff = trades.reduce((s, t) => s + (t.profit_usd || 0), 0) / (trades.length || 1);
  // ========== بهترین و بدترین روز ==========
  const dailyMap = new Map();
  const dailyUsdMap = new Map();
  trades.forEach(trade => {
    const date = trade.date;
    const profit = trade.profit || 0;
    const profitUsd = trade.profit_usd || 0;
    if (dailyMap.has(date)) {
      dailyMap.set(date, dailyMap.get(date) + profit);
      dailyUsdMap.set(date, dailyUsdMap.get(date) + profitUsd);
    } else {
      dailyMap.set(date, profit);
      dailyUsdMap.set(date, profitUsd);
    }
  });
  const dailyArray = Array.from(dailyMap.keys()).map(date => ({
    date,
    profit: dailyMap.get(date),
    profitUsd: dailyUsdMap.get(date)
  }));
  const sortedByProfit = [...dailyArray].sort((a, b) => b.profit - a.profit);
  const sortedByLoss = [...dailyArray].sort((a, b) => a.profit - b.profit);
  const bestDay = sortedByProfit.find(d => d.profit > 0) || null;
  const worstDay = sortedByLoss.find(d => d.profit < 0) || null;

  // ========== آنالیز نمادها ==========
  const symbolStats = () => {
    const symbolMap = new Map();
    trades.forEach(trade => {
      const symbol = trade.symbol;
      const profit = trade.profit || 0;
      const profitUsd = trade.profit_usd || 0;
      if (!symbolMap.has(symbol)) {
        symbolMap.set(symbol, { symbol, totalTrades: 0, winningTrades: 0, losingTrades: 0, totalProfit: 0, totalProfitUsd: 0 });
      }
      const entry = symbolMap.get(symbol);
      entry.totalTrades++;
      if (profit > 0) entry.winningTrades++;
      if (profit < 0) entry.losingTrades++;
      entry.totalProfit += profit;
      entry.totalProfitUsd += profitUsd;
    });
    return Array.from(symbolMap.values()).map(s => ({
      ...s,
      winRate: s.totalTrades > 0 ? (s.winningTrades / s.totalTrades * 100).toFixed(1) : 0,
      avgProfit: s.totalTrades > 0 ? (s.totalProfit / s.totalTrades).toFixed(2) : 0
    })).sort((a, b) => b.totalTrades - a.totalTrades);
  };
  const symbolData = symbolStats();
  const totalTradesCount = symbolData.reduce((sum, s) => sum + s.totalTrades, 0);
  const topSymbols = symbolData.slice(0, 5);
  const otherSymbols = symbolData.slice(5);
  const chartDataForPie = topSymbols.map(s => ({
    name: s.symbol,
    value: s.totalTrades,
    percentage: ((s.totalTrades / totalTradesCount) * 100).toFixed(1)
  }));
  if (otherSymbols.length > 0) {
    const otherTotal = otherSymbols.reduce((sum, s) => sum + s.totalTrades, 0);
    chartDataForPie.push({ name: "سایر", value: otherTotal, percentage: ((otherTotal / totalTradesCount) * 100).toFixed(1) });
  }

  const loadSetups = async () => {
  try {
    const res = await fetch('/api/setups', { headers: getAuthHeaders() });

    const data = await res.json();
    setSetups(data);
  } catch (error) {
    console.error("Error loading setups:", error);
  }
};

  useEffect(() => {
    loadAnalytics();
    loadSetups(); // ✅ اضافه کن
  }, [period, refreshTrigger]);
  
  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/report?period=${period}`, { headers: getAuthHeaders() });
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadWeeklyData = async (offset) => {
    setWeeklyLoading(true);
    try {
      const res = await fetch(`/api/analytics/weekly?weekOffset=${offset}`, { headers: getAuthHeaders() });
      const json = await res.json();
      setWeeklyData(json);
    } catch (error) {
      console.error("Error loading weekly data:", error);
    } finally {
      setWeeklyLoading(false);
    }
  };
  
  useEffect(() => {
    loadWeeklyData(weekOffset);
  }, [weekOffset]);
  
  const goPrevWeek = () => setWeekOffset(prev => prev - 1);
  const goNextWeek = () => setWeekOffset(prev => prev + 1);
  
  const persianDays = {
    Monday: "دوشنبه", Tuesday: "سه‌شنبه", Wednesday: "چهارشنبه",
    Thursday: "پنج‌شنبه", Friday: "جمعه", Saturday: "شنبه", Sunday: "یکشنبه"
  };
  
  const sessionAnalysis = data?.sessionStats?.map(session => {
    const mentalStat = data?.sessionMentalCorrelation?.find(m => m.session === session.session);
    const avgMental = mentalStat?.avgMental ? parseFloat(mentalStat.avgMental).toFixed(1) : null;
    const sessionProfitUsd = session.totalProfitUsd || 0;
    let recommendation = "";
    let recommendationColor = "";
    if (session.totalProfit > 0) {
      recommendation = "✅ این سشن برای شما سودده بوده است. همین روال را ادامه دهید.";
      recommendationColor = "text-emerald-400";
    } else if (session.totalProfit < 0) {
      recommendation = "⚠️ در این سشن ضرر کرده‌اید. بهتر است حجم معاملات را کاهش دهید یا استراتژی خود را بازبینی کنید.";
      recommendationColor = "text-amber-400";
    } else {
      recommendation = "📊 داده کافی برای تحلیل وجود ندارد. تریدهای بیشتری ثبت کنید.";
      recommendationColor = "text-gray-400";
    }
    return { ...session, avgMental, sessionProfitUsd, recommendation, recommendationColor };
  });

  // ========== کامپوننت نمودار دایره‌ای ==========
  const SimplePieChart = ({ data }) => {
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];
    let startAngle = 0;
    let total = data.reduce((sum, d) => sum + d.value, 0);
    return (
      <div className="flex flex-col items-center">
        <div className="relative w-48 h-48">
          <svg viewBox="-100 -100 200 200" className="transform -rotate-90">
            {data.map((item, index) => {
              const angle = (item.value / total) * 360;
              const endAngle = startAngle + angle;
              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;
              const x1 = 80 * Math.cos(startRad);
              const y1 = 80 * Math.sin(startRad);
              const x2 = 80 * Math.cos(endRad);
              const y2 = 80 * Math.sin(endRad);
              const largeArcFlag = angle > 180 ? 1 : 0;
              const pathData = [`M 0 0`, `L ${x1} ${y1}`, `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`, `Z`].join(' ');
              startAngle = endAngle;
              return (<path key={index} d={pathData} fill={colors[index % colors.length]} stroke="#1f1f22" strokeWidth="2" className="transition-all duration-300 hover:opacity-80 cursor-pointer" />);
            })}
            <circle cx="0" cy="0" r="40" fill="#1f1f22" stroke="#3f3f46" strokeWidth="2" />
            <text x="0" y="5" textAnchor="middle" fill="#a1a1aa" fontSize="14" className="font-bold" transform="rotate(90)">{totalTradesCount}</text>
          </svg>
        </div>
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
              <span className="text-xs text-gray-300">{item.name}</span>
              <span className="text-xs text-gray-500">({item.percentage}%)</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ========== تابع رسم نمودار خطی SVG برای خروجی ==========
  const generateLineChartSVG = (tradesData) => {
    if (tradesData.length === 0) return '<p>داده‌ای برای نمایش وجود ندارد</p>';
    const dailyData = new Map();
    tradesData.forEach(trade => {
      const date = trade.date;
      if (!dailyData.has(date)) dailyData.set(date, { profit: 0, profitUsd: 0 });
      const entry = dailyData.get(date);
      entry.profit += trade.profit || 0;
      entry.profitUsd += trade.profit_usd || 0;
    });
    const sortedDates = Array.from(dailyData.keys()).sort();
    const dailyProfits = sortedDates.map(d => dailyData.get(d).profit);
    const labels = sortedDates.map(d => d.split('-').slice(1).join('/'));
    let cumulative = 0;
    const cumulativeProfits = [];
    for (const p of dailyProfits) { cumulative += p; cumulativeProfits.push(cumulative); }
    const allValues = [...dailyProfits, ...cumulativeProfits];
    const maxVal = Math.max(...allValues, 1);
    const minVal = Math.min(...allValues, -1);
    const range = maxVal - minVal;
    const width = 700, height = 280;
    const padding = { top: 20, right: 25, bottom: 45, left: 45 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const stepX = chartWidth / (sortedDates.length - 1 || 1);
    const getY = (val) => padding.top + chartHeight - ((val - minVal) / range) * chartHeight;
    let svg = `<svg viewBox="0 0 ${width} ${height}" style="width:100%; height:auto; background:#1a1a1e; border-radius:12px;">`;
    for (let i = 0; i <= 4; i++) {
      const val = minVal + (range * i / 4);
      const y = getY(val);
      svg += `<line x1="${padding.left}" y1="${y}" x2="${padding.left + chartWidth}" y2="${y}" stroke="#333" stroke-width="0.5" stroke-dasharray="4,4"/>`;
      svg += `<text x="${padding.left - 6}" y="${y + 3}" fill="#a1a1aa" font-size="9" text-anchor="end">${val.toFixed(0)}%</text>`;
    }
    const zeroY = getY(0);
    svg += `<line x1="${padding.left}" y1="${zeroY}" x2="${padding.left + chartWidth}" y2="${zeroY}" stroke="#22c55e" stroke-width="1" stroke-dasharray="6,4"/>`;
    let dailyPath = `M ${padding.left} ${getY(dailyProfits[0])}`;
    for (let i = 1; i < dailyProfits.length; i++) dailyPath += ` L ${padding.left + i * stepX} ${getY(dailyProfits[i])}`;
    svg += `<path d="${dailyPath}" fill="none" stroke="#22c55e" stroke-width="2"/>`;
    let cumulativePath = `M ${padding.left} ${getY(cumulativeProfits[0])}`;
    for (let i = 1; i < cumulativeProfits.length; i++) cumulativePath += ` L ${padding.left + i * stepX} ${getY(cumulativeProfits[i])}`;
    svg += `<path d="${cumulativePath}" fill="none" stroke="#3b82f6" stroke-width="2"/>`;
    for (let i = 0; i < dailyProfits.length; i++) {
      const x = padding.left + i * stepX, y = getY(dailyProfits[i]);
      svg += `<circle cx="${x}" cy="${y}" r="3" fill="${dailyProfits[i] >= 0 ? '#22c55e' : '#ef4444'}" stroke="#fff" stroke-width="1"/>`;
    }
    for (let i = 0; i < cumulativeProfits.length; i++) {
      const x = padding.left + i * stepX, y = getY(cumulativeProfits[i]);
      svg += `<circle cx="${x}" cy="${y}" r="4" fill="#3b82f6" stroke="#fff" stroke-width="1"/>`;
    }
    for (let i = 0; i < labels.length; i++) {
      const x = padding.left + i * stepX;
      svg += `<text x="${x}" y="${padding.top + chartHeight + 18}" fill="#71717a" font-size="8" text-anchor="middle" transform="rotate(-30, ${x}, ${padding.top + chartHeight + 18})">${labels[i]}</text>`;
    }
    svg += `<text x="${width/2}" y="${height - 8}" fill="#a1a1aa" font-size="10" text-anchor="middle">تاریخ</text>`;
    svg += `<text x="14" y="${height/2}" fill="#a1a1aa" font-size="10" text-anchor="middle" transform="rotate(-90, 14, ${height/2})">سود (%)</text>`;
    svg += `<rect x="${width - 105}" y="6" width="99" height="32" rx="6" fill="#252529" stroke="#333" stroke-width="0.5"/>`;
    svg += `<line x1="${width - 96}" y1="17" x2="${width - 80}" y2="17" stroke="#22c55e" stroke-width="2"/><text x="${width - 74}" y="20" fill="#a1a1aa" font-size="8">روزانه</text>`;
    svg += `<line x1="${width - 96}" y1="28" x2="${width - 80}" y2="28" stroke="#3b82f6" stroke-width="2"/><text x="${width - 74}" y="31" fill="#a1a1aa" font-size="8">تجمعی</text>`;
    svg += `</svg>`;
    return svg;
  };

 // ========== تابع خروجی HTML ==========
const exportReport = () => {
  let start = exportStartDate;
  let end = exportEndDate;
  if (!start || !end) {
    const allDates = trades.map(t => t.date).sort();
    start = allDates[0] || '';
    end = allDates[allDates.length - 1] || '';
  }

  const filteredTrades = trades.filter(t => t.date >= start && t.date <= end);
  if (filteredTrades.length === 0) {
    alert("هیچ تریدی در این بازه وجود ندارد");
    return;
  }

  // ========== محاسبات برای خروجی ==========
  const filteredTotalProfitUsd = filteredTrades.reduce((s, t) => s + (t.profit_usd || 0), 0);
  const filteredTotalProfitPercent = initialCapital > 0 ? (filteredTotalProfitUsd / initialCapital) * 100 : 0;
  const filteredTotalTrades = filteredTrades.length;
  const filteredWinningTrades = filteredTrades.filter(t => t.profit > 0).length;
  const filteredWinRate = filteredTotalTrades > 0 ? (filteredWinningTrades / filteredTotalTrades * 100).toFixed(1) : 0;
  const filteredGrossProfit = filteredTrades.filter(t => t.profit > 0).reduce((s, t) => s + (t.profit_usd || 0), 0);
  const filteredGrossLoss = Math.abs(filteredTrades.filter(t => t.profit < 0).reduce((s, t) => s + (t.profit_usd || 0), 0));
  const filteredProfitFactor = filteredGrossLoss > 0 ? (filteredGrossProfit / filteredGrossLoss).toFixed(2) : filteredGrossProfit > 0 ? "∞" : "0";
  const filteredRecoveryFactor = data?.summary?.recoveryFactor || "—";
  
  // Best/Worst Day
  const dailyProfitMap = new Map();
  filteredTrades.forEach(trade => {
    const date = trade.date;
    if (!dailyProfitMap.has(date)) dailyProfitMap.set(date, { profit: 0, profitUsd: 0 });
    const entry = dailyProfitMap.get(date);
    entry.profit += trade.profit || 0;
    entry.profitUsd += trade.profit_usd || 0;
  });
  const dailyProfitArray = Array.from(dailyProfitMap.keys()).map(date => ({
    date,
    profit: dailyProfitMap.get(date).profit,
    profitUsd: dailyProfitMap.get(date).profitUsd
  }));
  const filteredBestDay = [...dailyProfitArray].sort((a, b) => b.profit - a.profit).find(d => d.profit > 0);
  const filteredWorstDay = [...dailyProfitArray].sort((a, b) => a.profit - b.profit).find(d => d.profit < 0);
  
  // Drawdowns
const calculateDrawdownsForExport = () => {
  if (filteredTrades.length === 0) return { 
    maxDrawdown: 0, maxDrawdownPercent: 0, 
    equityDrawdown: 0, equityDrawdownPercent: 0,
    currentDrawdownDaily: 0, currentDrawdownDailyPercent: 0,
    recoveryCount: 0 
  };
  
  const sortedTrades = [...filteredTrades].sort((a, b) => new Date(a.date) - new Date(b.date));
  const today = new Date().toISOString().split('T')[0];
  
  let equity = initialCapital;
  let peakEquity = equity;
  let maxDrawdown = 0;
  let maxDrawdownPercent = 0;
  let minEquity = equity;
  let recoveryCount = 0;
  let inDrawdown = false;
  
  // ✅ برای افت امروز
  let startOfDayCapital = initialCapital;
  let dailyDrawdown = 0;
  let hasTodayTrade = false;
  
  for (const trade of sortedTrades) {
    equity += trade.profit_usd || 0;
    
    // اگر روز جدید شروع شد
    if (trade.date === today && !hasTodayTrade) {
      startOfDayCapital = equity - (trade.profit_usd || 0);
      hasTodayTrade = true;
    }
    
    // محاسبه افت امروز
    if (trade.date === today) {
      const currentDrawdownFromStart = startOfDayCapital - equity;
      if (currentDrawdownFromStart > dailyDrawdown) {
        dailyDrawdown = currentDrawdownFromStart;
      }
    }
    
    if (equity > peakEquity) {
      peakEquity = equity;
      if (inDrawdown) {
        recoveryCount++;
        inDrawdown = false;
      }
    }
    
    const drawdown = peakEquity - equity;
    const drawdownPercent = (drawdown / peakEquity) * 100;
    
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownPercent = drawdownPercent;
      inDrawdown = true;
    }
    
    if (equity < minEquity) minEquity = equity;
  }
  
  const dailyDrawdownPercent = startOfDayCapital > 0 ? (dailyDrawdown / startOfDayCapital) * 100 : 0;
  
  return {
    maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
    maxDrawdownPercent: parseFloat(maxDrawdownPercent.toFixed(1)),
    equityDrawdown: parseFloat(Math.abs(minEquity - initialCapital).toFixed(2)),
    equityDrawdownPercent: parseFloat((Math.abs(minEquity - initialCapital) / initialCapital * 100).toFixed(1)),
    currentDrawdownDaily: parseFloat(dailyDrawdown.toFixed(2)),
    currentDrawdownDailyPercent: parseFloat(dailyDrawdownPercent.toFixed(1)),
    recoveryCount
  };
};
  const exportDrawdowns = calculateDrawdownsForExport();
  
  // Long/Short Won
  const totalLongWon = filteredTrades.filter(t => t.side === "Buy" && t.profit > 0).length;
  const totalShortWon = filteredTrades.filter(t => t.side === "Sell" && t.profit > 0).length;
  const totalLong = filteredTrades.filter(t => t.side === "Buy").length;
  const totalShort = filteredTrades.filter(t => t.side === "Sell").length;
  
  // Average Profit/Loss
  const winningTradesList = filteredTrades.filter(t => t.profit > 0);
  const losingTradesList = filteredTrades.filter(t => t.profit < 0);
  const avgProfitTrade = winningTradesList.length > 0 ? winningTradesList.reduce((s, t) => s + (t.profit_usd || 0), 0) / winningTradesList.length : 0;
  const avgLossTrade = losingTradesList.length > 0 ? losingTradesList.reduce((s, t) => s + (t.profit_usd || 0), 0) / losingTradesList.length : 0;
  
  // Sharpe Ratio
  const returns = filteredTrades.map(t => (t.profit_usd || 0) / initialCapital);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / (returns.length || 1);
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length || 1);
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;
  
  // Expected Payoff
  const expectedPayoff = filteredTrades.reduce((s, t) => s + (t.profit_usd || 0), 0) / (filteredTrades.length || 1);
  
  // Consecutive Wins/Losses
  let maxConsecutiveWinsVal = 0, maxConsecutiveLossesVal = 0;
  let currentWins = 0, currentLosses = 0;
  for (const trade of filteredTrades) {
    if (trade.profit > 0) { currentWins++; currentLosses = 0; if (currentWins > maxConsecutiveWinsVal) maxConsecutiveWinsVal = currentWins; }
    else if (trade.profit < 0) { currentLosses++; currentWins = 0; if (currentLosses > maxConsecutiveLossesVal) maxConsecutiveLossesVal = currentLosses; }
    else { currentWins = 0; currentLosses = 0; }
  }
  
  // Symbol Ranking
  const symbolProfitMap = new Map();
  filteredTrades.forEach(trade => {
    const symbol = trade.symbol;
    if (!symbolProfitMap.has(symbol)) symbolProfitMap.set(symbol, { totalTrades: 0, totalProfit: 0 });
    const entry = symbolProfitMap.get(symbol);
    entry.totalTrades++;
    entry.totalProfit += trade.profit_usd || 0;
  });
  const filteredSymbolData = Array.from(symbolProfitMap.keys()).map(s => ({
    symbol: s,
    totalTrades: symbolProfitMap.get(s).totalTrades,
    totalProfit: symbolProfitMap.get(s).totalProfit
  })).sort((a, b) => b.totalTrades - a.totalTrades);
  
  // Session Stats
  const sessionStatsMap = new Map();
  filteredTrades.forEach(trade => {
    const session = trade.session || "نامشخص";
    if (!sessionStatsMap.has(session)) sessionStatsMap.set(session, { totalTrades: 0, totalProfit: 0, winningTrades: 0 });
    const entry = sessionStatsMap.get(session);
    entry.totalTrades++;
    entry.totalProfit += trade.profit_usd || 0;
    if (trade.profit > 0) entry.winningTrades++;
  });
  const sessionStatsArray = Array.from(sessionStatsMap.keys()).map(session => {
    const data = sessionStatsMap.get(session);
    const winRate = data.totalTrades > 0 ? (data.winningTrades / data.totalTrades * 100).toFixed(1) : 0;
    return { session, totalTrades: data.totalTrades, totalProfit: data.totalProfit, winRate };
  }).sort((a, b) => b.totalProfit - a.totalProfit);
  
  // Balance Chart Data for export (only balance)
  const balanceData = [];
  let equityBalance = initialCapital;
  balanceData.push({ date: start, balance: equityBalance });
  const sortedForBalance = [...filteredTrades].sort((a, b) => new Date(a.date) - new Date(b.date));
  for (const trade of sortedForBalance) {
    equityBalance += trade.profit_usd || 0;
    balanceData.push({ date: trade.date, balance: equityBalance });
  }
  
  const maxBalance = Math.max(...balanceData.map(d => d.balance), initialCapital);
  const minBalance = Math.min(...balanceData.map(d => d.balance), initialCapital);
  const balanceRange = maxBalance - minBalance;
  
  const today = new Date().toLocaleDateString('fa-IR');
  
  const htmlContent = `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head><meta charset="UTF-8"><title>گزارش معاملاتی - Trading Pro</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Tahoma','Segoe UI',sans-serif;background:#0a0a0c;color:#e4e4e7;padding:30px 15px}
.container{max-width:1200px;margin:0 auto;background:#121215;border-radius:20px;padding:24px}
.header{text-align:center;border-bottom:1px solid #2a2a2e;padding-bottom:20px;margin-bottom:24px}
.header h1{font-size:24px;color:#10b981}
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
.stat-card{background:#1f1f23;border-radius:14px;padding:14px;text-align:center;border:1px solid #2a2a2e}
.stat-card .value{font-size:22px;font-weight:bold;margin-top:6px}
.stat-card .label{color:#a1a1aa;font-size:10px}
.section{margin-bottom:24px}
.section-title{font-size:16px;font-weight:bold;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid #10b981;display:inline-block}
table{width:100%;border-collapse:collapse;background:#1a1a1e;border-radius:10px;overflow:hidden;font-size:12px}
th,td{padding:8px 10px;text-align:center;border-bottom:1px solid #2a2a2e}
th{background:#252529;color:#10b981}
.profit-positive{color:#22c55e}
.profit-negative{color:#ef4444}
.footer{text-align:center;padding-top:20px;margin-top:24px;border-top:1px solid #2a2a2e;color:#52525b;font-size:11px}
.chart-container{background:#1a1a1e;border-radius:14px;padding:20px;margin-bottom:24px}
.chart-title{font-size:14px;font-weight:bold;margin-bottom:12px;color:#10b981;text-align:center}
.balance-value{font-size:20px;font-weight:bold;margin-top:10px}
</style>
</head>
<body>
<div class="container">
<div class="header"><h1>📊 Trading Pro - گزارش معاملاتی</h1><p style="color:#71717a;font-size:13px;margin-top:6px;">بازه: ${start} تا ${end}</p></div>

<!-- Key Metrics -->
<div class="stats-grid">
<div class="stat-card"><div>💰</div><div class="value ${filteredTotalProfitPercent >= 0 ? 'profit-positive' : 'profit-negative'}">${filteredTotalProfitPercent >= 0 ? '+' : ''}${filteredTotalProfitPercent.toFixed(1)}%</div><div class="value ${filteredTotalProfitUsd >= 0 ? 'profit-positive' : 'profit-negative'}" style="font-size:14px">${filteredTotalProfitUsd >= 0 ? '+' : ''}$${Math.abs(filteredTotalProfitUsd).toFixed(2)}</div><div class="label">سود/ضرر کل</div></div>
<div class="stat-card"><div>📊</div><div class="value">${filteredTotalTrades}</div><div class="label">تعداد تریدها</div></div>
<div class="stat-card"><div>🎯</div><div class="value ${filteredWinRate >= 50 ? 'profit-positive' : 'profit-negative'}">${filteredWinRate}%</div><div class="label">درصد موفقیت</div></div>
<div class="stat-card"><div>📈</div><div class="value profit-positive">${filteredProfitFactor}</div><div class="label">Profit Factor</div></div>
</div>

<!-- Best/Worst Day & Consecutive -->
<div class="stats-grid">
<div class="stat-card"><div>🏆 بهترین روز</div><div class="value profit-positive">${filteredBestDay ? `+${filteredBestDay.profit.toFixed(1)}%` : '—'}</div><div class="label">${filteredBestDay?.date || '—'}</div></div>
<div class="stat-card"><div>⚠️ بدترین روز</div><div class="value profit-negative">${filteredWorstDay ? `${filteredWorstDay.profit.toFixed(1)}%` : '—'}</div><div class="label">${filteredWorstDay?.date || '—'}</div></div>
<div class="stat-card"><div>🔥 بیشترین برد</div><div class="value profit-positive">${maxConsecutiveWinsVal}</div><div class="label">برد متوالی</div></div>
<div class="stat-card"><div>⚠️ بیشترین باخت</div><div class="value profit-negative">${maxConsecutiveLossesVal}</div><div class="label">باخت متوالی</div></div>
</div>

<!-- Drawdown Cards -->
<div class="stats-grid">
<div class="stat-card"><div>📉 حداکثر افت (MDD)</div><div class="value profit-negative">${exportDrawdowns.maxDrawdownPercent}%</div><div class="label">$${exportDrawdowns.maxDrawdown} دلار</div><div class="label">از قله تا قعر</div></div>
<div class="stat-card"><div>⚠️ افت از سرمایه</div><div class="value profit-negative">${exportDrawdowns.equityDrawdownPercent}%</div><div class="label">$${exportDrawdowns.equityDrawdown} دلار</div><div class="label">از شروع</div></div>
 <div class="stat-card"><div>📊 افت امروز</div><div class="value profit-negative">${exportDrawdowns.currentDrawdownDailyPercent}%</div><div class="label">$${exportDrawdowns.currentDrawdownDaily} دلار</div><div class="label">از ابتدای روز</div></div>
<div class="stat-card"><div>🔄 تعداد بازیابی</div><div class="value">${exportDrawdowns.recoveryCount}</div><div class="label">خروج از افت</div></div>
</div>

<!-- Advanced Stats -->
<div class="stats-grid">
<div class="stat-card"><div>💰 سود ناخالص</div><div class="value profit-positive">+$${filteredGrossProfit.toFixed(2)}</div><div class="label profit-negative">-$${filteredGrossLoss.toFixed(2)} ضرر</div></div>
<div class="stat-card"><div>📈 برد خرید/فروش</div><div class="value profit-positive">${totalLongWon}</div><div class="label text-sky-400">/${totalShortWon}</div></div>
<div class="stat-card"><div>📐 نسبت شارپ</div><div class="value ${sharpeRatio >= 1.5 ? 'profit-positive' : sharpeRatio >= 1 ? 'text-amber-400' : 'profit-negative'}">${sharpeRatio.toFixed(2)}</div></div>
<div class="stat-card"><div>🎯 Expected Payoff</div><div class="value ${expectedPayoff >= 0 ? 'profit-positive' : 'profit-negative'}">${expectedPayoff >= 0 ? '+' : ''}$${expectedPayoff.toFixed(2)}</div><div class="label">per trade</div></div>
<div class="stat-card"><div>🏆 میانگین سود</div><div class="value profit-positive">+$${avgProfitTrade.toFixed(2)}</div><div class="label profit-negative">-$${Math.abs(avgLossTrade).toFixed(2)} ضرر</div></div>
<div class="stat-card"><div>🔄 Recovery Factor</div><div class="value profit-positive">${filteredRecoveryFactor}</div></div>
</div>

<!-- Balance Chart -->
<div class="chart-container">
<div class="chart-title">📈 نمودار Balance (سرمایه)</div>
<div style="display:flex; justify-content:space-between; margin-bottom:10px; padding:0 10px;">
<div style="font-size:12px; color:#22c55e;">قله: $${maxBalance.toFixed(2)}</div>
<div style="font-size:12px; color:#ef4444;">قعر: $${minBalance.toFixed(2)}</div>
</div>
<div style="height:250px; position:relative;">
<svg viewBox="0 0 800 250" style="width:100%; height:100%; background:#1a1a1e; border-radius:10px;">
${(() => {
  const stepX = 800 / (balanceData.length - 1 || 1);
  const getY = (balance) => 220 - ((balance - minBalance) / balanceRange) * 180;
  let path = `M 0 ${getY(balanceData[0].balance)}`;
  for (let i = 1; i < balanceData.length; i++) {
    path += ` L ${i * stepX} ${getY(balanceData[i].balance)}`;
  }
  let points = '';
  for (let i = 0; i < balanceData.length; i++) {
    const x = i * stepX;
    const y = getY(balanceData[i].balance);
    points += `<circle cx="${x}" cy="${y}" r="3" fill="${balanceData[i].balance >= balanceData[i-1]?.balance ? '#22c55e' : '#ef4444'}" stroke="#fff" stroke-width="1"/>`;
  }
  return `<polyline points="${path.replace(/M /g, '').replace(/ L /g, ' ')}" fill="none" stroke="#10b981" stroke-width="2"/><text x="10" y="20" fill="#a1a1aa" font-size="10">سرمایه فعلی: $${equityBalance.toFixed(2)}</text>${points}`;
})()}
</svg>
</div>
</div>

<!-- Symbol Ranking -->
${filteredSymbolData.length > 0 ? `
<div class="section">
  <div class="section-title">📊 رتبه‌بندی نمادها</div>
  <table style="width:100%">
    <thead>
      <tr>
        <th style="text-align:center">#</th>
        <th style="text-align:center">نماد</th>
        <th style="text-align:center">تعداد</th>
        <th style="text-align:center">سود کل</th>
      </tr>
    </thead>
    <tbody>
      ${filteredSymbolData.slice(0, 10).map((s, idx) => `
        <tr>
          <td style="text-align:center;padding:8px">${idx + 1}</td>
          <td style="text-align:center;padding:8px">${s.symbol}</td>
          <td style="text-align:center;padding:8px">${s.totalTrades}</td>
          <td style="text-align:center;padding:8px" class="${s.totalProfit >= 0 ? 'profit-positive' : 'profit-negative'}">
            ${s.totalProfit >= 0 ? '+' : ''}$${Math.abs(s.totalProfit).toFixed(2)}
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</div>
` : ''}
<!-- Session Analysis -->
${sessionStatsArray.length > 0 ? `<div class="section"><div class="section-title">🕒 تحلیل سشن‌ها</div><table><thead><tr><th>سشن</th><th>تعداد ترید</th><th>سود کل</th><th>وین ریت</th></tr></thead><tbody>${sessionStatsArray.map(s => `<tr><td>${s.session}</td><td>${s.totalTrades}</td><td class="${s.totalProfit >= 0 ? 'profit-positive' : 'profit-negative'}">${s.totalProfit >= 0 ? '+' : ''}$${Math.abs(s.totalProfit).toFixed(2)}</td><td>${s.winRate}%</td></tr>`).join('')}</tbody></table></div>` : ''}

<!-- Trades List -->
<div class="section"><div class="section-title">📋 لیست تریدها</div><table><thead><tr><th>تاریخ</th><th>نماد</th><th>سمت</th><th>ریسک</th><th>R:R</th><th>نتیجه</th><th>سود</th><th>سود (دلار)</th></tr></thead><tbody>${filteredTrades.slice(0, 50).map(trade => `<tr><td>${trade.date}</td><td>${trade.symbol}</td><td>${trade.side === 'Buy' ? 'خرید' : 'فروش'}</td><td>${trade.risk}%</td><td>${trade.rr}</td><td>${trade.trade_type === 'TP' ? 'برد' : trade.trade_type === 'SL' ? 'باخت' : 'مساوی'}</td><td class="${trade.profit >= 0 ? 'profit-positive' : 'profit-negative'}">${trade.profit >= 0 ? '+' : ''}${trade.profit}%</td><td class="${trade.profit_usd >= 0 ? 'profit-positive' : 'profit-negative'}">${trade.profit_usd >= 0 ? '+' : ''}$${Math.abs(trade.profit_usd).toFixed(2)}</td></tr>`).join('')}</tbody></table>${filteredTrades.length > 50 ? `<p style="text-align:center;margin-top:10px;color:#71717a;">... و ${filteredTrades.length - 50} ترید دیگر</p>` : ''}</div>

<div class="footer"><p>📊 گزارش تولید شده توسط Trading Pro</p><p>💡 برای ذخیره PDF: Ctrl+P سپس Save as PDF</p></div>
</div>
</body>
</html>`;
  
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = `trading-report-${start}-to-${end}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  setShowExportModal(false);
};

  const setAllDateRange = () => {
    const allDates = trades.map(t => t.date).sort();
    if (allDates.length) {
      setExportStartDate(allDates[0]);
      setExportEndDate(allDates[allDates.length - 1]);
    }
  };

  if (loading) {
    return <div className="col-span-3 flex justify-center items-center py-20"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div><p className="text-gray-400">در حال بارگذاری...</p></div></div>;
  }
  
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-3 space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-sky-500/10 border border-white/10 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex justify-between items-center">
          <div><h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 via-emerald-400 to-sky-400 bg-clip-text text-transparent">📊 Analytics</h1><p className="text-gray-400 mt-1">تحلیل پیشرفته معاملات</p></div>
          <div className="flex bg-black/40 backdrop-blur-xl rounded-xl p-1 border border-white/10">
            <button onClick={() => setPeriod("weekly")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${period === "weekly" ? "bg-gradient-to-r from-emerald-500/30 to-emerald-600/30 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10" : "text-gray-400 hover:text-white"}`}>هفتگی</button>
            <button onClick={() => setPeriod("monthly")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${period === "monthly" ? "bg-gradient-to-r from-emerald-500/30 to-emerald-600/30 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10" : "text-gray-400 hover:text-white"}`}>ماهانه</button>
            <button onClick={() => setPeriod("all")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${period === "all" ? "bg-gradient-to-r from-emerald-500/30 to-emerald-600/30 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10" : "text-gray-400 hover:text-white"}`}>همه زمان‌ها</button>
          </div>
          <button onClick={() => setShowExportModal(true)} className="px-3 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 text-sm font-medium transition-all duration-200 flex items-center gap-2">📄 خروجی</button>
        </div>
      </div>
      
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-5 gap-4">
        <MetricCard icon="💰" value={`${totalProfitPercent >= 0 ? "+" : ""}${totalProfitPercent.toFixed(1)}%`} subValue={`${totalProfitUsd >= 0 ? "+" : ""}$${Math.abs(totalProfitUsd).toFixed(2)}`} label="سود/ضرر کل" valueColor={totalProfitPercent >= 0 ? "text-emerald-400" : "text-rose-400"} />
        <MetricCard icon="📊" value={totalTrades} label="تعداد تریدها" />
        <MetricCard icon="🎯" value={`${winRate}%`} label="درصد موفقیت" />
        <MetricCard icon="📈" value={profitFactor} label="Profit Factor" />
        <MetricCard icon="🔄" value={recoveryFactor} label="Recovery Factor" />
      </div>

      {/* Drawdown Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-rose-500/10 to-amber-500/5 border border-rose-500/20 rounded-2xl overflow-hidden relative">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl" />
          <CardContent className="p-4 relative z-10">
            <div className="flex items-center justify-between mb-2"><h4 className="text-xs text-rose-400 font-medium">📉 حداکثر افت (MDD)</h4><span className="text-[10px] text-gray-500">نسبت به بالاترین قله</span></div>
            <div className="text-2xl font-bold text-rose-400">{drawdowns.maxDrawdownPercent.toFixed(1)}%</div>
            <div className="text-xs text-gray-400 mt-1">${drawdowns.maxDrawdown} دلار</div>
            <div className="w-full bg-white/10 rounded-full h-1 mt-2"><div className="bg-rose-400 h-1 rounded-full" style={{ width: `${Math.min(maxDrawdownPercentOfCapital, 100)}%` }} /></div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-500/20 rounded-2xl overflow-hidden relative">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />
          <CardContent className="p-4 relative z-10">
            <div className="flex items-center justify-between mb-2"><h4 className="text-xs text-amber-400 font-medium">⚠️ افت از سرمایه</h4><span className="text-[10px] text-gray-500">از شروع</span></div>
            <div className="text-2xl font-bold text-amber-400">{drawdowns.equityDrawdownPercent.toFixed(1)}%</div>
            <div className="text-xs text-gray-400 mt-1">${drawdowns.equityDrawdown} دلار</div>
            <div className="w-full bg-white/10 rounded-full h-1 mt-2"><div className="bg-amber-400 h-1 rounded-full" style={{ width: `${Math.min(drawdowns.equityDrawdownPercent, 100)}%` }} /></div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-sky-500/10 to-blue-500/5 border border-sky-500/20 rounded-2xl overflow-hidden relative">
  <div className="absolute -top-10 -right-10 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl" />
  <CardContent className="p-4 relative z-10">
    <div className="flex items-center justify-between mb-2">
      <h4 className="text-xs text-sky-400 font-medium">📊 افت امروز</h4>
      <span className="text-[10px] text-gray-500">نسبت به سرمایه اولیه روز</span>
    </div>
    <div className="text-2xl font-bold text-sky-400">{drawdowns.currentDrawdownDailyPercent.toFixed(1)}%</div>
    <div className="text-xs text-gray-400 mt-1">${drawdowns.currentDrawdownDaily} دلار</div>
    <div className="w-full bg-white/10 rounded-full h-1 mt-2">
      <div className="bg-sky-400 h-1 rounded-full" style={{ width: `${Math.min(drawdowns.currentDrawdownDailyPercent, 100)}%` }} />
    </div>
  </CardContent>
</Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/5 border border-emerald-500/20 rounded-2xl overflow-hidden relative">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
          <CardContent className="p-4 relative z-10">
            <div className="flex items-center justify-between mb-2"><h4 className="text-xs text-emerald-400 font-medium">🔄 تعداد بازیابی</h4><span className="text-[10px] text-gray-500">خروج از افت</span></div>
            <div className="text-2xl font-bold text-emerald-400">{drawdowns.recoveryCount}</div>
            <div className="text-xs text-gray-400 mt-1">دفعات</div>
            <div className="text-[10px] text-gray-500 mt-2">بازیابی پس از ضرر</div>
          </CardContent>
        </Card>
      </div>

      {/* Best/Worst Day & Consecutive */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl overflow-hidden relative">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
          <CardContent className="p-4 text-center relative z-10"><p className="text-xs text-emerald-400 mb-1 font-medium">🏆 بهترین روز</p><div className="text-sm font-bold text-white">{bestDay?.date || "—"}</div><div className="text-base font-bold text-emerald-400 mt-1">{bestDay ? `+${bestDay.profit.toFixed(1)}%` : "—"}</div>{bestDay && (<div className="text-xs text-emerald-400/70 mt-0.5">+${Math.abs(bestDay.profitUsd).toFixed(2)}</div>)}</CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border border-rose-500/20 rounded-2xl overflow-hidden relative">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl" />
          <CardContent className="p-4 text-center relative z-10"><p className="text-xs text-rose-400 mb-1 font-medium">⚠️ بدترین روز</p><div className="text-sm font-bold text-white">{worstDay?.date || "—"}</div><div className="text-base font-bold text-rose-400 mt-1">{worstDay ? `${worstDay.profit.toFixed(1)}%` : "—"}</div>{worstDay && (<div className="text-xs text-rose-400/70 mt-0.5">-${Math.abs(worstDay.profitUsd).toFixed(2)}</div>)}</CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl overflow-hidden relative">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
          <CardContent className="p-4 text-center relative z-10"><p className="text-xs text-emerald-400 mb-1 font-medium">🔥 بیشترین برد متوالی</p><div className="text-2xl font-bold text-emerald-400">{maxConsecutiveWins}</div><div className="text-[10px] text-gray-500 mt-1">ترید پشت سر هم</div></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border border-rose-500/20 rounded-2xl overflow-hidden relative">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl" />
          <CardContent className="p-4 text-center relative z-10"><p className="text-xs text-rose-400 mb-1 font-medium">⚠️ بیشترین باخت متوالی</p><div className="text-2xl font-bold text-rose-400">{maxConsecutiveLosses}</div><div className="text-[10px] text-gray-500 mt-1">ترید پشت سر هم</div></CardContent>
        </Card>
      </div>

     
      {/* Advanced Statistics - Compact Version */}
<Card className="relative overflow-hidden bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 backdrop-blur-xl border border-white/10 rounded-2xl">
  <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />
  <CardContent className="p-4 relative z-10">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
        <span className="text-xs">📊</span>
      </div>
      <h3 className="text-xs font-semibold text-gray-300">Advanced Stats</h3>
    </div>
    
    <div className="grid grid-cols-3 gap-2">
      {/* Gross Profit / Loss */}
      <div className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center gap-1">
          <span className="text-emerald-400 text-sm">💰</span>
          <span className="text-[10px] text-gray-500">Gross P/L</span>
        </div>
        <div>
          <span className="text-xs font-bold text-emerald-400">+${grossProfit.toFixed(0)}</span>
          <span className="text-xs text-gray-600 mx-1">/</span>
          <span className="text-xs font-bold text-rose-400">-${Math.abs(grossLoss).toFixed(0)}</span>
        </div>
      </div>
      
    {/* Long/Short Won */}
<div className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/10">
  <div className="flex items-center gap-1">
    <span className="text-emerald-400 text-sm">📈</span>
    <span className="text-[10px] text-gray-500">Long/Short</span>
  </div>
  <div>
    <span className="text-xs font-bold text-emerald-400">{totalLongWon}</span>
    <span className="text-xs text-gray-600 mx-1">/</span>
    <span className="text-xs font-bold text-sky-400">{totalShortWon}</span>
  </div>
</div>
      
      {/* Sharpe Ratio */}
      <div className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center gap-1">
          <span className="text-amber-400 text-sm">📐</span>
          <span className="text-[10px] text-gray-500">Sharpe</span>
        </div>
        <div>
          <span className={`text-xs font-bold ${sharpeRatio >= 1.5 ? 'text-emerald-400' : sharpeRatio >= 1 ? 'text-amber-400' : 'text-rose-400'}`}>
            {sharpeRatio.toFixed(2)}
          </span>
        </div>
      </div>
      
      {/* Average Profit Trade */}
      <div className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center gap-1">
          <span className="text-emerald-400 text-sm">🏆</span>
          <span className="text-[10px] text-gray-500">Avg Profit</span>
        </div>
        <div>
          <span className="text-xs font-bold text-emerald-400">+${avgProfitTrade.toFixed(2)}</span>
        </div>
      </div>
      
      {/* Average Loss Trade */}
      <div className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center gap-1">
          <span className="text-rose-400 text-sm">⚠️</span>
          <span className="text-[10px] text-gray-500">Avg Loss</span>
        </div>
        <div>
          <span className="text-xs font-bold text-rose-400">-${Math.abs(avgLossTrade).toFixed(2)}</span>
        </div>
      </div>
      
      {/* Expected Payoff - full width */}
      <div className="col-span-3 flex justify-between items-center p-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20">
        <div className="flex items-center gap-2">
          <span className="text-purple-400 text-sm">🎯</span>
          <span className="text-[10px] text-gray-400">Expected Payoff</span>
        </div>
        <div>
          <span className={`text-sm font-bold ${expectedPayoff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {expectedPayoff >= 0 ? '+' : ''}${expectedPayoff.toFixed(2)}
          </span>
          <span className="text-[10px] text-gray-600 ml-2">per trade</span>
        </div>
      </div>
    </div>
  </CardContent>
</Card>
      {/* Symbol Ranking with Pie Chart */}
{symbolData.length > 0 && (
  <Card className="relative overflow-hidden bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 backdrop-blur-xl border border-white/10 rounded-2xl">
    <div className="absolute top-0 right-0 w-40 h-40 bg-sky-500/10 rounded-full blur-2xl" />
    <CardContent className="p-5 relative z-10" style={{ direction: "rtl", textAlign: "right" }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/25">
          <span className="text-sm">📊</span>
        </div>
        <h3 className="text-sm font-semibold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          رتبه‌بندی نمادها
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex justify-center">
          <SimplePieChart data={chartDataForPie} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-right py-2 px-3 text-gray-400">#</th>
                <th className="text-right py-2 px-3 text-gray-400">نماد</th>
                <th className="text-right py-2 px-3 text-gray-400">تعداد</th>
                <th className="text-right py-2 px-3 text-gray-400">وین ریت</th>
                <th className="text-right py-2 px-3 text-gray-400">سود کل</th>
              </tr>
            </thead>
            <tbody>
              {symbolData.slice(0, 7).map((symbol, idx) => {
                const winRateClass = symbol.winRate >= 50 ? "text-emerald-400" : "text-rose-400";
                const profitClass = symbol.totalProfit >= 0 ? "text-emerald-400" : "text-rose-400";
                const profitSign = symbol.totalProfit >= 0 ? "+" : "";
                return (
                  <tr key={symbol.symbol} className="border-b border-white/5">
                    <td className="py-2 px-3 text-gray-500">{idx + 1}</td>
                    <td className="py-2 px-3 font-medium text-white">{symbol.symbol}</td>
                    <td className="py-2 px-3 text-gray-300">{symbol.totalTrades}</td>
                    <td className={`py-2 px-3 ${winRateClass}`}>{symbol.winRate}%</td>
                    <td className={`py-2 px-3 ${profitClass}`}>{profitSign}{symbol.totalProfit.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </CardContent>
  </Card>
)}
      {/* Weekly Performance */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 backdrop-blur-xl border border-white/10 rounded-2xl">
        <div className="absolute top-0 left-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl" />
        <CardContent className="p-5 relative z-10">
          <div className="flex justify-between items-center mb-4"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25"><span className="text-sm">📅</span></div><h3 className="text-sm font-semibold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">عملکرد هفتگی</h3></div><div className="flex items-center gap-3"><button onClick={goPrevWeek} className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-200 border border-white/10">◀</button><span className="text-xs text-gray-400">{weeklyData?.weekStart} – {weeklyData?.weekEnd}</span><button onClick={goNextWeek} className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-200 border border-white/10">▶</button></div></div>
          {weeklyLoading ? <div className="text-center py-8 text-gray-400">در حال بارگذاری...</div> : weeklyData ? <div className="grid grid-cols-7 gap-3">{weeklyData.daysOfWeek?.map((day, idx) => { const dayProfit = day.trades.reduce((s, t) => s + (t.profit || 0), 0); const dayProfitUsd = day.trades.reduce((s, t) => s + (t.profit_usd || 0), 0); const tradeCount = day.trades.length; const hasTrade = tradeCount > 0; const mental = day.assessment?.mental; const profitColor = dayProfit > 0 ? "text-emerald-400" : dayProfit < 0 ? "text-rose-400" : "text-gray-500"; const profitSign = dayProfit > 0 ? "+" : ""; const bgGradient = hasTrade ? "bg-gradient-to-br from-emerald-500/10 to-sky-500/10 border-emerald-500/30" : "bg-white/5"; return (<motion.div key={idx} whileHover={{ scale: 1.02, y: -2 }} className={`text-center p-3 rounded-xl backdrop-blur-sm border transition-all duration-200 ${bgGradient}`}><div className="text-xs font-medium text-gray-400">{persianDays[day.dayName]}</div><div className={`text-base font-bold mt-1 ${profitColor}`}>{hasTrade ? `${profitSign}${dayProfit.toFixed(1)}%` : "—"}</div>{hasTrade && <div className={`text-[10px] ${profitColor} opacity-70`}>{profitSign}$${Math.abs(dayProfitUsd).toFixed(2)}</div>}<div className="text-[10px] text-gray-500 mt-0.5">{hasTrade ? `${tradeCount} ترید` : "—"}</div>{hasTrade && mental && <div className="text-[9px] text-gray-500 mt-1 flex items-center justify-center gap-0.5"><span>🧠</span> {mental}</div>}</motion.div>); })}</div> : <p className="text-xs text-gray-500 text-center py-8">داده‌ای برای این هفته وجود ندارد</p>}
        </CardContent>
      </Card>
      
      {/* Session Analysis */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 backdrop-blur-xl border border-white/10 rounded-2xl">
        <div className="absolute top-0 left-0 w-40 h-40 bg-sky-500/10 rounded-full blur-2xl" />
        <CardContent className="p-0 relative z-10">
          <div className="px-5 py-3 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent"><div className="flex justify-between items-center"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/25"><span className="text-sm">🕒</span></div><h3 className="text-sm font-semibold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">تحلیل سشن‌ها</h3></div><div className="flex gap-3 text-[9px]"><div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div><span className="text-gray-500">عالی</span></div><div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/10"><div className="w-1.5 h-1.5 rounded-full bg-sky-500"></div><span className="text-gray-500">خوب</span></div><div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div><span className="text-gray-500">متوسط</span></div><div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10"><div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div><span className="text-gray-500">ضعیف</span></div></div></div></div>
          <div className="max-h-[350px] overflow-y-auto p-4 space-y-3">{sessionAnalysis?.length > 0 ? sessionAnalysis.map((s, idx) => { const winRatePercent = (s.winRate * 100).toFixed(0); let statusColor = "", statusBg = "", statusIcon = "", statusText = "", gradient = ""; if (s.totalProfit > 2 && s.winRate > 0.6) { statusColor = "text-emerald-400"; statusBg = "bg-emerald-500/10"; gradient = "from-emerald-500/20 to-transparent"; statusIcon = "🔥"; statusText = "عالی"; } else if (s.totalProfit > 0 && s.winRate > 0.4) { statusColor = "text-sky-400"; statusBg = "bg-sky-500/10"; gradient = "from-sky-500/20 to-transparent"; statusIcon = "📈"; statusText = "خوب"; } else if (s.totalProfit > -1) { statusColor = "text-amber-400"; statusBg = "bg-amber-500/10"; gradient = "from-amber-500/20 to-transparent"; statusIcon = "⚠️"; statusText = "متوسط"; } else { statusColor = "text-rose-400"; statusBg = "bg-rose-500/10"; gradient = "from-rose-500/20 to-transparent"; statusIcon = "❌"; statusText = "ضعیف"; } return (<motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} whileHover={{ scale: 1.01, x: 5 }} className={`relative overflow-hidden rounded-xl border border-white/10 p-3 transition-all duration-200 ${statusBg}`}><div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-30`} /><div className="relative z-10"><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span className="text-base">{statusIcon}</span><span className="text-sm font-semibold text-white">{s.session}</span><span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBg} ${statusColor} border border-white/10`}>{statusText}</span></div><div className="text-right"><div className={`text-sm font-bold ${s.totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{s.totalProfit >= 0 ? "+" : ""}{s.totalProfit.toFixed(1)}%</div><div className={`text-[10px] ${s.totalProfit >= 0 ? "text-emerald-400/70" : "text-rose-400/70"}`}>{s.totalProfit >= 0 ? "+" : ""}$${Math.abs(s.sessionProfitUsd).toFixed(2)}</div></div></div><div className="flex items-center justify-between text-[10px] text-gray-400 mb-2"><div className="flex items-center gap-4"><span>📊 {s.tradeCount} ترید</span><span>🎯 {winRatePercent}%</span><span>🧠 {s.avgMental || "—"}/10</span></div><div className="w-20 bg-zinc-700/50 rounded-full h-1.5 overflow-hidden"><motion.div className={`h-full rounded-full ${winRatePercent >= 70 ? "bg-emerald-500" : winRatePercent >= 50 ? "bg-sky-500" : winRatePercent >= 30 ? "bg-amber-500" : "bg-rose-500"}`} initial={{ width: 0 }} animate={{ width: `${winRatePercent}%` }} transition={{ duration: 0.5, delay: idx * 0.05 }} /></div></div>{s.tradeCount >= 3 && (<div className="text-[11px] text-right mt-2 pt-2 border-t border-white/5"><span className={s.recommendationColor}>💡 {s.recommendation}</span></div>)}</div></motion.div>); }) : <div className="text-center py-12"><div className="text-5xl mb-3 opacity-50">📭</div><p className="text-sm text-gray-500">هنوز داده‌ای برای سشن ثبت نشده است.</p><p className="text-xs text-gray-600 mt-1">با ثبت تریدها، آمار این بخش نمایش داده می‌شود.</p></div>}</div>
        </CardContent>
      </Card>
{/* ========== تحلیل ستاپ‌ها ========== */}
{(() => {
  const setupsStats = () => {
    if (trades.length === 0 || setups.length === 0) return [];
    
    const setupsMap = new Map();
    
    trades.forEach(trade => {
      const setupId = trade.setup_id;
      if (!setupId) return;
      
      const profit = trade.profit || 0;
      const profitUsd = trade.profit_usd || 0;
      
      if (!setupsMap.has(setupId)) {
        setupsMap.set(setupId, {
          setupId: setupId,
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          totalProfit: 0,
          totalProfitUsd: 0
        });
      }
      
      const entry = setupsMap.get(setupId);
      entry.totalTrades++;
      if (profit > 0) entry.winningTrades++;
      if (profit < 0) entry.losingTrades++;
      entry.totalProfit += profit;
      entry.totalProfitUsd += profitUsd;
    });
    
    const setupsInfo = new Map();
    setups.forEach(setup => {
      setupsInfo.set(setup.id, {
        name: setup.name,
        type: setup.type,
        rr: setup.rr
      });
    });
    
    const result = [];
    for (const [setupId, stats] of setupsMap) {
      const info = setupsInfo.get(setupId) || { name: `Setup ${setupId}`, type: 'normal', rr: 1 };
      const winRate = stats.totalTrades > 0 ? (stats.winningTrades / stats.totalTrades * 100).toFixed(1) : 0;
      const avgProfit = stats.totalTrades > 0 ? (stats.totalProfit / stats.totalTrades).toFixed(2) : 0;
      const avgProfitUsd = stats.totalTrades > 0 ? (stats.totalProfitUsd / stats.totalTrades).toFixed(2) : 0;
      const profitFactor = stats.losingTrades > 0 ? (stats.totalProfit / Math.abs(stats.losingTrades)).toFixed(2) : stats.totalProfit > 0 ? "∞" : "0";
      
      result.push({
        id: setupId,
        name: info.name,
        type: info.type,
        rr: info.rr,
        ...stats,
        winRate,
        avgProfit,
        avgProfitUsd,
        profitFactor
      });
    }
    
    return result.sort((a, b) => b.totalProfit - a.totalProfit);
  };
  
  const setupsStatsData = setupsStats();
  
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 backdrop-blur-xl border border-white/10 rounded-2xl">
      <div className="absolute top-0 left-0 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl" />
      
      <CardContent className="p-0 relative z-10">
        {/* هدر */}
        <div className="px-5 py-3 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 bg-sky-500/30 blur-xl rounded-full" />
                <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/25">
                  <span className="text-sm">📊</span>
                </div>
              </div>
              <h3 className="text-sm font-semibold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                تحلیل ستاپ‌ها
              </h3>
            </div>
            {/* بدون برچسب اضافی */}
          </div>
        </div>
        
        {/* محتوا */}
        <div className="p-4">
          {setupsStatsData.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-3 opacity-50">📭</div>
              <p className="text-sm text-gray-500">هیچ داده‌ای برای نمایش وجود ندارد</p>
              <p className="text-xs text-gray-600 mt-1">برای مشاهده آمار ستاپ‌ها، ابتدا ستاپ‌ها را در صفحه Setups ایجاد کنید و تریدها را با ستاپ ثبت کنید.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ textAlign: "center" }}>
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-2 px-3 text-gray-400" style={{ textAlign: "center" }}>#</th>
                      <th className="py-2 px-3 text-gray-400" style={{ textAlign: "center" }}>نام ستاپ</th>
                      <th className="py-2 px-3 text-gray-400" style={{ textAlign: "center" }}>نوع</th>
                      <th className="py-2 px-3 text-gray-400" style={{ textAlign: "center" }}>R:R</th>
                      <th className="py-2 px-3 text-gray-400" style={{ textAlign: "center" }}>تعداد</th>
                      <th className="py-2 px-3 text-gray-400" style={{ textAlign: "center" }}>برد/باخت</th>
                      <th className="py-2 px-3 text-gray-400" style={{ textAlign: "center" }}>وین ریت</th>
                      <th className="py-2 px-3 text-gray-400" style={{ textAlign: "center" }}>سود کل</th>
                      <th className="py-2 px-3 text-gray-400" style={{ textAlign: "center" }}>سود (دلار)</th>
                      <th className="py-2 px-3 text-gray-400" style={{ textAlign: "center" }}>میانگین سود</th>
                      <th className="py-2 px-3 text-gray-400" style={{ textAlign: "center" }}>Profit Factor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {setupsStatsData.map((setup, idx) => {
                      const profitClass = setup.totalProfit >= 0 ? "text-emerald-400" : "text-rose-400";
                      const winRateClass = setup.winRate >= 50 ? "text-emerald-400" : "text-rose-400";
                      const typeClass = setup.type === 'aplus' ? "text-yellow-400 bg-yellow-500/20" : "text-sky-400 bg-sky-500/20";
                      const typeText = setup.type === 'aplus' ? "⭐ A+" : "📘 Normal";
                      
                      return (
                        <tr key={setup.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-2 px-3 text-gray-500" style={{ textAlign: "center" }}>{idx + 1}</td>
                          <td className="py-2 px-3 font-medium text-white" style={{ textAlign: "center" }}>{setup.name}</td>
                          <td className="py-2 px-3" style={{ textAlign: "center" }}>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${typeClass}`}>{typeText}</span>
                          </td>
                          <td className="py-2 px-3 text-gray-300" style={{ textAlign: "center" }}>{setup.rr}</td>
                          <td className="py-2 px-3 text-gray-300" style={{ textAlign: "center" }}>{setup.totalTrades}</td>
                          {/* برد/باخت به صورت صحیح: برد / باخت */}
                          <td className="py-2 px-3 text-gray-300" style={{ textAlign: "center" }}>
                            <span className="text-emerald-400 font-medium">{setup.winningTrades}</span>
                            <span className="text-gray-500 mx-1">/</span>
                            <span className="text-rose-400 font-medium">{setup.losingTrades}</span>
                          </td>
                          <td className={`py-2 px-3 ${winRateClass}`} style={{ textAlign: "center" }}>{setup.winRate}%</td>
                          <td className={`py-2 px-3 ${profitClass}`} style={{ textAlign: "center" }}>
                            {setup.totalProfit >= 0 ? '+' : ''}{setup.totalProfit.toFixed(1)}%
                          </td>
                          <td className={`py-2 px-3 ${profitClass}`} style={{ textAlign: "center" }}>
                            {setup.totalProfitUsd >= 0 ? '+' : ''}${Math.abs(setup.totalProfitUsd).toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-gray-300" style={{ textAlign: "center" }}>
                            {setup.avgProfit >= 0 ? '+' : ''}{setup.avgProfit}%
                            <div className="text-[10px] text-gray-500">(${setup.avgProfitUsd})</div>
                          </td>
                          <td className="py-2 px-3" style={{ textAlign: "center" }}>
                            <span className={`text-xs font-medium ${setup.profitFactor >= 1.5 ? 'text-emerald-400' : setup.profitFactor >= 1 ? 'text-amber-400' : 'text-rose-400'}`}>
                              {setup.profitFactor}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* خلاصه بهترین ستاپ */}
              <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-sky-500/5 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-emerald-400 text-sm">🏆</span>
                  <span className="text-xs text-gray-400">بهترین ستاپ از نظر بازدهی:</span>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white">{setupsStatsData[0].name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${setupsStatsData[0].type === 'aplus' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-sky-500/20 text-sky-400'}`}>
                      {setupsStatsData[0].type === 'aplus' ? '⭐ A+' : '📘 Normal'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center"><div className="text-xs text-gray-500">تعداد ترید</div><div className="text-sm font-bold text-white">{setupsStatsData[0].totalTrades}</div></div>
                    <div className="text-center"><div className="text-xs text-gray-500">وین ریت</div><div className={`text-sm font-bold ${setupsStatsData[0].winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>{setupsStatsData[0].winRate}%</div></div>
                    <div className="text-center"><div className="text-xs text-gray-500">سود کل</div><div className={`text-sm font-bold ${setupsStatsData[0].totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{setupsStatsData[0].totalProfit >= 0 ? '+' : ''}{setupsStatsData[0].totalProfit.toFixed(1)}%</div></div>
                    <div className="text-center"><div className="text-xs text-gray-500">Profit Factor</div><div className="text-sm font-bold text-emerald-400">{setupsStatsData[0].profitFactor}</div></div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
})()}
      
      {/* Impact of Mental State */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 backdrop-blur-xl border border-white/10 rounded-2xl">
        <div className="absolute top-0 right-0 w-48 h-24 bg-purple-500/10 rounded-full blur-2xl" />
        <CardContent className="p-5 relative z-10" style={{ direction: "rtl", textAlign: "right" }}>
          <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25"><span className="text-sm">🧠</span></div><h3 className="text-sm font-semibold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">تأثیر وضعیت ذهنی بر عملکرد</h3></div>
          <p className="text-xs text-gray-500 mb-4">این بخش نشان می‌دهد که سطح آمادگی ذهنی شما در روزهای مختلف چه تأثیری روی میانگین سود یا ضرر داشته است.</p>
          <div className="space-y-4">{data?.mentalCorrelation && data.mentalCorrelation.length > 0 ? data.mentalCorrelation.map((item, idx) => (<motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}><div className="flex justify-between text-sm mb-1"><div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${item.avgProfit >= 0 ? "bg-emerald-500" : "bg-rose-500"}`} /><span className="text-gray-300">{item.mentalLevel}</span></div><span className={`font-semibold ${item.avgProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{item.avgProfit >= 0 ? "+" : ""}{item.avgProfit?.toFixed(1)}% میانگین</span></div><div className="w-full bg-zinc-800/50 rounded-full h-2 overflow-hidden"><motion.div className={`h-full rounded-full ${item.avgProfit >= 0 ? "bg-gradient-to-r from-emerald-500 to-emerald-400" : "bg-gradient-to-r from-rose-500 to-rose-400"}`} initial={{ width: 0 }} animate={{ width: `${Math.min(100, Math.abs(item.avgProfit) * 10)}%` }} transition={{ duration: 0.5, delay: idx * 0.1 }} /></div><div className="text-[10px] text-gray-500 mt-1 flex gap-3"><span>📊 {item.tradeCount} ترید</span><span>🎯 موفقیت: {(item.winRate * 100).toFixed(0)}%</span></div></motion.div>)) : <div className="text-center py-6"><p className="text-xs text-amber-500">ℹ️ برای مشاهده این بخش، حداقل چند ترید با سنجش ذهنی ثبت کنید.</p></div>}</div>
        </CardContent>
      </Card>
      
{/* Key Insights */}
<Card className="relative overflow-hidden bg-gradient-to-r from-emerald-900/20 via-sky-900/20 to-purple-900/20 backdrop-blur-xl border border-white/10 rounded-2xl">
  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-purple-500/5" />
  <CardContent className="p-5 relative z-10" style={{ direction: "rtl", textAlign: "right" }}>
    <div className="flex items-center gap-2 mb-3">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
        <span className="text-sm">💡</span>
      </div>
      <h3 className="text-sm font-semibold bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">نکات کلیدی</h3>
    </div>
    <ul className="space-y-2 text-sm">
      <li className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
        <span className="text-emerald-400">📊</span>
        <span className="text-white">Profit Factor: <span className="text-emerald-400 font-bold">{profitFactor}</span></span>
        <span className="text-xs text-gray-400">{profitFactor >= 1.5 ? "(عالی)" : profitFactor >= 1 ? "(خوب)" : "(نیاز به بهبود)"}</span>
      </li>
      <li className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
        <span className="text-sky-400">🔄</span>
        <span className="text-white">Recovery Factor: <span className="text-emerald-400 font-bold">{recoveryFactor}</span></span>
        <span className="text-xs text-gray-400">{recoveryFactor >= 1.5 ? "(بازیابی قوی)" : recoveryFactor >= 1 ? "(قابل بازیابی)" : recoveryFactor === "—" ? "(هنوز داده کافی نیست)" : "(بازیابی ضعیف)"}</span>
      </li>
      <li className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
        <span className="text-emerald-400">🏆</span>
        <span className="text-white">بیشترین برد متوالی: <span className="text-emerald-400 font-bold">{maxConsecutiveWins}</span> ترید</span>
      </li>
      <li className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
        <span className="text-rose-400">⚠️</span>
        <span className="text-white">بیشترین باخت متوالی: <span className="text-rose-400 font-bold">{maxConsecutiveLosses}</span> ترید</span>
      </li>
      {bestDay && (
        <li className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
          <span className="text-emerald-400">✅</span>
          <span className="text-white">بهترین روز معاملاتی شما <span className="text-emerald-400">{bestDay.date}</span> با سود +{bestDay.profit.toFixed(1)}% (+${Math.abs(bestDay.profitUsd).toFixed(2)}) بوده است.</span>
        </li>
      )}
    </ul>
  </CardContent>
</Card>

      {/* Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-bold text-center mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">📄 خروجی گزارش</h2>
            <div className="space-y-4" style={{ direction: "rtl", textAlign: "right" }}><div><label className="block text-sm text-gray-400 mb-2">بازه تاریخ:</label><div className="flex gap-2 mb-2"><input type="date" value={exportStartDate} onChange={(e) => setExportStartDate(e.target.value)} className="flex-1 bg-zinc-800 p-2 rounded-xl text-white outline outline-1 outline-white/10" /><span className="text-gray-500">تا</span><input type="date" value={exportEndDate} onChange={(e) => setExportEndDate(e.target.value)} className="flex-1 bg-zinc-800 p-2 rounded-xl text-white outline outline-1 outline-white/10" /></div><button onClick={setAllDateRange} className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 text-sm">همه</button></div><div className="flex gap-3 pt-4"><button onClick={() => setShowExportModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-2 rounded-xl">انصراف</button><button onClick={exportReport} className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-2 rounded-xl font-semibold shadow-lg">خروجی بگیر</button></div></div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function MetricCard({ icon, value, subValue, label, valueColor = "text-white" }) {
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
      <Card className="relative overflow-hidden bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-white/20 transition-all duration-300">
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
        <CardContent className="p-4 text-center relative z-10">
          <div className="text-3xl mb-2">{icon}</div>
          <div className={`text-xl font-bold ${valueColor}`}>
            {value}
            {subValue && <span className="text-sm font-normal text-gray-400 mr-2">({subValue})</span>}
          </div>
          <div className="text-xs text-gray-500 mt-1">{label}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
}