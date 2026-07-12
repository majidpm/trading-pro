"use client";
import { useEffect, useRef } from "react";

export default function ReadinessGauge({ score, size = 150 }) {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    const width = size;
    const height = size / 1.5;
    canvas.width = width;
    canvas.height = height;
    
    ctx.clearRect(0, 0, width, height);
    
    const centerX = width / 2;
    const centerY = height - 15;
    const radius = width / 2 - 20;
    const startAngle = -180 * Math.PI / 180;
    const endAngle = 0 * Math.PI / 180;
    
    const getMainColor = () => {
      if (score < 40) return { start: "#dc2626", end: "#ef4444", glow: "rgba(220,38,38,0.3)" };
      if (score < 70) return { start: "#d97706", end: "#f59e0b", glow: "rgba(217,119,6,0.3)" };
      return { start: "#059669", end: "#10b981", glow: "rgba(5,150,105,0.3)" };
    };
    
    const colors = getMainColor();
    
    ctx.shadowBlur = 0;
    
    // نیم‌دایره پس‌زمینه
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 12;
    ctx.stroke();
    
    // نیم‌دایره پیشرفت
    const progressAngle = startAngle + ((score / 100) * 180 * Math.PI / 180);
    
    const gradient = ctx.createLinearGradient(centerX - radius, centerY, centerX + radius, centerY);
    gradient.addColorStop(0, colors.start);
    gradient.addColorStop(1, colors.end);
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, progressAngle);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 12;
    ctx.stroke();
    
    // افکت درخشش
    ctx.shadowBlur = 8;
    ctx.shadowColor = colors.glow;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, progressAngle);
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // عقربه
    const needleAngle = startAngle + ((score / 100) * 180 * Math.PI / 180);
    const needleLength = radius - 10;
    const needleX = centerX + Math.cos(needleAngle) * needleLength;
    const needleY = centerY + Math.sin(needleAngle) * needleLength;
    
    ctx.shadowBlur = 4;
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(needleX, needleY);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    
    // نقطه وسط عقربه
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
    ctx.fillStyle = "#18181b";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "#27272a";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 2.5, 0, 2 * Math.PI);
    ctx.fillStyle = colors.start;
    ctx.fill();
    
    ctx.shadowBlur = 0;
    
    // خطوط راهنما
    for (let i = 0; i <= 4; i++) {
      const angle = startAngle + (i * 45 * Math.PI / 180);
      const x1 = centerX + Math.cos(angle) * (radius - 5);
      const y1 = centerY + Math.sin(angle) * (radius - 5);
      const x2 = centerX + Math.cos(angle) * (radius + 3);
      const y2 = centerY + Math.sin(angle) * (radius + 3);
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    

    
    // عدد وسط حذف شد
    
  }, [score, size]);
  
  return (
    <div className="flex flex-col items-center">
      <canvas ref={canvasRef} width={size} height={size / 1.5} style={{ width: size, height: size / 1.5 }} />
      {/* عدد زیر گیج */}
      <div className="mt-2 text-center">
        <span className="text-xl font-bold" style={{ color: score < 40 ? "#ef4444" : score < 70 ? "#f59e0b" : "#10b981" }}>
          {Math.round(score)}
        </span>
        <span className="text-xs text-gray-500 mr-1">از 100</span>
      </div>
    </div>
  );
}