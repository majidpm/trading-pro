"use client";
import { useEffect, useRef } from "react";

export default function SimpleChart({ data }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!data || data.length < 2) {
      console.log("Not enough data points:", data?.length);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    const container = canvas.parentElement;
    const w = container?.clientWidth || 700;
    const h = 300;
    
    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);
    
    // پیدا کردن min و max برای مقیاس
    const allValues = [...data.map(d => d.totalProfit), ...data.map(d => d.cumulativeProfit)];
    const maxVal = Math.max(...allValues, 5);
    const minVal = Math.min(...allValues, -5);
    const range = maxVal - minVal;
    
    const padding = { left: 55, right: 20, top: 20, bottom: 35 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;
    const stepX = chartW / (data.length - 1);
    
    // تابع تبدیل مقدار به Y
    const getY = (value) => padding.top + chartH - ((value - minVal) / range) * chartH;
    
    // پس زمینه
    ctx.fillStyle = "#0f0f12";
    ctx.fillRect(0, 0, w, h);
    
    // خطوط افقی راهنما
    ctx.strokeStyle = "#3f3f46";
    ctx.lineWidth = 0.5;
    ctx.fillStyle = "#a1a1aa";
    ctx.font = "11px monospace";
    ctx.textAlign = "right";
    
    for (let i = 0; i <= 4; i++) {
      const val = minVal + (range * i / 4);
      const y = getY(val);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartW, y);
      ctx.stroke();
      ctx.fillText(`${val > 0 ? "+" : ""}${val.toFixed(1)}%`, padding.left - 8, y + 3);
    }
    
    // خط صفر
    const zeroY = getY(0);
    ctx.beginPath();
    ctx.moveTo(padding.left, zeroY);
    ctx.lineTo(padding.left + chartW, zeroY);
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // ========== خط سود روزانه (سبز) ==========
    ctx.beginPath();
    ctx.moveTo(padding.left, getY(data[0].totalProfit));
    for (let i = 1; i < data.length; i++) {
      ctx.lineTo(padding.left + i * stepX, getY(data[i].totalProfit));
    }
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    
    // نقاط سود روزانه
    for (let i = 0; i < data.length; i++) {
      const x = padding.left + i * stepX;
      const y = getY(data[i].totalProfit);
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = data[i].totalProfit >= 0 ? "#22c55e" : "#ef4444";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, 2 * Math.PI);
      ctx.fillStyle = "white";
      ctx.fill();
      
      ctx.font = "bold 9px monospace";
      ctx.fillStyle = data[i].totalProfit >= 0 ? "#4ade80" : "#f87171";
      ctx.fillText(`${data[i].totalProfit > 0 ? "+" : ""}${data[i].totalProfit.toFixed(1)}%`, x - 15, y - 8);
    }
    
    // ========== خط سود تجمعی (آبی) ==========
    ctx.beginPath();
    ctx.moveTo(padding.left, getY(data[0].cumulativeProfit));
    for (let i = 1; i < data.length; i++) {
      ctx.lineTo(padding.left + i * stepX, getY(data[i].cumulativeProfit));
    }
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // نقاط سود تجمعی
    for (let i = 0; i < data.length; i++) {
      const x = padding.left + i * stepX;
      const y = getY(data[i].cumulativeProfit);
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = "#3b82f6";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, 2 * Math.PI);
      ctx.fillStyle = "white";
      ctx.fill();
    }
    
    // تاریخ‌ها
    ctx.font = "10px monospace";
    ctx.fillStyle = "#71717a";
    ctx.textAlign = "center";
    for (let i = 0; i < data.length; i++) {
      const x = padding.left + i * stepX;
      if (data.length <= 7 || i % Math.ceil(data.length / 6) === 0 || i === data.length - 1) {
        const parts = data[i].date.split("-");
        ctx.fillText(`${parts[1]}/${parts[2]}`, x, padding.top + chartH + 18);
      }
    }
    
    // عنوان محور Y
    ctx.save();
    ctx.translate(18, padding.top + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = "10px monospace";
    ctx.fillStyle = "#71717a";
    ctx.textAlign = "center";
    ctx.fillText("Profit/Loss (%)", 0, 0);
    ctx.restore();
    
  }, [data]);

  if (!data || data.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-6xl mb-4 opacity-50">📊</div>
        <p className="text-gray-500">Not enough data</p>
        <p className="text-xs text-gray-600 mt-1">Add at least 2 trades to see the chart</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[300px]">
      <canvas ref={canvasRef} style={{ width: "100%", height: "auto", minHeight: "300px" }} />
    </div>
  );
}