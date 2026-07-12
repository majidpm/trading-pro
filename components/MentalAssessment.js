"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";

export default function MentalAssessment({ onComplete, onClose }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  // 5 سوال
  const questions = [
    {
      id: "sleep",
      title: "😴 کیفیت خواب",
      text: "دیشب چند ساعت خوابیدی؟",
      icon: "🌙",
      options: [
        { value: 1, label: "کمتر از 5 ساعت", score: 1, emoji: "😫" },
        { value: 4, label: "5 تا 6 ساعت", score: 4, emoji: "😐" },
        { value: 7, label: "6 تا 7 ساعت", score: 7, emoji: "🙂" },
        { value: 10, label: "بیشتر از 7 ساعت", score: 10, emoji: "😴✨" }  // ✅ اصلاح: score=10
      ]
    },
    {
      id: "stress",
      title: "⚡ سطح استرس",
      text: "الان چه احساسی داری؟",
      icon: "🌊",
      options: [
        { value: 10, label: "خیلی استرس دارم، قلبم تند میزنه", score: 10, emoji: "😫💨" },
        { value: 7, label: "یه کم استرس دارم", score: 7, emoji: "😟" },
        { value: 4, label: "نسبتاً آرومم", score: 4, emoji: "🙂" },
        { value: 1, label: "کاملاً آروم و متمرکز", score: 1, emoji: "🧘✨" }  // ✅ اصلاح: score=1
      ]
    },
    {
      id: "mental",
      title: "🧠 آمادگی ذهنی",
      text: "چقدر برای ترید امروز آماده‌ای؟",
      icon: "🎯",
      options: [
        { value: 1, label: "اصلاً حوصله ندارم، خسته‌ام", score: 1, emoji: "😴💤" },
        { value: 4, label: "کمی بی‌حوصله‌ام", score: 4, emoji: "😕" },
        { value: 7, label: "حالم خوبه، میتونم ترید کنم", score: 7, emoji: "😊" },
        { value: 10, label: "پر انرژی‌ام، آماده‌ام!", score: 10, emoji: "🚀⚡" }  // ✅ اصلاح: score=10
      ]
    },
    {
      id: "focus",
      title: "🎯 میزان تمرکز",
      text: "چقدر میتونی امروز روی بازار تمرکز کنی؟",
      icon: "👁️",
      options: [
        { value: 1, label: "حواسم پرت چیزهای دیگه‌ست", score: 1, emoji: "📱👀" },
        { value: 4, label: "نسبتاً میتونم تمرکز کنم", score: 4, emoji: "🤔" },
        { value: 7, label: "خوب میتونم تمرکز کنم", score: 7, emoji: "🎯" },
        { value: 10, label: "صددرصد متمرکزم", score: 10, emoji: "🧠💎" }  // ✅ اصلاح: score=10
      ]
    },
    {
      id: "emotion",
      title: "❤️ وضعیت احساسی",
      text: "بعد از آخرین تریدت چه حسی داری؟",
      icon: "💭",
      options: [
        { value: 1, label: "عصبانی یا ناامیدم (میخوام ضرر رو جبران کنم)", score: 1, emoji: "😤💢" },
        { value: 4, label: "کمی ناراحتم", score: 4, emoji: "😔" },
        { value: 7, label: "حالم عادی و خنثیه", score: 7, emoji: "😐" },
        { value: 10, label: "خوشحالم و با اعتمادبه‌نفس", score: 10, emoji: "😎✨" }  // ✅ اصلاح: score=10
      ]
    }
  ];

  const currentQuestion = questions[step];
  const totalQuestions = questions.length;

  const handleAnswer = (questionId, value, score) => {
    const newAnswers = { ...answers, [questionId]: score };
    setAnswers(newAnswers);
    
    if (step + 1 < totalQuestions) {
      setStep(step + 1);
    } else {
      const sleepScore = newAnswers.sleep || 2;
      const stressScore = newAnswers.stress || 9;
      const mentalScore = newAnswers.mental || 2;
      const focusScore = newAnswers.focus || 2;
      const emotionScore = newAnswers.emotion || 2;
      
      const mentalAvg = Math.round((mentalScore + focusScore + emotionScore) / 3);
      const stressForDisplay = stressScore;
      const sleepForDisplay = sleepScore;
      
      onComplete({
  sleep: sleepForDisplay,
  stress: stressForDisplay,
  mental: mentalAvg,
  focus: focusScore,
  emotion: emotionScore
});
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-lg"
        >
          <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-700 shadow-2xl rounded-2xl overflow-hidden">
            
            {/* هدر با گرادیان */}
            <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 px-6 py-4 border-b border-green-500/20">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{currentQuestion.icon}</span>
                  <span className="text-green-400 font-semibold text-sm">{currentQuestion.title}</span>
                </div>
                <button 
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors text-xl"
                >
                  ✕
                </button>
              </div>
            </div>

            <CardContent className="p-6">
              {/* Progress Bar با انیمیشن */}
              <div className="mb-6">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-400">پیشرفت ارزیابی</span>
                  <span className="text-green-400 font-mono">
                    {step + 1}/{totalQuestions}
                  </span>
                </div>
                <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((step + 1) / totalQuestions) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* سوال با انیمیشن */}
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold mb-6 text-center text-white">
                  {currentQuestion.text}
                </h2>

                {/* گزینه‌ها */}
                <div className="space-y-3">
                  {currentQuestion.options.map((opt, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Button
                        onClick={() => handleAnswer(currentQuestion.id, opt.label, opt.score)}
                        className="w-full justify-start gap-3 bg-zinc-800/80 hover:bg-gradient-to-r hover:from-green-600 hover:to-emerald-600 text-white py-4 h-auto rounded-xl border border-zinc-700 hover:border-green-500 transition-all duration-300 group"
                      >
                        <span className="text-2xl">{opt.emoji}</span>
                        <span className="flex-1 text-left">{opt.label}</span>
                        <motion.span 
                          className="text-green-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          whileHover={{ x: 5 }}
                        >
                          →
                        </motion.span>
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* دکمه بستن */}
              <Button 
                onClick={onClose}
                variant="ghost" 
                className="mt-6 w-full text-gray-500 hover:text-gray-300 hover:bg-zinc-800/50"
              >
                ✖️ انصراف و بستن
              </Button>
            </CardContent>

            {/* فوتر با برندینگ */}
            <div className="bg-zinc-900/50 px-6 py-2 text-center border-t border-zinc-800">
              <p className="text-xs text-gray-500">Trading Pro • ارزیابی وضعیت ذهنی</p>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}