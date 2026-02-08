"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, Shield, ImageIcon, Play } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                  */
/* ------------------------------------------------------------------ */

const ease = [0.25, 0.1, 0.25, 1] as const;

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.6, delay, ease },
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

const slideInLeft = (delay = 0) => ({
  initial: { opacity: 0, x: -40 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, delay, ease },
});

const slideInRight = (delay = 0) => ({
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, delay, ease },
});

export default function Home() {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-black rounded-lg flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tighter">生成</span>
            <span className="text-[10px] text-gray-400 tracking-widest ml-1 mt-1 hidden sm:inline">SEISEI</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <Link href="/demo" className="text-sm text-gray-500 hover:text-black transition-colors hidden md:block">デモ</Link>
            <Link href="#features" className="text-sm text-gray-500 hover:text-black transition-colors hidden md:block">機能</Link>
            <Link
              href="/login"
              className="text-xs sm:text-sm font-medium text-gray-600 hover:text-black transition-colors"
            >
              ログイン
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
      {/*  HERO — Segmind-style visual flow                            */}
      {/* ============================================================ */}
      <section id="demo" className="relative pt-24 sm:pt-28 pb-8 px-4 sm:px-6">
        {/* Subtle radial gradient background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(168,85,247,0.04)_0%,_transparent_70%)]" />

        <div className="relative max-w-7xl mx-auto">
          {/* Tagline + Headline */}
          <div className="text-center mb-10 sm:mb-16">
            <motion.div {...fadeUp(0.1)} className="inline-flex items-center gap-2 bg-gradient-to-r from-fuchsia-50 to-violet-50 border border-fuchsia-100 px-3 sm:px-4 py-1.5 rounded-full mb-4 sm:mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-fuchsia-500" />
              </span>
              <span className="text-[11px] sm:text-xs font-semibold text-fuchsia-700">Segmind AI 搭載</span>
            </motion.div>

            <motion.h1 {...fadeUp(0.25)} className="text-3xl sm:text-5xl lg:text-7xl font-black tracking-tight text-gray-900 leading-[1.1] sm:leading-[1.05]">
              ファッション
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-violet-600">画像生成</span>
              を<br className="hidden sm:block" />自動化する
            </motion.h1>
            <motion.p {...fadeUp(0.4)} className="text-base sm:text-lg md:text-xl text-gray-400 mt-4 sm:mt-6 max-w-2xl mx-auto leading-relaxed">
              商品写真をアップロードするだけ。AIが最速で<br className="hidden md:block" />
              モデル着用イメージ・動画を大量に生成します。
            </motion.p>

            <motion.div {...fadeUp(0.55)} className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6 sm:mt-8">
              <Link
                href="/onboarding"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-black text-white h-11 sm:h-12 px-7 rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20"
              >
                今すぐ始める
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/demo"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-gray-500 h-11 sm:h-12 px-6 rounded-xl text-sm font-medium hover:text-black hover:bg-gray-50 transition-colors border border-gray-200"
              >
                <Play className="w-4 h-4" />
                デモを見る
              </Link>
            </motion.div>
            <motion.p {...fadeIn(0.7)} className="text-[11px] sm:text-xs text-gray-300 mt-3 sm:mt-4">高品質AI生成 · プロ仕様のファッション画像</motion.p>
          </div>

          {/* ====== VISUAL FLOW — Input → AI → Outputs ====== */}
          <div className="relative max-w-6xl mx-auto">

            {/* SVG connection lines — hidden on mobile, shown on lg+ */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-0 hidden lg:block"
              viewBox="0 0 1200 520"
              fill="none"
              preserveAspectRatio="xMidYMid meet"
            >
              <path d="M 220 260 C 400 260, 350 180, 600 180" stroke="url(#grad1)" strokeWidth="1.5" strokeDasharray="6 4" className="animate-dash" />
              <path d="M 220 420 C 400 420, 400 320, 600 260" stroke="url(#grad1)" strokeWidth="1.5" strokeDasharray="6 4" className="animate-dash" />
              <path d="M 740 200 C 850 200, 850 260, 980 260" stroke="url(#grad2)" strokeWidth="1.5" strokeDasharray="6 4" className="animate-dash" />
              <path d="M 740 320 C 850 320, 850 420, 980 420" stroke="url(#grad2)" strokeWidth="1.5" strokeDasharray="6 4" className="animate-dash" />
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#d8b4fe" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
                <linearGradient id="grad2" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
              </defs>
            </svg>

            {/* ---- MOBILE: stacked layout (< md) ---- */}
            <div className="relative z-10 md:hidden">
              {/* Main hero image — full width */}
              <motion.div {...scaleIn(0.6)} className="relative group mb-4">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                  <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg shadow-purple-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    AI 生成結果
                  </span>
                </div>
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-white shadow-2xl shadow-purple-900/10 ring-1 ring-purple-200/50">
                  <Image src="/hero/hero-runway.webp" alt="AI生成 — ランウェイ" fill className="object-cover" priority />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div>
                      <p className="text-white/60 text-[10px] font-medium">バーチャル試着</p>
                      <p className="text-white text-sm font-bold">Yuki × ブレザー SS26</p>
                    </div>
                    <span className="text-white/40 text-[10px]">2.3s で生成</span>
                  </div>
                </div>
              </motion.div>

              {/* Secondary images — 2×2 grid */}
              <motion.div
                initial="initial"
                animate="animate"
                variants={{ animate: { transition: { staggerChildren: 0.1, delayChildren: 0.8 } } }}
                className="grid grid-cols-2 gap-3"
              >
                {[
                  { label: 'スタイル画像', src: '/models/yuki.jpg', alt: 'Yuki', dot: 'bg-emerald-400', pos: 'left-2' },
                  { label: '商品画像', src: '/hero/garment-input.webp', alt: 'ブレザー', dot: 'bg-emerald-400', pos: 'left-2' },
                  { label: 'エディトリアル', src: '/hero/hero-editorial.webp', alt: 'エディトリアル', dot: 'bg-fuchsia-400', pos: 'right-2' },
                  { label: 'ストリート', src: '/hero/hero-street.webp', alt: 'ストリート', dot: 'bg-fuchsia-400', pos: 'right-2' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    variants={{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease } } }}
                    className="relative group"
                  >
                    <div className={`absolute -top-2.5 ${item.pos} z-20`}>
                      <span className="inline-flex items-center gap-1 bg-white border border-gray-200 shadow-sm text-[9px] font-bold text-gray-600 px-1.5 py-0.5 rounded-full">
                        <span className={`w-1 h-1 rounded-full ${item.dot}`} />
                        {item.label}
                      </span>
                    </div>
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-white shadow-lg">
                      <Image src={item.src} alt={item.alt} fill className="object-cover" />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* ---- TABLET: 3-column (md–lg) ---- */}
            <div className="relative z-10 hidden md:grid lg:hidden grid-cols-3 gap-4 items-start">
              {/* Left — inputs stacked */}
              <motion.div {...slideInLeft(0.5)} className="space-y-3">
                <div className="relative group">
                  <div className="absolute -top-2.5 left-2 z-20">
                    <span className="inline-flex items-center gap-1 bg-white border border-gray-200 shadow-sm text-[10px] font-bold text-gray-600 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      スタイル画像
                    </span>
                  </div>
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-white shadow-xl">
                    <Image src="/models/yuki.jpg" alt="Yuki" fill className="object-cover" />
                  </div>
                </div>
                <div className="relative group">
                  <div className="absolute -top-2.5 left-2 z-20">
                    <span className="inline-flex items-center gap-1 bg-white border border-gray-200 shadow-sm text-[10px] font-bold text-gray-600 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      商品画像
                    </span>
                  </div>
                  <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-white shadow-xl">
                    <Image src="/hero/garment-input.webp" alt="ブレザー" fill className="object-cover" />
                  </div>
                </div>
              </motion.div>
              {/* Center — hero */}
              <motion.div {...scaleIn(0.7)} className="relative group">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                  <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg shadow-purple-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    AI 生成結果
                  </span>
                </div>
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-white shadow-2xl ring-1 ring-purple-200/50">
                  <Image src="/hero/hero-runway.webp" alt="AI生成 — ランウェイ" fill className="object-cover" priority />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white/60 text-[10px] font-medium">バーチャル試着</p>
                    <p className="text-white text-sm font-bold">Yuki × ブレザー SS26</p>
                  </div>
                </div>
              </motion.div>
              {/* Right — outputs */}
              <motion.div {...slideInRight(0.9)} className="space-y-3">
                <div className="relative group">
                  <div className="absolute -top-2.5 right-2 z-20">
                    <span className="inline-flex items-center gap-1 bg-white border border-gray-200 shadow-sm text-[10px] font-bold text-gray-600 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
                      エディトリアル
                    </span>
                  </div>
                  <div className="relative aspect-[4/5] rounded-xl overflow-hidden border-2 border-white shadow-xl">
                    <Image src="/hero/hero-editorial.webp" alt="エディトリアル" fill className="object-cover" />
                  </div>
                </div>
                <div className="relative group">
                  <div className="absolute -top-2.5 right-2 z-20">
                    <span className="inline-flex items-center gap-1 bg-white border border-gray-200 shadow-sm text-[10px] font-bold text-gray-600 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
                      ストリート
                    </span>
                  </div>
                  <div className="relative aspect-[4/5] rounded-xl overflow-hidden border-2 border-white shadow-xl">
                    <Image src="/hero/hero-street.webp" alt="ストリート" fill className="object-cover" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ---- DESKTOP: original 12-col grid (lg+) ---- */}
            <div className="relative z-10 hidden lg:grid grid-cols-12 gap-4 items-center">
              {/* LEFT COLUMN — Inputs */}
              <motion.div {...slideInLeft(0.5)} className="col-span-3 space-y-4">
                <div className="relative group">
                  <div className="absolute -top-3 left-3 z-20">
                    <span className="inline-flex items-center gap-1 bg-white border border-gray-200 shadow-sm text-[10px] font-bold text-gray-600 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      スタイル画像
                    </span>
                  </div>
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-white shadow-xl shadow-purple-900/5 group-hover:shadow-2xl transition-shadow">
                    <Image src="/models/yuki.jpg" alt="スタイル画像 — Yuki" fill className="object-cover" />
                  </div>
                </div>
                <div className="relative group">
                  <div className="absolute -top-3 left-3 z-20">
                    <span className="inline-flex items-center gap-1 bg-white border border-gray-200 shadow-sm text-[10px] font-bold text-gray-600 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      商品画像
                    </span>
                  </div>
                  <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-white shadow-xl shadow-purple-900/5 group-hover:shadow-2xl transition-shadow">
                    <Image src="/hero/garment-input.webp" alt="商品画像 — ブレザー" fill className="object-cover" />
                  </div>
                </div>
              </motion.div>

              {/* CENTER COLUMN — Main Hero Output */}
              <motion.div {...scaleIn(0.7)} className="col-span-5 relative group">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                  <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg shadow-purple-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    AI 生成結果
                  </span>
                </div>
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-white shadow-2xl shadow-purple-900/10 ring-1 ring-purple-200/50 group-hover:shadow-3xl transition-shadow">
                  <Image src="/hero/hero-runway.webp" alt="AI生成 — ランウェイ" fill className="object-cover" priority />
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                    <div>
                      <p className="text-white/60 text-[10px] font-medium">バーチャル試着</p>
                      <p className="text-white text-sm font-bold">Yuki × ブレザー SS26</p>
                    </div>
                    <span className="text-white/40 text-[10px]">2.3s で生成</span>
                  </div>
                </div>
              </motion.div>

              {/* RIGHT COLUMN — More outputs */}
              <motion.div {...slideInRight(0.9)} className="col-span-4 space-y-4">
                <div className="relative group">
                  <div className="absolute -top-3 right-3 z-20">
                    <span className="inline-flex items-center gap-1 bg-white border border-gray-200 shadow-sm text-[10px] font-bold text-gray-600 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
                      エディトリアル
                    </span>
                  </div>
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border-2 border-white shadow-xl shadow-purple-900/5 group-hover:shadow-2xl transition-shadow">
                    <Image src="/hero/hero-editorial.webp" alt="AI生成 — エディトリアル" fill className="object-cover" />
                  </div>
                </div>
                <div className="relative group">
                  <div className="absolute -top-3 right-3 z-20">
                    <span className="inline-flex items-center gap-1 bg-white border border-gray-200 shadow-sm text-[10px] font-bold text-gray-600 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
                      ストリート
                    </span>
                  </div>
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border-2 border-white shadow-xl shadow-purple-900/5 group-hover:shadow-2xl transition-shadow">
                    <Image src="/hero/hero-street.webp" alt="AI生成 — ストリート" fill className="object-cover" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Floating tech badges */}
            <motion.div {...fadeUp(1.1)} className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-6 sm:mt-8">
              {['SegFit v1.3', 'Z-Image Turbo', 'FaceSwap v5'].map((tech) => (
                <span key={tech} className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-100 text-[9px] sm:text-[10px] font-semibold text-gray-400 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {tech}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FEATURES                                                    */}
      {/* ============================================================ */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 bg-gray-50/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease }}
            className="text-center mb-10 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-gray-900">
              撮影なし。モデル不要。<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-violet-600">AIが全てを生成。</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: ImageIcon,
                title: 'バーチャル試着',
                description: '商品画像をアップロードするだけで、AIモデルが着用した高品質な画像を瞬時に生成',
                accent: 'bg-violet-50 text-violet-600 border-violet-100',
              },
              {
                icon: Zap,
                title: '2秒で画像生成',
                description: '最新のSegmind AIエンジンで、従来の撮影より1000倍速く高品質な画像を大量生成',
                accent: 'bg-amber-50 text-amber-600 border-amber-100',
              },
              {
                icon: Shield,
                title: '商用利用OK',
                description: '生成された画像は完全な商用利用が可能。EC・SNS・広告にそのまま使用できます',
                accent: 'bg-emerald-50 text-emerald-600 border-emerald-100',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.12, ease }}
                whileHover={{ y: -6 }}
                className="bg-white p-7 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-shadow group"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 border ${feature.accent}`}>
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-extrabold text-gray-900 mb-2 tracking-tight">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
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
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-gray-900 mb-6">
            今すぐ始めましょう
          </h2>
          <p className="text-gray-400 text-base sm:text-lg mb-8">
            最先端のAI技術で、プロ品質の<br className="hidden md:block" />
            ファッション画像を瞬時に生成できます。
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 bg-black text-white h-14 px-10 rounded-xl text-base font-bold hover:bg-gray-800 transition-all shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20"
          >
            アカウントを作成
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 sm:py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tighter">生成</span>
          </div>
          <p className="text-xs text-gray-300">
            © 2026 Seisei AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
