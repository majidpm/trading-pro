"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MeditationModal({ onComplete, onClose, duration = 300 }) {
  const [step, setStep] = useState("meditation");
  const [timer, setTimer] = useState(duration);
  const [isActive, setIsActive] = useState(true);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    let interval;
    if (isActive && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0 && step === "meditation") {
      setIsActive(false);
      setStep("questions");
    }
    return () => clearInterval(interval);
  }, [isActive, timer, step]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

 const questions = [
  {
    id: "mental",
    title: "🧠 وضعیت ذهنی شما بعد از مدیتیشن",
    options: [
      { value: 10, label: "بسیار متمرکز و آروم", emoji: "😌✨" },
      { value: 7, label: "حالم بهتر شده", emoji: "🙂" },
      { value: 5, label: "تغییری نکرده", emoji: "😐" },
      { value: 3, label: "بی‌تمرکزتر شدم", emoji: "😫" }
    ]
  },
  {
    id: "stress",
    title: "⚡ سطح استرس شما بعد از مدیتیشن",
    options: [
      { value: 1, label: "کاملاً آروم و بدون استرس", emoji: "😌✨" },
      { value: 4, label: "استرس کم شده", emoji: "😊" },
      { value: 7, label: "تغییری نکرده", emoji: "😐" },
      { value: 10, label: "استرس بیشتر شده", emoji: "😫💨" }
    ]
  }
];

  const handleAnswer = (questionId, value) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    if (Object.keys(newAnswers).length === questions.length) {
      let mentalScore = newAnswers.mental || 5;
      let stressScore = newAnswers.stress || 5;
      
      // محاسبه امتیاز اولیه
      let totalScore = Math.round((mentalScore + (11 - stressScore)) / 2);
      totalScore = Math.min(10, Math.max(1, totalScore));
      
      // ✅ حذف تأثیر منفی: اگر امتیاز کمتر از 5 شود، آن را 5 (خنثی) قرار بده
      let impact = "neutral";
      if (totalScore >= 7) {
        impact = "positive";
      } else {
        // هر چیزی زیر 7 (شامل 5 و 6 و کمتر) -> خنثی
        totalScore = 5;
        impact = "neutral";
      }
      
      onComplete({
        success: true,
        score: totalScore,
        impact: impact,
        mental: mentalScore,
        stress: stressScore
      });
    }
  };

  if (step === "meditation") {
    return (
      <motion.div 
        className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
          className="text-center"
        >
          <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 p-10 w-[450px] text-center border border-emerald-500/30 shadow-2xl">
            <motion.div 
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }} 
              transition={{ duration: 3, repeat: Infinity }} 
              className="text-8xl mb-6"
            >
              🧘
            </motion.div>
            <h2 className="text-2xl font-bold mb-3 text-white">مدیتیشن و تنفس عمیق</h2>
            <p className="text-gray-400 mb-4">چشمات رو ببند و روی نفست تمرکز کن</p>
            <motion.div 
              className="text-7xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-500 bg-clip-text text-transparent mb-6" 
              animate={{ scale: [1, 1.1, 1] }} 
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              {formatTime(timer)}
            </motion.div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <motion.div 
                className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${((duration - timer) / duration) * 100}%` }}
              />
            </div>
            <Button
              onClick={() => {
                setIsActive(false);
                setStep("questions");
              }}
              className="mt-6 bg-white/10 hover:bg-white/20 text-white"
            >
              رد شدن از مدیتیشن ⏩
            </Button>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  const currentQuestion = questions[Object.keys(answers).length];
  if (!currentQuestion) return null;

  return (
    <motion.div 
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="w-full max-w-md"
      >
        <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/10 rounded-2xl">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">{currentQuestion.title}</h3>
            <div className="space-y-3">
              {currentQuestion.options.map((opt, idx) => (
                <Button
                  key={idx}
                  onClick={() => handleAnswer(currentQuestion.id, opt.value)}
                  className="w-full justify-start gap-3 bg-white/5 hover:bg-emerald-600/30 text-white py-4 h-auto rounded-xl"
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="flex-1 text-right">{opt.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}