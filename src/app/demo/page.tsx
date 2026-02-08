"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  User,
  Shirt,
  Video,
  ChevronRight,
  Play,
  Pause,
  ArrowLeft,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                  */
/* ------------------------------------------------------------------ */

const ease = [0.25, 0.1, 0.25, 1] as const;

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.65, delay, ease },
});

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.5, delay, ease },
});

const scaleIn = (delay = 0) => ({
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.7, delay, ease },
});

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

type Gender = "woman" | "man";

interface OutfitData {
  id: number;
  label: string;
  description: string;
  image: string;
}

const models: Record<Gender, { base: string; label: string; outfits: OutfitData[] }> = {
  woman: {
    base: "/demo/woman-0.png",
    label: "女性モデル",
    outfits: [
      {
        id: 1,
        label: "デニムジャケット",
        description: "デニムジャケット × ベージュショーツ",
        image: "/demo/woman-1.jpg",
      },
      {
        id: 2,
        label: "ブラックフーディー",
        description: "ブラックフーディー × チェック柄スカート",
        image: "/demo/woman-2.jpg",
      },
    ],
  },
  man: {
    base: "/demo/man-0.png",
    label: "男性モデル",
    outfits: [
      {
        id: 1,
        label: "ベージュジャケット",
        description: "ベージュジャケット × デニムショーツ",
        image: "/demo/man-1.jpg",
      },
      {
        id: 2,
        label: "ダークフーディー",
        description: "ダークフーディー × カーゴパンツ",
        image: "/demo/man-2.jpg",
      },
    ],
  },
};

const videos = [
  { src: "/demo/video-woman-1.mp4", label: "ルック 1 — ウォーキング動画" },
  { src: "/demo/video-woman-2.mp4", label: "ルック 2 — ウォーキング動画" },
];

/* ------------------------------------------------------------------ */
/*  Step indicator                                                     */
/* ------------------------------------------------------------------ */

