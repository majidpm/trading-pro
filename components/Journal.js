"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

// تابع کمکی برای گرفتن هدر احراز هویت
const getAuthHeaders = () => {
  const user = JSON.parse(localStorage.getItem('trading_user') || '{}');
  return {
    'x-user-id': user.id?.toString() || '1'
  };
};

export default function Journal({ onTradeUpdate }) {
  const [trades, setTrades] = useState([]);
  const [setups, setSetups] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [viewMode, setViewMode] = useState("daily");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [initialCapital, setInitialCapital] = useState(0);
  const [symbols, setSymbols] = useState([
    "Nasdaq", "S&P", "Dji", "XAU", "Eurusd", 
    "Gbpusd", "Audusd", "Usdjpy", "Usdcad", "Eurjpy", "Gpyjpy"
  ]);
  const [showAddSymbolModal, setShowAddSymbolModal] = useState(false);
  const [newSymbolName, setNewSymbolName] = useState("");
  const [riskType, setRiskType] = useState("percent");
const [riskDollar, setRiskDollar] = useState("");
const [currentCapital, setCurrentCapital] = useState(0);
  
  const [newTrade, setNewTrade] = useState({
    symbol: symbols[0] || "Nasdaq",
    side: "Buy",
    risk: 1,
    rr: 1,
    tradeType: "TP",
    profit: "",
    setupId: "",
    images: [],
    notes: "",
    date: new Date().toISOString().split('T')[0],
    session: "London",
    rulesAdhered: false
  });

  const sessionOptions = [
    "London", "London Close", "NY Open", 
    "New York Pre", "PM session", "Asia"
  ];

  useEffect(() => {
    const savedSymbols = localStorage.getItem("tradingSymbols");
    if (savedSymbols) {
      setSymbols(JSON.parse(savedSymbols));
    }
  }, []);

  const saveSymbols = (newSymbols) => {
    localStorage.setItem("tradingSymbols", JSON.stringify(newSymbols));
    setSymbols(newSymbols);
  };

  const addNewSymbol = () => {
    if (!newSymbolName.trim()) {
      alert("لطفاً نام نماد را وارد کنید");
      return;
    }
    const symbolTrimmed = newSymbolName.trim();
    if (symbols.includes(symbolTrimmed)) {
      alert("این نماد قبلاً وجود دارد");
      return;
    }
    const newSymbols = [...symbols, symbolTrimmed];
    saveSymbols(newSymbols);
    setNewSymbolName("");
    setShowAddSymbolModal(false);
  };

  const removeSymbol = (symbolToRemove) => {
    if (symbols.length <= 1) {
      alert("حداقل یک نماد باید وجود داشته باشد");
      return;
    }
    const newSymbols = symbols.filter(s => s !== symbolToRemove);
    saveSymbols(newSymbols);
    if (newTrade.symbol === symbolToRemove) {
      setNewTrade({...newTrade, symbol: newSymbols[0]});
    }
  };

  useEffect(() => {
    const loadCapital = async () => {
      try {
        const res = await fetch('/api/settings', {
          headers: getAuthHeaders()
        });
        const settings = await res.json();
        setCurrentCapital(settings.current_capital || 0);
        setInitialCapital(settings.initial_capital || 0);
      } catch (error) {
        console.error("Error loading capital:", error);
      }
    };
    loadData();
    loadCapital();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const tradesRes = await fetch('/api/trades', { headers });
      const tradesData = await tradesRes.json();
      setTrades(Array.isArray(tradesData) ? tradesData : []);
      
      const setupsRes = await fetch('/api/setups', { headers });
      const setupsData = await setupsRes.json();
      setSetups(Array.isArray(setupsData) ? setupsData : []);
    } catch (error) {
      console.error('Error loading data:', error);
      setTrades([]);
      setSetups([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateProfit = () => {
    const riskPercent = parseFloat(newTrade.risk) || 1;
    const rr = parseFloat(newTrade.rr) || 1;
    
    if (newTrade.tradeType === "TP") {
      return (riskPercent * rr).toFixed(2);
    } else if (newTrade.tradeType === "SL") {
      return (-riskPercent).toFixed(2);
    } else {
      return "0";
    }
  };

  useEffect(() => {
    const calculated = calculateProfit();
    setNewTrade(prev => ({ ...prev, profit: calculated }));
  }, [newTrade.risk, newTrade.rr, newTrade.tradeType]);

  const handleImageUpload = (files) => {
    const fileArray = Array.from(files);
    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewTrade(prev => ({
          ...prev,
          images: [...prev.images, reader.result]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (indexToRemove) => {
    setNewTrade(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  const getTradeImages = (trade) => {
    if (!trade) return [];
    try {
      if (trade.images) {
        if (typeof trade.images === 'string') {
          const parsed = JSON.parse(trade.images);
          return Array.isArray(parsed) ? parsed : [parsed];
        }
        if (Array.isArray(trade.images)) {
          return trade.images;
        }
        return [trade.images];
      }
    } catch (e) {
      console.error("Error parsing images:", e);
      return [];
    }
    return [];
  };

  const addTrade = async () => {
    if (!newTrade.symbol) {
      alert("Please select a symbol");
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const tradeDate = newTrade.date || today;
    
    const todayTrades = trades.filter(t => t.date === tradeDate);
    const lastTradeNumber = todayTrades.length > 0 
      ? Math.max(...todayTrades.map(t => t.tradeNumber || 0)) 
      : 0;
    
    const tradeToAdd = {
      symbol: newTrade.symbol,
      side: newTrade.side,
      risk: parseFloat(newTrade.risk) || 1,
      rr: parseFloat(newTrade.rr) || 1,
      trade_type: newTrade.tradeType,
      profit: parseFloat(newTrade.profit) || 0,
      setup_id: newTrade.setupId ? parseInt(newTrade.setupId) : null,
      image: newTrade.images[0] || null,
      images: JSON.stringify(newTrade.images),
      notes: newTrade.notes,
      trade_number: lastTradeNumber + 1,
      date: tradeDate,
      session: newTrade.session,
      rules_adhered: newTrade.rulesAdhered ? 1 : 0
    };
    
     try {
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(tradeToAdd)
      });
      
      if (res.ok) {
        await loadData();
        setShowAddModal(false);
        resetForm();
        if (onTradeUpdate) onTradeUpdate(false);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error adding trade');
    }
  };

   const deleteTrade = async (id) => {
    try {
      const res = await fetch(`/api/trades?id=${id}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        await loadData();
        setShowDetailModal(null);
        if (onTradeUpdate) onTradeUpdate(true);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting trade');
    }
  };

  const resetForm = () => {
    setNewTrade({
      symbol: symbols[0] || "Nasdaq",
      side: "Buy",
      risk: 1,
      rr: 1,
      tradeType: "TP",
      profit: "",
      setupId: "",
      images: [],
      notes: "",
      date: new Date().toISOString().split('T')[0],
      session: "London",
      rulesAdhered: false
    });
    setIsEditing(false);
    setEditingTrade(null);
  };

  const editTrade = async () => {
    if (!newTrade.symbol) {
      alert("Please select a symbol");
      return;
    }
    
    try {
      const res = await fetch(`/api/trades?id=${editingTrade.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          symbol: newTrade.symbol,
          side: newTrade.side,
          risk: parseFloat(newTrade.risk) || 1,
          rr: parseFloat(newTrade.rr) || 1,
          trade_type: newTrade.tradeType,
          profit: parseFloat(newTrade.profit) || 0,
          setup_id: newTrade.setupId ? parseInt(newTrade.setupId) : null,
          image: newTrade.images.length > 0 ? newTrade.images[0] : null,
          images: JSON.stringify(newTrade.images),
          notes: newTrade.notes,
          date: newTrade.date,
          session: newTrade.session,
          rules_adhered: newTrade.rulesAdhered ? 1 : 0
        })
      });
      
      if (res.ok) {
        await loadData();
        setShowAddModal(false);
        setShowDetailModal(null);
        setIsEditing(false);
        setEditingTrade(null);
        resetForm();
         if (onTradeUpdate) onTradeUpdate(false);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error editing trade');
    }
  };

  const startEdit = (trade) => {
    let images = [];
    try {
      if (trade.images) {
        if (typeof trade.images === 'string') {
          const parsed = JSON.parse(trade.images);
          images = Array.isArray(parsed) ? parsed : [parsed];
        } else if (Array.isArray(trade.images)) {
          images = trade.images;
        }
      }
      if (images.length === 0 && trade.image) {
        images = [trade.image];
      }
    } catch (e) {
      console.error("Error parsing images:", e);
      if (trade.image) images = [trade.image];
    }
    
    setEditingTrade(trade);
    setNewTrade({
      symbol: trade.symbol || symbols[0],
      side: trade.side || "Buy",
      risk: trade.risk || 1,
      rr: trade.rr || 1,
      tradeType: trade.trade_type || "TP",
      profit: trade.profit || "",
      setupId: trade.setup_id ? String(trade.setup_id) : "",
      images: images,
      notes: trade.notes || "",
      date: trade.date || new Date().toISOString().split('T')[0],
      session: trade.session || "London",
      rulesAdhered: trade.rules_adhered === 1
    });
    setShowDetailModal(null);
    setShowAddModal(true);
    setIsEditing(true);
  };

   // ایمن کردن groupedTrades در برابر trades غیر آرایه
  const groupedTrades = (Array.isArray(trades) ? trades : []).reduce((groups, trade) => {
    const date = trade.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(trade);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedTrades).sort((a, b) => new Date(b) - new Date(a));

  const getSortedTradesForDate = (date) => {
    return [...groupedTrades[date]].sort((a, b) => (a.trade_number || 0) - (b.trade_number || 0));
  };

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const availableYears = [...new Set(trades.map(t => t.date.split("-")[0]))].sort((a, b) => b - a);
  const yearsToShow = availableYears.length > 0 ? availableYears : [new Date().getFullYear()];

  const getMonthlyDataForYear = (year) => {
    const monthlyData = [];
    for (let month = 0; month < 12; month++) {
      const monthNumber = month + 1;
      const monthTrades = trades.filter(trade => {
        const [tradeYear, tradeMonth] = trade.date.split("-");
        return parseInt(tradeYear) === year && parseInt(tradeMonth) === monthNumber;
      });
      const totalProfit = monthTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
      const totalTrades = monthTrades.length;
      const winningTrades = monthTrades.filter(t => (t.profit || 0) > 0).length;
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
      monthlyData.push({
        month: month,
        monthName: monthNames[month],
        monthNumber: monthNumber,
        hasTrades: totalTrades > 0,
        totalProfit: totalProfit,
        totalTrades: totalTrades,
        winRate: winRate,
        trades: monthTrades
      });
    }
    return monthlyData;
  };

  const monthlyData = getMonthlyDataForYear(selectedYear);

  const totalProfit = trades.reduce((s, t) => s + (t.profit || 0), 0);
const totalProfitUsd = trades.reduce((s, t) => s + (t.profit_usd || 0), 0);
const totalProfitPercent = initialCapital > 0 
  ? Math.round((totalProfitUsd / initialCapital) * 100 * 10) / 10 
  : 0;
  const totalTrades = trades.length;
  const winningTrades = trades.filter(t => (t.profit || 0) > 0).length;
  const losingTrades = trades.filter(t => (t.profit || 0) < 0).length;
  const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : 0;
  const avgRisk = totalTrades > 0 ? (trades.reduce((sum, t) => sum + (t.risk || 0), 0) / totalTrades).toFixed(1) : 0;
  const avgRR = totalTrades > 0 ? (trades.reduce((sum, t) => sum + (t.rr || 0), 0) / totalTrades).toFixed(2) : 0;
  
  const stats = [
    { title: "Total PnL", value: `${totalProfitPercent >= 0 ? "+" : ""}${totalProfitPercent.toFixed(1)}%`, subValue: `${totalProfitUsd >= 0 ? "+" : ""}$${Math.abs(totalProfitUsd).toFixed(2)}`, color: totalProfitPercent >= 0 ? "text-emerald-400" : "text-rose-400", icon: "💰" },
    { title: "Total Trades", value: totalTrades, color: "text-white", icon: "📊" },
    { title: "Win/Loss", value: `${winningTrades}/${losingTrades}`, color: "text-white", icon: "⚖️" },
    { title: "Win Rate", value: `${winRate}%`, color: winRate >= 50 ? "text-emerald-400" : "text-rose-400", icon: "🎯" },
    { title: "Avg Risk", value: `${avgRisk}%`, color: "text-white", icon: "⚠️" },
    { title: "Avg R:R", value: `${avgRR}`, color: avgRR >= 1.5 ? "text-emerald-400" : avgRR >= 1 ? "text-amber-400" : "text-rose-400", icon: "📈" },
  ];

  const sides = ["Buy", "Sell"];
  const tradeTypes = [
    { value: "TP", label: "🎯 TP - Win", color: "text-emerald-400" },
    { value: "SL", label: "🛑 SL - Loss", color: "text-rose-400" },
    { value: "BE", label: "⚖️ BE - Break Even", color: "text-amber-400" }
  ];

  const formatDate = (dateStr) => {
    const [year, month, day] = dateStr.split("-");
    return `${month}/${day}/${year}`;
  };

  if (loading) {
    return (
      <div className="col-span-3 flex justify-center items-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading trades...</p>
        </div>
      </div>
    );
  }

  const renderDailyView = () => (
    <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2" style={{ direction: "rtl" }}>
      {sortedDates.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4 opacity-50">📭</div>
          <p className="text-gray-400">No trades recorded yet</p>
        </div>
      ) : (
        sortedDates.map((date) => {
          const dateTrades = getSortedTradesForDate(date);
          const totalProfitForDay = dateTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
          
          return (
            <div key={date} className="space-y-2">
              <div className="flex items-center justify-between sticky top-0 bg-zinc-900/95 backdrop-blur-sm py-2 z-10">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-emerald-400">📅 {formatDate(date)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    totalProfitForDay >= 0 
                      ? "bg-emerald-500/20 text-emerald-400 outline outline-1 outline-emerald-500/30" 
                      : "bg-rose-500/20 text-rose-400 outline outline-1 outline-rose-500/30"
                  }`}>
                    Day PnL: {totalProfitForDay >= 0 ? "+" : ""}{totalProfitForDay.toFixed(1)}%
                  </span>
                </div>
                <span className="text-xs text-gray-500">{dateTrades.length} trades</span>
              </div>
              
              <div className="space-y-2 pl-2 border-l-2 border-white/10">
                {dateTrades.map((trade, idx) => {
                  const relatedSetup = setups.find(s => s.id === trade.setup_id);
                  const tradeImages = getTradeImages(trade);
                  
                  return (
                    <div
                      key={trade.id}
                      onClick={() => setShowDetailModal(trade)}
                      className="bg-white/5 p-3 rounded-xl outline outline-1 outline-white/10 cursor-pointer transition-all duration-200 hover:outline-emerald-500/50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-300">#{trade.trade_number}</span>
                          </div>
                          
                          {tradeImages.length > 0 && (
                            <div className="flex -space-x-2">
                              {tradeImages.slice(0, 2).map((img, i) => (
                                <img key={i} src={img} alt="" className="w-8 h-8 rounded-lg object-cover border-2 border-zinc-900" />
                              ))}
                              {tradeImages.length > 2 && (
                                <div className="w-8 h-8 rounded-lg bg-zinc-700 flex items-center justify-center text-xs text-white border-2 border-zinc-900">
                                  +{tradeImages.length - 2}
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white">{trade.symbol}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                trade.side === "Buy" 
                                  ? "bg-emerald-500/20 text-emerald-400" 
                                  : "bg-rose-500/20 text-rose-400"
                              }`}>
                                {trade.side}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                trade.trade_type === "TP" 
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : trade.trade_type === "SL" 
                                    ? "bg-rose-500/20 text-rose-400"
                                    : "bg-amber-500/20 text-amber-400"
                              }`}>
                                {trade.trade_type === "TP" ? "🎯 TP" : trade.trade_type === "SL" ? "🛑 SL" : "⚖️ BE"}
                              </span>
                              {relatedSetup && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 outline outline-1 outline-purple-500/30">
                                  {relatedSetup.name}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Risk: {trade.risk}% | R:R: {trade.rr}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${(trade.profit || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {(trade.profit || 0) >= 0 ? "+" : ""}{trade.profit || 0}%
                          </div>
                          <div className={`text-xs ${(trade.profit_usd || 0) >= 0 ? "text-emerald-400/70" : "text-rose-400/70"}`}>
                            {(trade.profit_usd || 0) >= 0 ? "+" : ""}${(trade.profit_usd || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  const renderMonthlyView = () => (
    <div>
      {availableYears.length > 0 && (
        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          {yearsToShow.map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(parseInt(year))}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                selectedYear === parseInt(year) 
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25" 
                  : "bg-white/5 text-gray-400 hover:text-white outline outline-1 outline-white/10"
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      )}
      
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {monthlyData.map((month) => (
          <div
            key={month.month}
            onClick={() => {
              if (month.hasTrades) {
                setViewMode("daily");
              }
            }}
            className={`cursor-pointer rounded-xl p-3 text-center transition-all duration-200 ${
              month.hasTrades 
                ? "bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 outline outline-1 outline-emerald-500/30 hover:outline-emerald-500/50" 
                : "bg-white/5 outline outline-1 outline-white/10"
            }`}
          >
            <div className="text-2xl mb-1">
              {month.hasTrades ? "📊" : "📭"}
            </div>
            <div className="text-sm font-medium text-white">
              {month.monthName}
            </div>
            
            {month.hasTrades ? (
              <>
                <div className="mt-2 text-xs text-gray-400">
                  {month.totalTrades} trade{month.totalTrades !== 1 ? "s" : ""}
                </div>
                <div className={`text-sm font-bold ${month.totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {month.totalProfit >= 0 ? "+" : ""}{month.totalProfit.toFixed(1)}%
                </div>
                <div className="mt-2 w-full bg-white/10 rounded-full h-1 overflow-hidden">
                  <div 
                    className={`h-1 rounded-full ${month.winRate >= 50 ? "bg-emerald-500" : "bg-rose-500"}`}
                    style={{ width: `${month.winRate}%` }}
                  />
                </div>
              </>
            ) : (
              <div className="mt-2 text-xs text-gray-500">
                No trades
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="flex justify-center gap-6 mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-xs text-gray-400">Has trades</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-white/20" />
          <span className="text-xs text-gray-400">No trades</span>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-3">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-purple-500/10 border border-white/10 p-6 mb-6">
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 via-sky-400 to-purple-400 bg-clip-text text-transparent">
              📔 Trading Journal
            </h1>
            <p className="text-gray-400 text-sm mt-1">Track and analyze your trades</p>
          </div>
          <div className="flex gap-3">
            <div className="flex bg-white/5 rounded-xl p-1 outline outline-1 outline-white/10">
              <button
                onClick={() => setViewMode("daily")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === "daily" 
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                📅 Daily
              </button>
              <button
                onClick={() => setViewMode("monthly")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === "monthly" 
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                📊 Monthly
              </button>
            </div>
            
            <Button 
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/25"
            >
              + New Trade
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-6 gap-4 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-gradient-to-br from-white/5 to-transparent rounded-xl p-4 text-center outline outline-1 outline-white/10">
            <div className="text-3xl mb-2">{stat.icon}</div>
            <div className={`text-xl font-bold ${stat.color}`}>
              {stat.value}
              {stat.subValue && (
                <span className="text-sm font-normal text-gray-400 mr-2">
                  ({stat.subValue})
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">{stat.title}</div>
          </div>
        ))}
      </div>

      {/* Trades List */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl" />
        <CardContent className="p-6 relative z-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              {viewMode === "daily" ? "📋 Trade History" : "📊 Monthly Calendar"}
            </h2>
          </div>
          
          {viewMode === "daily" ? renderDailyView() : renderMonthlyView()}
        </CardContent>
      </Card>

      {/* Add Trade Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-lg max-h-[85vh] overflow-y-auto"
            >
              <Card className="relative overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/10 rounded-2xl">
                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl" />
                <CardContent className="p-6 relative z-10">
                  <h2 className="text-xl font-bold mb-4 text-center bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                    {isEditing ? "✏️ Edit Trade" : "➕ New Trade"}
                  </h2>
                  
                  <div className="space-y-4" style={{ direction: "rtl", textAlign: "right" }}>
                    {/* Symbol Selection */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">📊 Symbol</label>
                      <div className="flex gap-2">
                        <select 
                          className="flex-1 bg-zinc-800 p-3 rounded-xl text-white outline outline-1 outline-white/10 focus:outline-emerald-500/50 transition-all cursor-pointer"
                          style={{ backgroundColor: "#27272a", textAlign: "right" }}
                          value={newTrade.symbol}
                          onChange={(e) => setNewTrade({...newTrade, symbol: e.target.value})}
                        >
                          {symbols.map(s => (
                            <option key={s} value={s} className="bg-zinc-800 text-white">
                              {s}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setShowAddSymbolModal(true)}
                          className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all outline outline-1 outline-emerald-500/30"
                          title="Add new symbol"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">🟢 Buy / 🔴 Sell</label>
                      <div className="flex gap-2">
                        {sides.map(s => (
                          <button
                            key={s}
                            onClick={() => setNewTrade({...newTrade, side: s})}
                            className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-200 ${
                              newTrade.side === s 
                                ? s === "Buy" 
                                  ? "bg-emerald-500/20 text-emerald-400 outline outline-1 outline-emerald-500/50" 
                                  : "bg-rose-500/20 text-rose-400 outline outline-1 outline-rose-500/50"
                                : "bg-white/5 text-gray-400 outline outline-1 outline-white/10"
                            }`}
                          >
                            {s === "Buy" ? "🟢 Buy" : "🔴 Sell"}
                          </button>
                        ))}
                      </div>
                    </div>

                   <div className="grid grid-cols-2 gap-4">
  {/* ریسک */}
  <div>
    <label className="block text-sm text-gray-400 mb-1">⚠️ میزان ریسک</label>
    <div className="flex gap-2 mb-2">
      <button
        type="button"
        onClick={() => setRiskType("percent")}
        className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${riskType === "percent" ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg" : "bg-white/10 text-gray-400 hover:bg-white/20"}`}
      >
        📊 درصد (%)
      </button>
      <button
        type="button"
        onClick={() => setRiskType("dollar")}
        className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${riskType === "dollar" ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg" : "bg-white/10 text-gray-400 hover:bg-white/20"}`}
      >
        💵 دلار ($)
      </button>
    </div>
    
    {riskType === "percent" ? (
      <input 
        type="number" 
        step="0.5"
        className="w-full bg-zinc-800 p-3 rounded-xl text-white outline outline-1 outline-white/10 focus:outline-emerald-500/50 transition-all"
        value={newTrade.risk}
        onChange={(e) => {
          setNewTrade({...newTrade, risk: e.target.value});
          setRiskDollar("");
        }}
        placeholder="مثال: 1 (1% ریسک)"
      />
    ) : (
      <div className="flex gap-2">
        <input 
          type="number" 
          step="0.01"
          className="flex-1 bg-zinc-800 p-3 rounded-xl text-white outline outline-1 outline-white/10 focus:outline-emerald-500/50 transition-all"
          value={riskDollar}
          onChange={(e) => {
            const dollarValue = parseFloat(e.target.value) || 0;
            setRiskDollar(e.target.value);
            const percentValue = currentCapital > 0 ? (dollarValue / currentCapital) * 100 : 0;
            setNewTrade({...newTrade, risk: percentValue.toFixed(2)});
          }}
          placeholder={`مثال: 5 (ریسک به دلار)`}
        />
        {currentCapital > 0 && (
          <div className="bg-white/10 rounded-xl px-3 py-3 text-xs text-gray-400 flex items-center">
            ≈ {((parseFloat(riskDollar) || 0) / currentCapital * 100).toFixed(2)}%
          </div>
        )}
      </div>
    )}
    <p className="text-xs text-gray-500 mt-1">
      {riskType === "percent" 
        ? "درصد ریسک از کل سرمایه" 
        : `سرمایه فعلی: $${currentCapital.toFixed(2)}`}
    </p>
  </div>
  
  {/* R:R */}
  <div>
    <label className="block text-sm text-gray-400 mb-1">📊 R:R</label>
    <input 
      type="number" 
      step="0.5"
      className="w-full bg-zinc-800 p-3 rounded-xl text-white outline outline-1 outline-white/10 focus:outline-emerald-500/50 transition-all"
      value={newTrade.rr}
      onChange={(e) => setNewTrade({...newTrade, rr: e.target.value})}
    />
  </div>
</div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">🎯 Result</label>
                      <div className="flex gap-2">
                        {tradeTypes.map((type) => (
                          <button
                            key={type.value}
                            onClick={() => setNewTrade({...newTrade, tradeType: type.value})}
                            className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-200 ${
                              newTrade.tradeType === type.value 
                                ? type.value === "TP" 
                                  ? "bg-emerald-500/20 text-emerald-400 outline outline-1 outline-emerald-500/50"
                                  : type.value === "SL" 
                                    ? "bg-rose-500/20 text-rose-400 outline outline-1 outline-rose-500/50"
                                    : "bg-amber-500/20 text-amber-400 outline outline-1 outline-amber-500/50"
                                : "bg-white/5 text-gray-400 outline outline-1 outline-white/10"
                            }`}
                          >
                            {type.label.split(" ")[0]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">📸 Setup</label>
                      <select 
                        className="w-full bg-zinc-800 p-3 rounded-xl text-white outline outline-1 outline-white/10 focus:outline-emerald-500/50 transition-all cursor-pointer"
                        style={{ backgroundColor: "#27272a", textAlign: "right" }}
                        value={newTrade.setupId}
                        onChange={(e) => setNewTrade({...newTrade, setupId: e.target.value})}
                      >
                        <option value="" className="bg-zinc-800 text-white">No setup</option>
                        {setups.map(setup => (
                          <option key={setup.id} value={setup.id} className="bg-zinc-800 text-white">
                            {setup.name} (R:R {setup.rr})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Multiple Images Upload */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">📸 Screenshots (multiple)</label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple
                        onChange={(e) => handleImageUpload(e.target.files)}
                        className="w-full bg-zinc-800 p-2 rounded-xl text-white file:bg-emerald-500 file:text-white file:border-0 file:px-3 file:py-1 file:rounded-lg cursor-pointer outline outline-1 outline-white/10"
                      />
                      {newTrade.images.length > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {newTrade.images.map((img, idx) => (
                            <div key={idx} className="relative">
                              <img src={img} alt={`preview-${idx}`} className="h-16 w-16 rounded-lg object-cover" />
                              <button
                                onClick={() => removeImage(idx)}
                                className="absolute -top-1 -right-1 bg-rose-500 rounded-full w-5 h-5 flex items-center justify-center text-white text-xs"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">📅 Date</label>
                      <input
                        type="date"
                        className="w-full bg-zinc-800 p-3 rounded-xl text-white outline outline-1 outline-white/10 focus:outline-emerald-500/50 transition-all"
                        style={{ backgroundColor: "#27272a", textAlign: "right" }}
                        value={newTrade.date}
                        onChange={(e) => setNewTrade({...newTrade, date: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">🕒 Session</label>
                      <select
                        className="w-full bg-zinc-800 p-3 rounded-xl text-white outline outline-1 outline-white/10 focus:outline-emerald-500/50 transition-all cursor-pointer"
                        style={{ backgroundColor: "#27272a", textAlign: "right" }}
                        value={newTrade.session}
                        onChange={(e) => setNewTrade({...newTrade, session: e.target.value})}
                      >
                        {sessionOptions.map(opt => (
                          <option key={opt} value={opt} className="bg-zinc-800 text-white">
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">📝 Notes</label>
                      <textarea 
                        rows="3"
                        className="w-full bg-zinc-800 p-3 rounded-xl text-white outline outline-1 outline-white/10 focus:outline-emerald-500/50 transition-all"
                        style={{ backgroundColor: "#27272a", textAlign: "right" }}
                        placeholder="Write your trade notes here..."
                        value={newTrade.notes}
                        onChange={(e) => setNewTrade({...newTrade, notes: e.target.value})}
                      />
                    </div>

                    {/* نمایش Calculated PnL با دلار */}
<div className="bg-white/5 p-4 rounded-xl text-center outline outline-1 outline-white/10">
  <label className="block text-sm text-gray-400 mb-1">💰 محاسبه PnL</label>
  <div className={`text-3xl font-bold ${parseFloat(newTrade.profit) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
    {parseFloat(newTrade.profit) >= 0 ? "+" : ""}{newTrade.profit}%
  </div>
  
  {/* ✅ اصلاح شده - به جای showDetailModal از currentCapital استفاده کن */}
  <div className="text-sm text-gray-400 mt-1">
    ≈ دلار: {((parseFloat(newTrade.profit) / 100) * currentCapital).toFixed(2)} USD
    <span className="text-[10px] text-gray-500 mr-2">(تخمین)</span>
  </div>
  
  <div className="text-xs text-gray-500 mt-2">
    {newTrade.tradeType === "TP" 
      ? `${newTrade.risk}% × ${newTrade.rr} = ${newTrade.profit}% سود`
      : newTrade.tradeType === "SL" 
        ? `ریسک ثابت: -${newTrade.risk}% ضرر`
        : `بدون سود/ضرر`}
  </div>
</div>
</div>

                  <div className="flex gap-3 mt-6">
                    <Button onClick={() => {
                      setShowAddModal(false);
                      setIsEditing(false);
                      setEditingTrade(null);
                      resetForm();
                    }} className="bg-white/5 hover:bg-white/10 flex-1 rounded-xl text-gray-300 outline outline-1 outline-white/10">
                      Cancel
                    </Button>
                    <Button 
                      onClick={isEditing ? editTrade : addTrade} 
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white flex-1 rounded-xl font-semibold shadow-lg shadow-emerald-500/25"
                    >
                      {isEditing ? "💾 Save Changes" : "Save Trade"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Symbol Modal */}
      <AnimatePresence>
        {showAddSymbolModal && (
          <motion.div 
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md"
            >
              <Card className="relative overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/10 rounded-2xl">
                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl" />
                <CardContent className="p-6 relative z-10">
                  <h2 className="text-xl font-bold mb-4 text-center bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                    ➕ Add New Symbol
                  </h2>
                  
                  <div className="space-y-4" style={{ direction: "rtl", textAlign: "right" }}>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Symbol Name</label>
                      <input 
                        type="text"
                        placeholder="Example: BTC/USD"
                        className="w-full bg-zinc-800 p-3 rounded-xl text-white outline outline-1 outline-white/10 focus:outline-emerald-500/50 transition-all text-right"
                        style={{ backgroundColor: "#27272a" }}
                        value={newSymbolName}
                        onChange={(e) => setNewSymbolName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addNewSymbol()}
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Existing Symbols</label>
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-white/5 rounded-xl">
                        {symbols.map(sym => (
                          <div key={sym} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 text-white text-sm">
                            {sym}
                            <button
                              onClick={() => removeSymbol(sym)}
                              className="text-rose-400 hover:text-rose-300 ml-1 text-xs"
                              title="Remove symbol"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button onClick={() => setShowAddSymbolModal(false)} className="bg-white/5 hover:bg-white/10 flex-1 rounded-xl text-gray-300 outline outline-1 outline-white/10">
                      Cancel
                    </Button>
                    <Button onClick={addNewSymbol} className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white flex-1 rounded-xl font-semibold shadow-lg shadow-emerald-500/25">
                      Add Symbol
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trade Detail Modal */}
      <AnimatePresence>
        {showDetailModal && (
          <motion.div 
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDetailModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-lg max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="relative overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/10 rounded-2xl">
                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl" />
                <CardContent className="p-6 relative z-10" style={{ direction: "rtl", textAlign: "right" }}>
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                      Trade Details
                    </h2>
                    <button onClick={() => setShowDetailModal(null)} className="text-gray-400 hover:text-white text-xl">✕</button>
                  </div>

                  {/* Images Display */}
                  {(() => {
                    const images = getTradeImages(showDetailModal);
                    if (images && images.length > 0) {
                      return (
                        <div className="mb-4">
                          <label className="block text-sm text-gray-400 mb-2">📸 Images ({images.length}):</label>
                          <div className="flex gap-2 overflow-x-auto pb-2 flex-wrap">
                            {images.map((img, idx) => (
                              <img 
                                key={idx}
                                src={img} 
                                alt={`screenshot-${idx}`} 
                                className="w-24 h-24 rounded-xl object-cover cursor-pointer hover:opacity-90 border border-white/20"
                                onClick={() => {
                                  setSelectedImage(img);
                                  setShowImageModal(true);
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Trade Info */}
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-white/5 rounded-xl outline outline-1 outline-white/10">
                      <span className="text-gray-400">Trade #:</span>
                      <span className="font-bold text-white">{showDetailModal.trade_number}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-white/5 rounded-xl outline outline-1 outline-white/10">
                      <span className="text-gray-400">Symbol:</span>
                      <span className="font-bold text-white">{showDetailModal.symbol}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-white/5 rounded-xl outline outline-1 outline-white/10">
                      <span className="text-gray-400">Side:</span>
                      <span className={`font-bold ${showDetailModal.side === "Buy" ? "text-emerald-400" : "text-rose-400"}`}>
                        {showDetailModal.side === "Buy" ? "🟢 Buy" : "🔴 Sell"}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 bg-white/5 rounded-xl outline outline-1 outline-white/10">
                      <span className="text-gray-400">Result:</span>
                      <span className={`font-bold ${showDetailModal.trade_type === "TP" ? "text-emerald-400" : showDetailModal.trade_type === "SL" ? "text-rose-400" : "text-amber-400"}`}>
                        {showDetailModal.trade_type === "TP" ? "🎯 Win (TP)" : showDetailModal.trade_type === "SL" ? "🛑 Loss (SL)" : "⚖️ Break Even"}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 bg-white/5 rounded-xl outline outline-1 outline-white/10">
                      <span className="text-gray-400">Risk:</span>
                      <span className="text-white">{showDetailModal.risk}%</span>
                    </div>
                    <div className="flex justify-between p-3 bg-white/5 rounded-xl outline outline-1 outline-white/10">
                      <span className="text-gray-400">R:R Ratio:</span>
                      <span className="text-white">{showDetailModal.rr}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-white/5 rounded-xl outline outline-1 outline-white/10">
                      <span className="text-gray-400">PnL:</span>
                      <span className={`font-bold ${(showDetailModal.profit || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {(showDetailModal.profit || 0) >= 0 ? "+" : ""}{showDetailModal.profit || 0}%
                      </span>
                    </div>
                    {showDetailModal.setup_id && (
                      <div className="flex justify-between p-3 bg-white/5 rounded-xl outline outline-1 outline-white/10">
                        <span className="text-gray-400">Setup:</span>
                        <span className="text-purple-400">
                          {setups.find(s => s.id === showDetailModal.setup_id)?.name || "-"}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between p-3 bg-white/5 rounded-xl outline outline-1 outline-white/10">
                      <span className="text-gray-400">Date:</span>
                      <span className="text-white">{formatDate(showDetailModal.date)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-white/5 rounded-xl outline outline-1 outline-white/10">
                      <span className="text-gray-400">Session:</span>
                      <span className="text-white">{showDetailModal.session || "Unknown"}</span>
                    </div>
                    {showDetailModal.notes && (
                      <div className="p-3 bg-white/5 rounded-xl outline outline-1 outline-white/10">
                        <p className="text-gray-400 mb-1">Notes:</p>
                        <p className="text-white">{showDetailModal.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button onClick={() => setShowDetailModal(null)} className="bg-white/5 hover:bg-white/10 flex-1 rounded-xl text-gray-300 outline outline-1 outline-white/10">Close</Button>
                    <Button onClick={() => startEdit(showDetailModal)} className="bg-gradient-to-r from-sky-500 to-sky-600 text-white flex-1 rounded-xl shadow-lg shadow-sky-500/25">✏️ Edit</Button>
                    <Button onClick={() => deleteTrade(showDetailModal.id)} className="bg-gradient-to-r from-rose-500 to-rose-600 text-white flex-1 rounded-xl shadow-lg shadow-rose-500/25">🗑️ Delete</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Modal */}
      <AnimatePresence>
        {showImageModal && selectedImage && (
          <motion.div 
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowImageModal(false);
              setSelectedImage("");
            }}
          >
            <div className="relative max-w-4xl max-h-[90vh]">
              <img src={selectedImage} alt="large" className="max-w-full max-h-[90vh] rounded-2xl object-contain" />
              <button 
                onClick={() => {
                  setShowImageModal(false);
                  setSelectedImage("");
                }}
                className="absolute -top-4 -right-4 bg-rose-600 text-white w-10 h-10 rounded-full text-xl hover:bg-rose-700 transition-all shadow-lg"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}