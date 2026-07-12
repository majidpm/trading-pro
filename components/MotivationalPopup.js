"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";

export default function MotivationalPopup({ message, onClose, duration = 8000 }) {
  const hasPlayedRef = useRef(false);
  const audioContextRef = useRef(null);
  const isClosingRef = useRef(false);
  const timerRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    hasPlayedRef.current = false;
  }, [message]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!hasPlayedRef.current) {
      hasPlayedRef.current = true;
      
      const playBeep = async () => {
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          const audioCtx = new AudioContext();
          audioContextRef.current = audioCtx;
          
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          
          const isWarning = message?.isWarning === true;
          oscillator.frequency.value = isWarning ? 660 : 880;
          gainNode.gain.value = 0.15;
          
          oscillator.start();
          gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.4);
          oscillator.stop(audioCtx.currentTime + 0.4);
          
          setTimeout(() => {
            if (audioContextRef.current && !isClosingRef.current) {
              isClosingRef.current = true;
              audioContextRef.current.close().catch(err => console.warn(err));
            }
          }, 500);
          
          if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
          }
        } catch (err) {
          console.warn("Web Audio failed:", err);
        }
      };
      
      playBeep();
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (onCloseRef.current) onCloseRef.current();
    }, duration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [duration, message]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (audioContextRef.current && !isClosingRef.current) {
        isClosingRef.current = true;
        audioContextRef.current.close().catch(err => console.warn(err));
      }
    };
  }, []);

  if (!message) return null;

  const isWarning = message.isWarning === true;

  // ========== حالت عادی (سبز) ==========
  if (!isWarning) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, x: 100, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, y: 50, scale: 0.8 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed bottom-6 right-6 z-50 max-w-sm w-full"
        >
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-emerald-500/30 rounded-2xl shadow-2xl shadow-emerald-500/20 overflow-hidden backdrop-blur-md">
            <div className="bg-gradient-to-r from-emerald-600/20 to-green-600/20 px-4 py-2.5 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-400">🎯 یادآور هدف</span>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-white text-sm transition-all">✕</button>
            </div>
            <div className="p-4" style={{ direction: "rtl", textAlign: "right" }}>
              <div className="flex items-start gap-3">
                <div className="text-3xl">{message.icon || "🎯"}</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white mb-1">{message.title || "هدف امروز:"}</p>
                  <p className="text-base font-semibold text-emerald-400 mb-2 leading-relaxed">{message.goal}</p>
                  <div className="border-t border-white/10 pt-2 mt-1">
                    <p className="text-xs text-gray-300 leading-relaxed">💪 {message.motivation}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-1 bg-white/10 w-full">
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: duration / 1000, ease: "linear" }}
                className="h-full bg-emerald-500 rounded-full"
              />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ========== حالت هشدار (قرمز) با هدر قرمز پررنگ ==========
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 100, y: 50, scale: 0.8 }}
        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
        exit={{ opacity: 0, x: 100, y: 50, scale: 0.8 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="fixed bottom-6 right-6 z-50 max-w-sm w-full"
      >
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-red-500/70 rounded-2xl shadow-2xl shadow-red-500/30 overflow-hidden backdrop-blur-md">
          {/* هدر قرمز پررنگ */}
          <div className="bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2.5 flex items-center justify-between border-b border-white/20">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse" />
              <span className="text-xs font-bold text-white">🚨 هشدار مدیریت سرمایه</span>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white text-sm transition-all">✕</button>
          </div>
          
          <div className="p-4" style={{ direction: "rtl", textAlign: "right" }}>
            <div className="flex items-start gap-3">
              <div className="text-3xl">🛑</div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white mb-1">{message.title || "هشدار!"}</p>
                <p className="text-base font-semibold text-red-400 mb-2 leading-relaxed">{message.goal}</p>
                <div className="border-t border-white/10 pt-2 mt-1">
                  <p className="text-xs text-gray-300 leading-relaxed">💪 {message.motivation}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="h-1 bg-white/10 w-full">
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: duration / 1000, ease: "linear" }}
              className="h-full bg-red-500 rounded-full"
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}