"use client";

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Step = 'brand' | 'product' | 'style' | 'platform' | 'plan';

const STEPS: Step[] = ['brand', 'product', 'style', 'platform', 'plan'];

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

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('brand');
  const [direction, setDirection] = useState(1);

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
      id: 'starter',
      name: 'スターター',
      price: '¥5,000',
      period: '/月',
      features: ['月50枚生成', '標準画質', 'メールサポート'],
    },
    {
      id: 'pro',
      name: 'プロフェッショナル',
      price: '¥20,000',
      period: '/月',
      features: ['無制限生成', '4K高画質', '優先サポート', '商用利用完全保証'],
      recommended: true,
    },
    {
      id: 'enterprise',
      name: 'エンタープライズ',
      price: '要相談',
      period: '',
      features: ['API連携', '専属マネージャー', 'カスタムモデル'],
    },
  ];

  /* ---- Helpers ---- */

  const currentIndex = STEPS.indexOf(step);

  const toggle = (arr: string[], id: string) =>
    arr.includes(id) ? arr.filter((s) => s !== id) : [...arr, id];

  const canProceed = useCallback((): boolean => {
    switch (step) {
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
    } else {
      router.push('/dashboard');
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="px-8 py-6 border-b border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="font-bold text-xl tracking-tighter">生成</div>
          <div className="text-sm text-gray-400">
            Step {currentIndex + 1} / {STEPS.length}
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="w-full h-[2px] bg-gray-100">
        <motion.div
          className="h-full bg-black"
          initial={false}
          animate={{ width: `${((currentIndex + 1) / STEPS.length) * 100}%` }}
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
            {/* Step 3: Style Selection                       */}
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
                <div className="text-center space-y-2 mb-10">
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
                  className="grid grid-cols-2 md:grid-cols-3 gap-4"
                >
                  {styles.map((s) => (
                    <motion.button
                      key={s.id}
                      variants={staggerItem}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedStyles(toggle(selectedStyles, s.id))}
                      className={`p-6 text-left border rounded-lg transition-colors duration-200 ${
                        selectedStyles.includes(s.id)
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 bg-white hover:border-black'
                      }`}
                    >
                      <div className="text-lg font-medium mb-1">{s.label}</div>
                      <div className={`text-xs ${selectedStyles.includes(s.id) ? 'text-gray-300' : 'text-gray-500'}`}>
                        {s.desc}
                      </div>
                      {selectedStyles.includes(s.id) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="mt-3"
                        >
                          <Check className="w-4 h-4" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
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

                <motion.div
                  variants={staggerContainer}
                  initial="enter"
                  animate="center"
                  className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                  {plans.map((plan) => (
                    <motion.div
                      key={plan.id}
                      variants={staggerItem}
                      whileHover={{ y: -4 }}
                      className={`relative p-6 rounded-xl border flex flex-col transition-shadow duration-300 ${
                        plan.recommended
                          ? 'border-black shadow-lg bg-white scale-105 z-10'
                          : 'border-gray-200 bg-gray-50 text-gray-500 hover:shadow-md'
                      }`}
                    >
                      {plan.recommended && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                          className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-3 py-1 rounded-full"
                        >
                          おすすめ
                        </motion.div>
                      )}
                      <h3 className="text-lg font-bold mb-2">{plan.name}</h3>
                      <div className="mb-6">
                        <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                        <span className="text-sm">{plan.period}</span>
                      </div>
                      <ul className="space-y-3 mb-8 flex-1">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-center text-sm">
                            <Check className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={handleNext}
                        className={`w-full py-3 rounded-lg text-sm font-bold transition-colors ${
                          plan.recommended
                            ? 'bg-black text-white hover:bg-gray-800'
                            : 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        選択する
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
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
