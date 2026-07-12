// components/ConfirmDialog.js
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = "بله", cancelText = "نه" }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-md"
        >
          <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl border border-white/10 shadow-2xl">
            {/* دایره‌های blur در پس‌زمینه */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />
            
            <div className="relative z-10">
              {/* هدر */}
              <div className="bg-gradient-to-r from-rose-500/10 to-amber-500/10 px-5 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-semibold text-rose-400">⚠️ تأیید عملیات</span>
                </div>
              </div>
              
              {/* محتوا */}
              <div className="p-5 text-center" style={{ direction: "rtl", textAlign: "right" }}>
                <div className="text-5xl mb-3">🗑️</div>
                <h3 className="text-lg font-bold text-white mb-2">{title || "آیا مطمئنی؟"}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {message || "این عمل غیرقابل بازگشت است. تمام داده‌های امروز پاک می‌شوند."}
                </p>
              </div>
              
              {/* دکمه‌ها */}
              <div className="flex gap-3 p-5 pt-0">
                <button
                  onClick={onClose}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl py-2.5 text-sm font-medium transition-all duration-200 outline outline-1 outline-white/10"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl py-2.5 text-sm font-medium shadow-lg shadow-rose-500/25 transition-all duration-200 hover:scale-[1.02]"
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}