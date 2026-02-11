"use client";

import React, { useState, useCallback, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone,
  Package,
  Users,
  ImageIcon,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";

type WizardStep = {
  title: string;
  description: string;
  icon: React.ElementType;
  accent: string;
  accentBg: string;
  tips: [string, string];
};

const WIZARD_STEPS: WizardStep[] = [
  {
    title: "キャンペーンを作成する",
    description:
      "まずはキャンペーンを作成しましょう。キャンペーンはプロジェクト単位で商品やモデル、生成画像を整理するためのフォルダのようなものです。",
    icon: Megaphone,
    accent: "text-amber-600",
    accentBg: "bg-amber-50",
    tips: [
      "キャンペーン名にはシーズンやコレクション名を入れると管理しやすくなります。",
      "複数のキャンペーンを並行して運用できるので、用途ごとに分けるのがおすすめです。",
    ],
  },
  {
    title: "商品を追加する",
    description:
      "キャンペーンに商品を登録しましょう。商品画像をアップロードすると、AIがモデル着用イメージを生成する際に使用します。",
    icon: Package,
    accent: "text-emerald-600",
    accentBg: "bg-emerald-50",
    tips: [
      "商品画像は背景が白くシンプルなものほど、AIの生成精度が上がります。",
      "商品情報（カテゴリやサイズ）を詳しく入力すると、より正確な着用イメージが作れます。",
    ],
  },
  {
    title: "モデルを作成する",
    description:
      "AIモデルを登録しましょう。独自のバーチャルモデルを作成し、ブランドに合ったイメージで商品を着用させることができます。",
    icon: Users,
    accent: "text-sky-600",
    accentBg: "bg-sky-50",
    tips: [
      "モデルの雰囲気やスタイルはブランドイメージに合わせて設定しましょう。",
      "複数のモデルを登録しておくと、様々なバリエーションの画像を生成できます。",
    ],
  },
  {
    title: "画像を生成する",
    description:
      "すべての準備が整いました！キャンペーン・商品・モデルを組み合わせて、プロ品質のモデル着用画像を生成しましょう。",
    icon: ImageIcon,
    accent: "text-violet-600",
    accentBg: "bg-violet-50",
    tips: [
      "生成された画像はダウンロードしてECサイトやSNSにすぐ活用できます。",
      "気に入った画像のスタイルをテンプレートとして保存すると、次回から効率的に生成できます。",
    ],
  },
];

const STORAGE_KEY = "seisei_dashboard_wizard_completed";

const subscribe = () => () => {};
function getClientSnapshot() {
  return !localStorage.getItem(STORAGE_KEY);
}
function getServerSnapshot() {
  return false;
}

export default function WelcomeWizard() {
  const shouldShow = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const [visible, setVisible] = useState(true);
  const [currentStep, setCurrentStep] = useState(-1); // -1 = welcome screen
  const [direction, setDirection] = useState(1);

  const handleComplete = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep >= WIZARD_STEPS.length - 1) {
      handleComplete();
    } else {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, handleComplete]);

  const handleBack = useCallback(() => {
    setDirection(-1);
    setCurrentStep((s) => s - 1);
  }, []);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  if (!shouldShow || !visible) return null;

  const totalSteps = WIZARD_STEPS.length;
  const isWelcome = currentStep === -1;
  const isLastStep = currentStep === totalSteps - 1;
  const step = !isWelcome ? WIZARD_STEPS[currentStep] : null;

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
    }),
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Dialog */}
          <motion.div
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            {/* Close / Skip */}
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="閉じる"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Progress bar */}
            {!isWelcome && (
              <div className="h-1 bg-gray-100">
                <motion.div
                  className="h-full bg-black rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((currentStep + 1) / totalSteps) * 100}%`,
                  }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                />
              </div>
            )}

            <div className="p-6 sm:p-8">
              <AnimatePresence mode="wait" custom={direction}>
                {isWelcome ? (
                  /* ── Welcome Screen ── */
                  <motion.div
                    key="welcome"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="text-center"
                  >
                    <div className="w-16 h-16 mx-auto mb-5 bg-black rounded-2xl flex items-center justify-center">
                      <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">
                      生成へようこそ！
                    </h2>
                    <p className="text-gray-500 text-sm leading-relaxed mb-6 max-w-sm mx-auto">
                      AIを活用してプロ品質のモデル着用画像を簡単に作成できるプラットフォームです。まずはダッシュボードの使い方をご案内します。
                    </p>

                    {/* Step previews */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {WIZARD_STEPS.map((s, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100"
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${s.accentBg} ${s.accent}`}
                          >
                            <s.icon className="w-4 h-4" />
                          </div>
                          <div className="text-left min-w-0">
                            <p className="text-xs font-semibold text-gray-700 truncate">
                              {s.title}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleNext}
                      className="w-full py-3 px-6 bg-black text-white font-bold text-sm rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                      ガイドを始める
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleSkip}
                      className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      スキップする
                    </button>
                  </motion.div>
                ) : (
                  /* ── Step Content ── */
                  <motion.div
                    key={currentStep}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                  >
                    {/* Step indicator */}
                    <div className="flex items-center gap-2 mb-5">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${step!.accentBg} ${step!.accent}`}
                      >
                        {currentStep + 1}
                      </span>
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        ステップ {currentStep + 1} / {totalSteps}
                      </span>
                    </div>

                    {/* Icon + Title */}
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center ${step!.accentBg} ${step!.accent}`}
                      >
                        {step && <step.icon className="w-5 h-5" />}
                      </div>
                      <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">
                        {step!.title}
                      </h3>
                    </div>

                    <p className="text-gray-500 text-sm leading-relaxed mb-5">
                      {step!.description}
                    </p>

                    {/* Two tips */}
                    <div className="space-y-3 mb-6">
                      {step!.tips.map((tip, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100"
                        >
                          <div className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {tip}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleBack}
                        className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        戻る
                      </button>
                      <button
                        onClick={handleNext}
                        className="flex-1 py-3 px-6 bg-black text-white font-bold text-sm rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                      >
                        {isLastStep ? (
                          <>
                            ダッシュボードへ
                            <CheckCircle2 className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            次へ
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>

                    {/* Step dots */}
                    <div className="flex items-center justify-center gap-1.5 mt-5">
                      {WIZARD_STEPS.map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            i === currentStep
                              ? "w-6 bg-black"
                              : i < currentStep
                                ? "w-1.5 bg-gray-400"
                                : "w-1.5 bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
