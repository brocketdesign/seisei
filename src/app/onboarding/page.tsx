"use client";

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import {
  Check,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  Instagram,
  Globe,
  Building2,
  Link as LinkIcon,
  Tag,
  Users,
  Sparkles,
  Loader2,
  Crown,
  Zap,
  Star,
  MessageSquare,
  Gift,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Step = 'welcome' | 'brand' | 'product' | 'style' | 'platform' | 'plan';

const STEPS: Step[] = ['welcome', 'brand', 'product', 'style', 'platform', 'plan'];

interface BrandInfo {
  name: string;
  website: string;
  description: string;
}

interface ProductInfo {
  categories: string[];
  targetAudience: string[];
  priceRange: string;
  monthlyVolume: string;
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const ease = [0.25, 0.1, 0.25, 1] as [number, number, number, number];

const pageVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 60 : -60,
    opacity: 0,
    filter: 'blur(4px)',
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.45, ease },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -60 : 60,
    opacity: 0,
    filter: 'blur(4px)',
    transition: { duration: 0.3, ease },
  }),
};

const staggerContainer = {
  center: {
    transition: { staggerChildren: 0.06, delayChildren: 0.15 },
  },
};

const staggerItem = {
  enter: { opacity: 0, y: 16 },
  center: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>('welcome');
  const [direction, setDirection] = useState(1);
  const [welcomeDone, setWelcomeDone] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

  // Handle cancel URL redirect back with ?step=plan
  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam === 'plan') {
      setWelcomeDone(true);
      setStep('plan');
    }
  }, [searchParams]);

  // Auto-advance from welcome after 3.5s
  useEffect(() => {
    if (step === 'welcome' && !welcomeDone) {
      const timer = setTimeout(() => {
        setWelcomeDone(true);
        setDirection(1);
        setStep('brand');
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [step, welcomeDone]);

  // Step 1 – Brand
  const [brand, setBrand] = useState<BrandInfo>({ name: '', website: '', description: '' });

  // Step 2 – Product
  const [product, setProduct] = useState<ProductInfo>({
    categories: [],
    targetAudience: [],
    priceRange: '',
    monthlyVolume: '',
  });

  // Step 3 – Style
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

  // Step 4 – Platform
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  /* ---- Data ---- */

  const categories = [
    { id: 'tops', label: 'トップス' },
    { id: 'bottoms', label: 'ボトムス' },
    { id: 'dresses', label: 'ワンピース' },
    { id: 'outerwear', label: 'アウター' },
    { id: 'accessories', label: 'アクセサリー' },
    { id: 'shoes', label: 'シューズ' },
    { id: 'bags', label: 'バッグ' },
    { id: 'sportswear', label: 'スポーツウェア' },
  ];

  const audiences = [
    { id: 'women_20s', label: '女性 20代' },
    { id: 'women_30s', label: '女性 30代' },
    { id: 'women_40s', label: '女性 40代+' },
    { id: 'men_20s', label: '男性 20代' },
    { id: 'men_30s', label: '男性 30代' },
    { id: 'men_40s', label: '男性 40代+' },
    { id: 'unisex', label: 'ユニセックス' },
    { id: 'kids', label: 'キッズ' },
  ];

  const priceRanges = [
    { id: 'budget', label: '～¥5,000', desc: 'プチプラ' },
    { id: 'mid', label: '¥5,000〜¥20,000', desc: 'ミドルレンジ' },
    { id: 'premium', label: '¥20,000〜¥50,000', desc: 'プレミアム' },
    { id: 'luxury', label: '¥50,000〜', desc: 'ラグジュアリー' },
  ];

  const volumes = [
    { id: 'small', label: '〜50枚/月' },
    { id: 'medium', label: '50〜200枚/月' },
    { id: 'large', label: '200〜500枚/月' },
    { id: 'enterprise', label: '500枚以上/月' },
  ];

  // Style preview image mapping
  const styleImages: Record<string, string> = {
    minimal: '/styles/minimal.webp',
    street: '/styles/street.webp',
    casual: '/styles/casual.webp',
    luxury: '/styles/luxury.webp',
    mode: '/styles/mode.webp',
    fem: '/styles/fem.webp',
  };

  // Currently hovered/selected style for background preview
  const [previewStyle, setPreviewStyle] = useState<string | null>(null);
  const activePreviewStyle = previewStyle || (selectedStyles.length > 0 ? selectedStyles[selectedStyles.length - 1] : null);

  const styles = [
    { id: 'minimal', label: 'ミニマル', desc: 'シンプルで洗練された' },
    { id: 'street', label: 'ストリート', desc: '都会的で大胆な' },
    { id: 'casual', label: 'カジュアル', desc: '日常に溶け込む' },
    { id: 'luxury', label: 'ラグジュアリー', desc: '高級感のある' },
    { id: 'mode', label: 'モード', desc: '前衛的でスタイリッシュ' },
    { id: 'fem', label: 'フェミニン', desc: '柔らかく女性らしい' },
  ];

  const platforms = [
    { id: 'rakuten', label: '楽天市場', icon: ShoppingBag },
    { id: 'instagram', label: 'Instagram', icon: Instagram },
    { id: 'shopify', label: 'BASE / Shopify', icon: Globe },
    { id: 'amazon', label: 'Amazon', icon: ShoppingBag },
    { id: 'zozotown', label: 'ZOZOTOWN', icon: Tag },
    { id: 'own_ec', label: '自社EC', icon: Globe },
  ];

  const plans = [
    {
      id: 'free',
      name: 'フリー',
      description: '3日間無料でお試し',
      icon: Gift,
      monthlyPrice: 0,
      yearlyPrice: 0,
      trialDays: 3,
      recommended: true,
      features: [
        { text: '3日間無料トライアル', included: true },
        { text: '月50枚画像生成', included: true },
        { text: '標準画質', included: true },
        { text: 'メールサポート', included: true },
        { text: '動画生成', included: false },
        { text: '4K高画質', included: false },
      ],
    },
    {
      id: 'starter',
      name: 'スターター',
      description: '小規模ビジネスに最適',
      icon: Zap,
      monthlyPrice: 5000,
      yearlyPrice: 48000,
      features: [
        { text: '月50枚画像生成', included: true },
        { text: '標準画質', included: true },
        { text: 'メールサポート', included: true },
        { text: '動画生成', included: false },
        { text: '4K高画質', included: false },
        { text: 'API連携', included: false },
      ],
    },
    {
      id: 'pro',
      name: 'プロフェッショナル',
      description: '成長するブランドに',
      icon: Star,
      monthlyPrice: 20000,
      yearlyPrice: 192000,
      features: [
        { text: '月500枚画像生成', included: true },
        { text: '月50本動画生成', included: true },
        { text: '4K高画質', included: true },
        { text: '優先サポート', included: true },
        { text: '商用利用完全保証', included: true },
        { text: 'API連携', included: false },
      ],
    },
    {
      id: 'business',
      name: 'ビジネス',
      description: '大規模運用を支える',
      icon: Crown,
      monthlyPrice: 50000,
      yearlyPrice: 480000,
      features: [
        { text: '月2,000枚画像生成', included: true },
        { text: '月200本動画生成', included: true },
        { text: '4K高画質', included: true },
        { text: '専属サポート', included: true },
        { text: '商用利用完全保証', included: true },
        { text: 'API連携', included: true },
      ],
    },
  ];

  /* ---- Helpers ---- */

  const currentIndex = STEPS.indexOf(step);

  const toggle = (arr: string[], id: string) =>
    arr.includes(id) ? arr.filter((s) => s !== id) : [...arr, id];

  const canProceed = useCallback((): boolean => {
    switch (step) {
      case 'welcome':
        return true;
      case 'brand':
        return brand.name.trim().length > 0;
      case 'product':
        return product.categories.length > 0;
      case 'style':
        return selectedStyles.length > 0;
      case 'platform':
        return selectedPlatforms.length > 0;
      case 'plan':
        return true;
      default:
        return false;
    }
  }, [step, brand, product, selectedStyles, selectedPlatforms]);

  const handleNext = () => {
    if (currentIndex < STEPS.length - 1) {
      setDirection(1);
      setStep(STEPS[currentIndex + 1]);
    }
  };

  const handlePlanSelect = async (planId: string) => {
    // Enterprise plan → contact page
    if (planId === 'enterprise') {
      router.push('/contact');
      return;
    }

    setCheckoutLoading(planId);
    setCheckoutError(null);

    try {
      const onboardingData = {
        brand,
        product,
        styles: selectedStyles,
        platforms: selectedPlatforms,
      };

      // Persist to localStorage in case user navigates back
      localStorage.setItem('seisei_onboarding', JSON.stringify(onboardingData));

      // If user is already authenticated, save onboarding data to their
      // profile immediately so it persists even if the Stripe webhook
      // or fallback fails to update the profile later.
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({
          brand_name: brand.name || null,
          website: brand.website || null,
          description: brand.description || null,
          categories: product.categories,
          target_audience: product.targetAudience,
          price_range: product.priceRange || null,
          monthly_volume: product.monthlyVolume || null,
          styles: selectedStyles,
          platforms: selectedPlatforms,
          updated_at: new Date().toISOString(),
        }).eq('id', user.id);
      }

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, billingInterval, onboardingData }),
      });

      const data = await response.json();

      if (data.sessionUrl) {
        // Redirect to Stripe Checkout
        window.location.href = data.sessionUrl;
      } else if (data.redirectUrl) {
        router.push(data.redirectUrl);
      } else {
        throw new Error(data.error || 'チェックアウトの作成に失敗しました');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setCheckoutError(err instanceof Error ? err.message : 'エラーが発生しました');
      setCheckoutLoading(null);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setStep(STEPS[currentIndex - 1]);
    }
  };

  /* ---- Render ---- */

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">

      {/* ============================================ */}
      {/* Welcome Screen (full-page overlay)            */}
      {/* ============================================ */}
      <AnimatePresence>
        {step === 'welcome' && (
          <motion.div
            key="welcome-overlay"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          >
            {/* Ambient glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(168,85,247,0.15)_0%,_transparent_60%)]" />

            <div className="relative text-center px-6">
              {/* Logo breathing animation */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="mb-8"
              >
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10"
                >
                  <Sparkles className="w-8 h-8 text-white" />
                </motion.div>
              </motion.div>

              {/* Brand name */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.7, ease }}
                className="text-4xl sm:text-5xl font-black text-white tracking-tighter mb-4"
              >
                生成
              </motion.h1>

              {/* Manifesto text */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.7, ease }}
                className="text-white/40 text-sm sm:text-base leading-relaxed max-w-md mx-auto"
              >
                あなたのブランドイメージを、<br />
                AIの力で再定義します。
              </motion.p>

              {/* Subtle loading indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.5 }}
                className="mt-10"
              >
                <motion.div
                  className="w-12 h-[2px] bg-white/20 rounded-full mx-auto overflow-hidden"
                >
                  <motion.div
                    className="h-full bg-white/60 rounded-full"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="px-8 py-6 border-b border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="font-bold text-xl tracking-tighter">生成</div>
          <div className="text-sm text-gray-400">
            {step === 'welcome' ? '' : `Step ${currentIndex} / ${STEPS.length - 1}`}
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="w-full h-[2px] bg-gray-100">
        <motion.div
          className="h-full bg-black"
          initial={false}
          animate={{ width: `${(Math.max(0, currentIndex) / (STEPS.length - 1)) * 100}%` }}
          transition={{ duration: 0.5, ease }}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center py-12 px-4 overflow-hidden">
        <div className="max-w-3xl w-full">
          <AnimatePresence mode="wait" custom={direction}>
            {/* ============================================ */}
            {/* Step 1: Brand Profile                        */}
            {/* ============================================ */}
            {step === 'brand' && (
              <motion.div
                key="brand"
                custom={direction}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-8"
              >
                <div className="text-center space-y-2 mb-10">
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }}
                    className="inline-flex items-center justify-center w-12 h-12 bg-black text-white rounded-full mb-4"
                  >
                    <Building2 className="w-5 h-5" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-gray-900">ブランドについて教えてください</h2>
                  <p className="text-gray-500 text-sm">基本情報をもとに、最適なAI生成設定を行います</p>
                </div>

                <motion.div variants={staggerContainer} initial="enter" animate="center" className="space-y-5">
                  {/* Brand Name */}
                  <motion.div variants={staggerItem}>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      ブランド名 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={brand.name}
                      onChange={(e) => setBrand({ ...brand, name: e.target.value })}
                      placeholder="例：MAISON TOKYO"
                      className="w-full h-12 px-4 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors placeholder:text-gray-300"
                    />
                  </motion.div>

                  {/* Website */}
                  <motion.div variants={staggerItem}>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      ウェブサイト
                    </label>
                    <div className="relative">
                      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                      <input
                        type="url"
                        value={brand.website}
                        onChange={(e) => setBrand({ ...brand, website: e.target.value })}
                        placeholder="https://example.com"
                        className="w-full h-12 pl-11 pr-4 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors placeholder:text-gray-300"
                      />
                    </div>
                  </motion.div>

                  {/* Description */}
                  <motion.div variants={staggerItem}>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      ブランドの説明
                    </label>
                    <textarea
                      value={brand.description}
                      onChange={(e) => setBrand({ ...brand, description: e.target.value })}
                      placeholder="ブランドのコンセプトや世界観を簡単に教えてください"
                      rows={3}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors resize-none placeholder:text-gray-300"
                    />
                  </motion.div>
                </motion.div>
              </motion.div>
            )}

            {/* ============================================ */}
            {/* Step 2: Products & Audience                   */}
            {/* ============================================ */}
            {step === 'product' && (
              <motion.div
                key="product"
                custom={direction}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-8"
              >
                <div className="text-center space-y-2 mb-10">
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }}
                    className="inline-flex items-center justify-center w-12 h-12 bg-black text-white rounded-full mb-4"
                  >
                    <Tag className="w-5 h-5" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-gray-900">商品とターゲットについて</h2>
                  <p className="text-gray-500 text-sm">取り扱い商品に合わせたモデルとシーンを提案します</p>
                </div>

                <motion.div variants={staggerContainer} initial="enter" animate="center" className="space-y-8">
                  {/* Categories */}
                  <motion.div variants={staggerItem}>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                      主な商品カテゴリ <span className="text-red-400">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setProduct({ ...product, categories: toggle(product.categories, c.id) })}
                          className={`px-4 py-2 text-sm rounded-full border transition-all duration-200 ${
                            product.categories.includes(c.id)
                              ? 'border-black bg-black text-white'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Target Audience */}
                  <motion.div variants={staggerItem}>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                      ターゲット層
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {audiences.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => setProduct({ ...product, targetAudience: toggle(product.targetAudience, a.id) })}
                          className={`px-4 py-2 text-sm rounded-full border transition-all duration-200 ${
                            product.targetAudience.includes(a.id)
                              ? 'border-black bg-black text-white'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
                          }`}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Price Range */}
                  <motion.div variants={staggerItem}>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                      価格帯
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {priceRanges.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setProduct({ ...product, priceRange: p.id })}
                          className={`p-4 text-center border rounded-lg transition-all duration-200 ${
                            product.priceRange === p.id
                              ? 'border-black bg-black text-white'
                              : 'border-gray-200 bg-white hover:border-gray-400'
                          }`}
                        >
                          <div className="text-sm font-medium">{p.label}</div>
                          <div className={`text-xs mt-1 ${product.priceRange === p.id ? 'text-gray-300' : 'text-gray-400'}`}>
                            {p.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Monthly Volume */}
                  <motion.div variants={staggerItem}>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                      月間撮影ボリューム目安
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {volumes.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setProduct({ ...product, monthlyVolume: v.id })}
                          className={`p-3 text-center text-sm border rounded-lg transition-all duration-200 ${
                            product.monthlyVolume === v.id
                              ? 'border-black bg-black text-white'
                              : 'border-gray-200 bg-white hover:border-gray-400'
                          }`}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}

            {/* ============================================ */}
            {/* Step 3: Style Selection (with visual previews) */}
            {/* ============================================ */}
            {step === 'style' && (
              <motion.div
                key="style"
                custom={direction}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-8"
              >
                {/* Background image preview — fades when style is hovered/selected */}
                <AnimatePresence mode="wait">
                  {activePreviewStyle && styleImages[activePreviewStyle] && (
                    <motion.div
                      key={activePreviewStyle}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="fixed inset-0 z-0 pointer-events-none"
                    >
                      <Image
                        src={styleImages[activePreviewStyle]}
                        alt=""
                        fill
                        className="object-cover"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-gray-50/90 via-gray-50/70 to-gray-50/95" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="text-center space-y-2 mb-10 relative z-10">
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }}
                    className="inline-flex items-center justify-center w-12 h-12 bg-black text-white rounded-full mb-4"
                  >
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-gray-900">ブランドのスタイルを選択</h2>
                  <p className="text-gray-500 text-sm">AIが生成する画像のトーン＆マナーを決定します（複数選択可）</p>
                </div>

                <motion.div
                  variants={staggerContainer}
                  initial="enter"
                  animate="center"
                  className="grid grid-cols-2 md:grid-cols-3 gap-4 relative z-10"
                >
                  {styles.map((s) => {
                    const isSelected = selectedStyles.includes(s.id);
                    return (
                      <motion.button
                        key={s.id}
                        variants={staggerItem}
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSelectedStyles(toggle(selectedStyles, s.id))}
                        onMouseEnter={() => setPreviewStyle(s.id)}
                        onMouseLeave={() => setPreviewStyle(null)}
                        className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 group ${
                          isSelected
                            ? 'border-black ring-2 ring-black/10'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {/* Style preview image */}
                        <div className="relative aspect-[3/4] overflow-hidden">
                          <Image
                            src={styleImages[s.id]}
                            alt={s.label}
                            fill
                            className={`object-cover transition-transform duration-500 ${
                              isSelected ? 'scale-105' : 'group-hover:scale-105'
                            }`}
                          />
                          {/* Dark overlay */}
                          <div className={`absolute inset-0 transition-colors duration-300 ${
                            isSelected
                              ? 'bg-black/40'
                              : 'bg-black/20 group-hover:bg-black/30'
                          }`} />

                          {/* Selected check badge */}
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-3 right-3 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg"
                            >
                              <Check className="w-4 h-4 text-black" />
                            </motion.div>
                          )}

                          {/* Label overlay at bottom */}
                          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                            <p className="text-white text-base font-bold">{s.label}</p>
                            <p className="text-white/60 text-xs">{s.desc}</p>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </motion.div>
              </motion.div>
            )}

            {/* ============================================ */}
            {/* Step 4: Platform Selection                    */}
            {/* ============================================ */}
            {step === 'platform' && (
              <motion.div
                key="platform"
                custom={direction}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-8"
              >
                <div className="text-center space-y-2 mb-10">
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }}
                    className="inline-flex items-center justify-center w-12 h-12 bg-black text-white rounded-full mb-4"
                  >
                    <Globe className="w-5 h-5" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-gray-900">展開プラットフォーム</h2>
                  <p className="text-gray-500 text-sm">画像サイズや構図を最適化します（複数選択可）</p>
                </div>

                <motion.div
                  variants={staggerContainer}
                  initial="enter"
                  animate="center"
                  className="grid grid-cols-2 md:grid-cols-3 gap-4"
                >
                  {platforms.map((p) => {
                    const Icon = p.icon;
                    const isSelected = selectedPlatforms.includes(p.id);
                    return (
                      <motion.button
                        key={p.id}
                        variants={staggerItem}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSelectedPlatforms(toggle(selectedPlatforms, p.id))}
                        className={`p-6 flex flex-col items-center justify-center gap-3 border rounded-lg transition-colors duration-200 ${
                          isSelected
                            ? 'border-black bg-gray-50 ring-1 ring-black'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`w-6 h-6 ${isSelected ? 'text-black' : 'text-gray-400'}`} />
                        <span className="font-medium text-sm">{p.label}</span>
                        {isSelected && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <Check className="w-4 h-4 text-black" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </motion.div>
              </motion.div>
            )}

            {/* ============================================ */}
            {/* Step 5: Plan Selection                        */}
            {/* ============================================ */}
            {step === 'plan' && (
              <motion.div
                key="plan"
                custom={direction}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-8"
              >
                <div className="text-center space-y-2 mb-10">
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }}
                    className="inline-flex items-center justify-center w-12 h-12 bg-black text-white rounded-full mb-4"
                  >
                    <Users className="w-5 h-5" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-gray-900">プランの選択</h2>
                  <p className="text-gray-500 text-sm">ビジネス規模に合わせた最適なプランをお選びください</p>
                </div>

                {/* Billing interval toggle */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setBillingInterval('month')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      billingInterval === 'month'
                        ? 'bg-black text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    月額
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingInterval('year')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      billingInterval === 'year'
                        ? 'bg-black text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    年額
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      billingInterval === 'year'
                        ? 'bg-green-400 text-green-950'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      20%OFF
                    </span>
                  </button>
                </div>

                {/* Plan cards – 4 columns */}
                <motion.div
                  variants={staggerContainer}
                  initial="enter"
                  animate="center"
                  className="grid grid-cols-1 md:grid-cols-4 gap-5"
                >
                  {plans.map((plan) => {
                    const Icon = plan.icon;
                    const isFreePlan = plan.id === 'free';
                    const price = billingInterval === 'year' ? plan.yearlyPrice : plan.monthlyPrice;
                    const formattedPrice = isFreePlan ? '¥0' : `¥${price.toLocaleString()}`;
                    const period = isFreePlan ? '' : (billingInterval === 'year' ? '/年' : '/月');
                    const monthlyEquivalent = !isFreePlan && billingInterval === 'year'
                      ? `月あたり ¥${Math.round(plan.yearlyPrice / 12).toLocaleString()}`
                      : null;

                    return (
                      <motion.div
                        key={plan.id}
                        variants={staggerItem}
                        whileHover={{ y: -6, transition: { duration: 0.2 } }}
                        className={`relative rounded-2xl border-2 flex flex-col overflow-hidden transition-shadow duration-300 ${
                          plan.recommended
                            ? 'border-black shadow-xl bg-white'
                            : 'border-gray-200 bg-white hover:shadow-lg hover:border-gray-300'
                        }`}
                      >
                        {/* Recommended badge */}
                        {plan.recommended && (
                          <div className="bg-black text-white text-xs font-bold text-center py-1.5 tracking-wide">
                            {isFreePlan ? 'おすすめ' : '一番人気'}
                          </div>
                        )}

                        <div className="p-6 flex flex-col flex-1">
                          {/* Plan header */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              plan.recommended
                                ? 'bg-black text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                              <p className="text-xs text-gray-400">{plan.description}</p>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="mb-6">
                            <div className="flex items-baseline gap-1">
                              <span className="text-4xl font-extrabold tracking-tight text-gray-900">
                                {formattedPrice}
                              </span>
                              {period && <span className="text-sm text-gray-400 font-medium">{period}</span>}
                            </div>
                            {isFreePlan && (
                              <p className="text-xs text-gray-500 mt-1">3日間無料 → その後 ¥5,000/月</p>
                            )}
                            {monthlyEquivalent && (
                              <p className="text-xs text-green-600 font-medium mt-1">{monthlyEquivalent}</p>
                            )}
                          </div>

                          {/* Divider */}
                          <div className="h-px bg-gray-100 mb-5" />

                          {/* Features */}
                          <ul className="space-y-3 mb-8 flex-1">
                            {plan.features.map((f, i) => (
                              <li key={i} className="flex items-center gap-2.5 text-sm">
                                {f.included ? (
                                  <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                                    <Check className="w-3 h-3 text-green-600" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                                    <span className="block w-2 h-px bg-gray-300" />
                                  </div>
                                )}
                                <span className={f.included ? 'text-gray-700' : 'text-gray-300'}>
                                  {f.text}
                                </span>
                              </li>
                            ))}
                          </ul>

                          {/* CTA */}
                          <button
                            onClick={() => handlePlanSelect(plan.id)}
                            disabled={checkoutLoading !== null}
                            className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                              plan.recommended
                                ? 'bg-black text-white hover:bg-gray-800 shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/15'
                                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                            }`}
                          >
                            {checkoutLoading === plan.id ? (
                              <span className="inline-flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                処理中...
                              </span>
                            ) : (
                              isFreePlan ? '無料で始める' : '選択する'
                            )}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>

                {/* Enterprise CTA banner */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5, ease }}
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 mt-4"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(168,85,247,0.15)_0%,_transparent_60%)]" />
                  <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">エンタープライズ</h3>
                        <p className="text-sm text-gray-400 mt-0.5">
                          カスタム生成数・専属マネージャー・カスタムモデル・API連携
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePlanSelect('enterprise')}
                      className="flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors whitespace-nowrap"
                    >
                      <MessageSquare className="w-4 h-4" />
                      お問い合わせ
                    </button>
                  </div>
                </motion.div>

                {/* Checkout Error */}
                {checkoutError && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center"
                  >
                    {checkoutError}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Navigation */}
          <motion.div
            layout
            className="flex justify-between pt-8 border-t border-gray-100 mt-10"
          >
            {currentIndex > 0 ? (
              <button
                onClick={handleBack}
                className="flex items-center text-gray-500 hover:text-black transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                戻る
              </button>
            ) : (
              <div />
            )}

            {step !== 'plan' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-black text-white px-8 py-3 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
              >
                次へ
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default function Onboarding() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  );
}