function StepBadge({ step, label }: { step: number; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-fuchsia-50 to-violet-50 border border-fuchsia-100 px-4 py-1.5 rounded-full mb-4 sm:mb-5">
      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white text-[10px] font-black">
        {step}
      </span>
      <span className="text-xs font-semibold text-fuchsia-700">{label}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Video player component                                             */
/* ------------------------------------------------------------------ */

function VideoCard({ src, label }: { src: string; label: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: false, margin: "-100px" });

  useEffect(() => {
    if (isInView && videoRef.current) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else if (!isInView && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isInView]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div ref={containerRef} className="relative group cursor-pointer" onClick={togglePlay}>
      <div className="relative aspect-[9/16] sm:aspect-[3/4] rounded-2xl overflow-hidden border-2 border-white shadow-xl shadow-purple-900/5 bg-gray-100">
        <video
          ref={videoRef}
          src={src}
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        {/* play/pause overlay */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
            isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"
          }`}
        >
          <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
            {isPlaying ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-white ml-0.5" />
            )}
          </div>
        </div>
        {/* Bottom label */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
        <p className="absolute bottom-3 left-3 text-white text-xs font-bold">{label}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Demo Page                                                     */
/* ------------------------------------------------------------------ */

export default function DemoPage() {
  const [selectedGender, setSelectedGender] = useState<Gender>("woman");
  const [selectedOutfit, setSelectedOutfit] = useState(-1);
  const [showResult, setShowResult] = useState(false);

  const model = models[selectedGender];

  // Reset outfit when we switch genders
  const handleGenderSwitch = (g: Gender) => {
    setSelectedGender(g);
    setSelectedOutfit(0);
    setShowResult(false);
  };

  const handleOutfitSelect = (idx: number) => {
    setSelectedOutfit(idx);
    setShowResult(false);
    // auto-show result after a brief delay to simulate "generation"
    setTimeout(() => setShowResult(true), 600);
  };

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* ============================================================ */}
      {/*  Header                                                      */}
      {/* ============================================================ */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-black rounded-lg flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tighter">生成</span>
            <span className="text-[10px] text-gray-400 tracking-widest ml-1 mt-1 hidden sm:inline">
              SEISEI
            </span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/"
              className="text-xs sm:text-sm text-gray-500 hover:text-black transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ホームに戻る</span>
            </Link>
            <Link
              href="/onboarding"
              className="bg-black text-white px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold hover:bg-gray-800 transition-colors"
            >
              今すぐ始める
            </Link>
          </div>
        </div>
      </motion.header>

      {/* ============================================================ */}
      {/*  HERO — Demo intro                                           */}
      {/* ============================================================ */}
      <section className="relative pt-28 sm:pt-36 pb-12 sm:pb-20 px-4 sm:px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(168,85,247,0.06)_0%,_transparent_60%)]" />
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div {...fadeUp(0.1)}>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-fuchsia-50 to-violet-50 border border-fuchsia-100 px-4 py-1.5 rounded-full mb-5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-fuchsia-500" />
              </span>
              <span className="text-xs font-semibold text-fuchsia-700">インタラクティブデモ</span>
            </div>
          </motion.div>
          <motion.h1
            {...fadeUp(0.2)}
            className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-gray-900 leading-[1.1]"
          >
            AIで衣装を
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-violet-600">
              自由に着せ替え
            </span>
          </motion.h1>
          <motion.p
            {...fadeUp(0.35)}
            className="text-base sm:text-lg text-gray-400 mt-5 max-w-2xl mx-auto leading-relaxed"
          >
            モデルを選んで、衣装を選ぶだけ。
            <br className="hidden sm:block" />
            AIがリアルな着用イメージと動画を数秒で生成します。
          </motion.p>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  STEP 1 — Choose your model                                  */}
      {/* ============================================================ */}
      <section className="relative py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease }}
            className="text-center mb-8 sm:mb-12"
          >
            <StepBadge step={1} label="モデルを選ぶ" />
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-gray-900">
              AIモデルを選択
            </h2>
            <p className="text-gray-400 text-sm sm:text-base mt-3 max-w-lg mx-auto">
              男性・女性のAIモデルから選択。あなたのブランドに合ったモデルで商品を表現できます。
            </p>
          </motion.div>

          {/* Model selector cards */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto">
            {(["woman", "man"] as Gender[]).map((gender, i) => {
              const isSelected = selectedGender === gender;
              return (
                <motion.button
                  key={gender}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.12, ease }}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleGenderSwitch(gender)}
                  className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-300 cursor-pointer group ${
                    isSelected
                      ? "border-fuchsia-400 shadow-xl shadow-fuchsia-500/10 ring-2 ring-fuchsia-200"
                      : "border-gray-200 shadow-md hover:border-gray-300 hover:shadow-lg"
                  }`}
                >
                  {/* Selected indicator */}
                  {isSelected && (
                    <motion.div
                      layoutId="model-selected"
                      className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center shadow-lg"
                    >
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}

                  <div className="relative aspect-[3/4] bg-gray-50">
                    <Image
                      src={models[gender].base}
                      alt={models[gender].label}
                      fill
                      className={`object-cover transition-transform duration-500 ${
                        isSelected ? "scale-105" : "group-hover:scale-[1.02]"
                      }`}
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-white/70" />
                        <p className="text-white text-sm sm:text-base font-bold">
                          {models[gender].label}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  STEP 2 — Choose outfit & see result                         */}
      {/* ============================================================ */}
      <section className="relative py-12 sm:py-20 px-4 sm:px-6 bg-gray-50/60">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(168,85,247,0.04)_0%,_transparent_60%)]" />
        <div className="relative max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease }}
            className="text-center mb-8 sm:mb-12"
          >
            <StepBadge step={2} label="衣装を選ぶ" />
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-gray-900">
              衣装をタップして
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-violet-600">
                着せ替え
              </span>
            </h2>
            <p className="text-gray-400 text-sm sm:text-base mt-3 max-w-lg mx-auto">
              商品画像を選択するだけで、AIモデルが自動的に着用イメージを生成します。
            </p>
          </motion.div>

          {/* Outfit selection + result */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
            {/* Left: Base model + outfit buttons */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, ease }}
              className="lg:col-span-4 space-y-5"
            >
              {/* Base model card */}
              <div className="relative rounded-2xl overflow-hidden border-2 border-white shadow-xl bg-gray-50">
                <div className="absolute top-3 left-3 z-20">
                  <span className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm text-[10px] font-bold text-gray-600 px-2.5 py-1 rounded-full">
                    <User className="w-3 h-3" />
                    ベースモデル
                  </span>
                </div>
                <div className="relative aspect-[3/4]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedGender}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4, ease }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={model.base}
                        alt={model.label}
                        fill
                        className="object-cover"
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Outfit buttons */}
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Shirt className="w-3.5 h-3.5" />
                  衣装を選択
                </p>
                {model.outfits.map((outfit, idx) => (
                  <motion.button
                    key={`${selectedGender}-${outfit.id}`}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleOutfitSelect(idx)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                      selectedOutfit === idx
                        ? "border-fuchsia-400 bg-fuchsia-50/50 shadow-md"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-bold ${selectedOutfit === idx ? "text-fuchsia-700" : "text-gray-800"}`}>
                          {outfit.label}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{outfit.description}</p>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-colors ${selectedOutfit === idx ? "text-fuchsia-500" : "text-gray-300"}`} />
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Center: Arrow / Transformation indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3, ease }}
              className="hidden lg:flex lg:col-span-1 items-center justify-center self-center"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-px h-12 bg-gradient-to-b from-transparent via-fuchsia-300 to-transparent" />
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <p className="text-[10px] font-bold text-fuchsia-600 tracking-wider">AI 生成</p>
                <div className="w-px h-12 bg-gradient-to-b from-transparent via-fuchsia-300 to-transparent" />
              </div>
            </motion.div>

            {/* Mobile: horizontal arrow */}
            <div className="flex lg:hidden items-center justify-center">
              <motion.div
                animate={showResult ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.5, ease }}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/20"
              >
                <Sparkles className="w-4 h-4 text-white" />
              </motion.div>
            </div>

            {/* Right: Generated result */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: 0.2, ease }}
              className="lg:col-span-7"
            >
              <div className="relative rounded-2xl overflow-hidden border-2 border-white shadow-2xl shadow-purple-900/10 ring-1 ring-purple-200/30 bg-gray-100">
                <div className="absolute top-3 left-3 z-20">
                  <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg shadow-purple-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    AI 生成結果
                  </span>
                </div>

                <div className="relative aspect-[3/4] sm:aspect-[4/5] lg:aspect-[3/4]">
                  <AnimatePresence mode="wait">
                    {showResult && selectedOutfit >= 0 ? (
                      <motion.div
                        key={`result-${selectedGender}-${selectedOutfit}`}
                        initial={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, scale: 0.95, filter: "blur(6px)" }}
                        transition={{ duration: 0.6, ease }}
                        className="absolute inset-0"
                      >
                        <Image
                          src={model.outfits[selectedOutfit].image}
                          alt={model.outfits[selectedOutfit].label}
                          fill
                          className="object-cover"
                        />
                        {/* Bottom info */}
                        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                          <div>
                            <p className="text-white/60 text-[10px] font-medium">
                              バーチャル試着
                            </p>
                            <p className="text-white text-sm sm:text-base font-bold">
                              {model.label} × {model.outfits[selectedOutfit].label}
                            </p>
                          </div>
                          <span className="text-white/50 text-[10px] bg-white/10 backdrop-blur-sm px-2 py-0.5 rounded-full">
                            2.3s で生成
                          </span>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100"
                      >
                        {/* Generating animation */}
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-12 h-12 rounded-full border-2 border-fuchsia-200 border-t-fuchsia-500 mb-4"
                        />
                        <p className="text-sm font-bold text-gray-400">
                          衣装を選択して生成
                        </p>
                        <p className="text-xs text-gray-300 mt-1">
                          左側のボタンをタップ
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  STEP 3 — Video generation                                   */}
      {/* ============================================================ */}
      <section className="relative py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease }}
            className="text-center mb-8 sm:mb-12"
          >
            <StepBadge step={3} label="動画を生成" />
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-gray-900">
              静止画だけじゃない。
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-violet-600">
                動画も自動生成
              </span>
            </h2>
            <p className="text-gray-400 text-sm sm:text-base mt-3 max-w-lg mx-auto">
              生成した着用イメージから、ウォーキング動画やルックブック動画をワンクリックで作成できます。
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">
            {videos.map((video, i) => (
              <motion.div
                key={video.src}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: i * 0.15, ease }}
              >
                <VideoCard src={video.src} label={video.label} />
              </motion.div>
            ))}
          </div>

          {/* Tech badges */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3, ease }}
            className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-8 sm:mt-12"
          >
            {["SegFit v1.3", "Z-Image Turbo", "FaceSwap v5", "Video Gen v2"].map((tech) => (
              <span
                key={tech}
                className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-100 text-[9px] sm:text-[10px] font-semibold text-gray-400 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {tech}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  Summary — How it works                                      */}
      {/* ============================================================ */}
      <section className="relative py-12 sm:py-20 px-4 sm:px-6 bg-gray-50/60">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease }}
            className="text-center mb-10 sm:mb-14"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-gray-900">
              たった3ステップで
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-violet-600">
                完了
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: 1,
                icon: User,
                title: "モデルを選ぶ",
                description: "男性・女性のAIモデルから、ブランドに合ったモデルを選択します。",
                accent: "bg-violet-50 text-violet-600 border-violet-100",
              },
              {
                step: 2,
                icon: Shirt,
                title: "衣装をアップロード",
                description: "商品写真をアップロードするだけで、AIが自動的に着用イメージを生成します。",
                accent: "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100",
              },
              {
                step: 3,
                icon: Video,
                title: "動画を生成",
                description: "着用イメージからウォーキング動画を自動生成。SNSやECにすぐ使えます。",
                accent: "bg-amber-50 text-amber-600 border-amber-100",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.12, ease }}
                whileHover={{ y: -6 }}
                className="relative bg-white p-7 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-shadow group"
              >
                {/* Step number */}
                <div className="absolute -top-3 -left-2 w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center text-white text-xs font-black shadow-lg">
                  {item.step}
                </div>
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 border ${item.accent}`}
                >
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-extrabold text-gray-900 mb-2 tracking-tight">
                  {item.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
                {/* Connector line (md only, not on last) */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 border-t-2 border-dashed border-fuchsia-200" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  CTA                                                         */}
      {/* ============================================================ */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-gray-900 mb-4">
            準備はできましたか？
          </h2>
          <p className="text-gray-400 text-base sm:text-lg mb-8 max-w-xl mx-auto">
            高品質なAI画像生成で、
            <br className="hidden md:block" />
            ファッション業界のワークフローを革新しましょう。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/onboarding"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-black text-white h-13 sm:h-14 px-8 sm:px-10 rounded-xl text-sm sm:text-base font-bold hover:bg-gray-800 transition-all shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20"
            >
              今すぐ始める
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-gray-500 h-13 sm:h-14 px-6 rounded-xl text-sm font-medium hover:text-black hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <ArrowLeft className="w-4 h-4" />
              ホームに戻る
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 sm:py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tighter">生成</span>
          </Link>
          <p className="text-xs text-gray-300">© 2026 Seisei AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
