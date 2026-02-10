"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Upload, Users, Sparkles, TrendingUp, Clock, DollarSign, Images, Shield, Check, Zap } from 'lucide-react';

const ease = [0.25, 0.1, 0.25, 1] as const;

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease },
});

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.5, delay, ease },
});

// Brand names for notifications
const brandNames = [
  'ユニクロ', 'ZARA', 'GU', 'しまむら', 'SHEIN',
  'H&M', 'Forever21', 'WEGO', 'SPINNS', 'BEAMS',
  '古着屋JAM', 'セカンドストリート', 'メルカリショップス', 'ヤフオク出品者'
];

// Activity types
const activities = [
  '画像を生成しました',
  'モデル着用画像を作成しました',
  'プロ級写真を生成しました',
  '商品画像をアップロードしました'
];

export default function LandingPage() {
  const [notification, setNotification] = useState<{ brand: string; activity: string } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const showNotification = () => {
      const randomBrand = brandNames[Math.floor(Math.random() * brandNames.length)];
      const randomActivity = activities[Math.floor(Math.random() * activities.length)];

      setNotification({ brand: randomBrand, activity: randomActivity });
      setIsVisible(true);

      setTimeout(() => {
        setIsVisible(false);
      }, 4000);
    };

    // Show first notification after 3 seconds
    const initialTimeout = setTimeout(showNotification, 3000);

    // Then show notifications every 8-12 seconds
    const interval = setInterval(() => {
      showNotification();
    }, 8000 + Math.random() * 4000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Live Activity Notification */}
      <AnimatePresence>
        {isVisible && notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3, ease }}
            className="fixed bottom-6 left-6 z-50 bg-white border-2 border-violet-200 rounded-xl shadow-2xl p-4 max-w-sm"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{notification.brand}</p>
                <p className="text-xs text-gray-500 mt-0.5">{notification.activity}</p>
                <p className="text-[10px] text-gray-400 mt-1">たった今</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1 animate-pulse" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tighter text-gray-900">生成</span>
            <span className="text-xs text-gray-400 ml-1">SEISEI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
              ログイン
            </Link>
            <Link
              href="/onboarding"
              className="bg-black text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors"
            >
              今すぐ始める
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 bg-gradient-to-b from-violet-50/30 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <motion.div {...fadeUp(0.1)} className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-100 to-fuchsia-100 border border-violet-200 px-4 py-1.5 rounded-full mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
              </span>
              <span className="text-xs font-semibold text-violet-700">Seisei AI搭載</span>
            </motion.div>

            <motion.h1 {...fadeUp(0.25)} className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-gray-900 leading-tight mb-6">
              メルカリで<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-fuchsia-600">早く・高く</span>売るなら、<br />
              AIプロモデル着用写真を<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-fuchsia-600">20秒</span>で。
            </motion.h1>

            <motion.p {...fadeUp(0.4)} className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed">
              スマホで商品を撮るだけ。<br className="sm:hidden" />素人写真をプロ級のモデル着画に自動変換。<br />
              撮影もモデルもスタジオも不要です。
            </motion.p>

            <motion.div {...fadeUp(0.55)} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link
                href="/onboarding"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-black text-white h-12 px-8 rounded-xl text-base font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl"
              >
                今すぐ無料で試す
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>

            <motion.div {...fadeIn(0.7)} className="flex items-center justify-center gap-6 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Check className="w-4 h-4 text-emerald-500" />
                商用OK
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-4 h-4 text-emerald-500" />
                日本語完全対応
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-4 h-4 text-emerald-500" />
                高品質生成
              </span>
            </motion.div>
          </div>

          {/* Before/After Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease }}
            className="max-w-5xl mx-auto"
          >
            <div className="grid md:grid-cols-2 gap-6 items-center">
              {/* Before */}
              <div className="relative group">
                <div className="absolute -top-3 left-4 z-20 bg-white rounded-full shadow-md">
                  <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full border border-red-200">
                    ❌ ビフォー（素人撮影）
                  </span>
                </div>
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-gray-200 shadow-lg">
                  <Image src="/landing/before-amateur.webp" alt="素人写真の例" fill className="object-cover" />
                </div>
                <p className="text-center text-sm text-gray-500 mt-3">生活感・シワ・暗い照明…</p>
              </div>

              {/* After */}
              <div className="relative group">
                <div className="absolute -top-3 left-4 z-20 bg-white rounded-full shadow-md">
                  <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    ✨ アフター（AI生成）
                  </span>
                </div>
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-violet-200 shadow-xl ring-2 ring-violet-100">
                  <Image src="/landing/after-professional.webp" alt="AI生成プロモデル写真" fill className="object-cover" />
                </div>
                <p className="text-center text-sm font-semibold text-violet-600 mt-3">プロ級・清潔感・高級感！</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Users,
                number: '12,547',
                label: '登録ユーザー数',
                color: 'text-violet-600',
              },
              {
                icon: Images,
                number: '248,392',
                label: '生成された画像数',
                color: 'text-fuchsia-600',
              },
              {
                icon: Sparkles,
                number: '3,891',
                label: 'AIモデル数',
                color: 'text-blue-600',
              },
              {
                icon: Zap,
                number: '98.7%',
                label: '顧客満足度',
                color: 'text-emerald-600',
              },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease }}
                className="text-center"
              >
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
                <motion.p
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 + 0.2, ease }}
                  className={`text-3xl sm:text-4xl font-black ${stat.color} mb-1`}
                >
                  {stat.number}
                </motion.p>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
              メルカリ出品でこんな<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-fuchsia-600">お悩み</span>ありませんか？
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6 mb-12">
            {[
              { icon: '😞', text: 'スマホで撮った素人写真だと全然売れない…' },
              { icon: '💸', text: 'モデルに着せてみたいけど、お金も時間もない' },
              { icon: '🏠', text: '背景が生活感出てしまって、安っぽく見える' },
              { icon: '📉', text: '結局値下げせざるを得ない…' },
            ].map((problem, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease }}
                className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{problem.icon}</span>
                  <p className="text-gray-700 leading-relaxed">{problem.text}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white p-8 rounded-2xl shadow-xl"
          >
            <h3 className="text-2xl font-bold mb-4">✨ 生成（Seisei）なら解決！</h3>
            <p className="text-lg leading-relaxed opacity-95">
              あなたの商品写真をアップロードするだけで、<br />
              日本人らしい自然なプロモデルが着用した高品質画像を瞬時に生成。<br />
              売れやすい清潔感・高級感のある写真が手に入ります。
            </p>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
              使い方は<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-fuchsia-600">3ステップ</span>だけ
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Upload,
                step: '1',
                title: '商品写真をアップロード',
                description: '服、バッグ、靴など何でもOK。スマホ写真でも大丈夫。',
                color: 'bg-blue-50 text-blue-600 border-blue-200',
              },
              {
                icon: Users,
                step: '2',
                title: 'モデルを選ぶ',
                description: '日本人女性・男性・複数体型・年齢層から選択。',
                color: 'bg-violet-50 text-violet-600 border-violet-200',
              },
              {
                icon: Sparkles,
                step: '3',
                title: '生成ボタンを押すだけ',
                description: '20〜90秒で完成！すぐにメルカリに使える高解像度画像。',
                color: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15, ease }}
                className="relative bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 border-2 ${item.color}`}>
                  <item.icon className="w-7 h-7" />
                </div>
                <div className="absolute top-4 right-4 text-6xl font-black text-gray-100">{item.step}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5, ease }}
            className="text-center mt-12"
          >
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 bg-black text-white h-12 px-8 rounded-xl text-base font-bold hover:bg-gray-800 transition-all shadow-lg"
            >
              いますぐ始めて、今日の出品を変えよう
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">
              なぜ<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-fuchsia-600">生成</span>を選ぶのか？
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: TrendingUp,
                title: '売れ行きUP',
                description: 'プロ着画でクリック率・購入率が大幅改善。多くの出品者が実感しています。',
                accent: 'bg-emerald-50 text-emerald-600 border-emerald-200',
              },
              {
                icon: Clock,
                title: '時間ゼロ',
                description: '撮影セット・照明・モデル不要。家で全て完結できます。',
                accent: 'bg-blue-50 text-blue-600 border-blue-200',
              },
              {
                icon: DollarSign,
                title: '高く売れる',
                description: '清潔感・おしゃれ感で価格を下げずに済みます。',
                accent: 'bg-violet-50 text-violet-600 border-violet-200',
              },
              {
                icon: Images,
                title: '複数枚簡単',
                description: '同じ商品で角度違い・背景違いを大量生成可能。',
                accent: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200',
              },
              {
                icon: Shield,
                title: '安心の品質',
                description: 'Seisei AI + 日本向けチューニングで自然な仕上がり。',
                accent: 'bg-amber-50 text-amber-600 border-amber-200',
              },
              {
                icon: Sparkles,
                title: '商用利用OK',
                description: '生成した画像は完全に商用利用可能。メルカリ・ヤフオクで自由に使えます。',
                accent: 'bg-pink-50 text-pink-600 border-pink-200',
              },
            ].map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease }}
                whileHover={{ y: -4 }}
                className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all"
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 border-2 ${benefit.accent}`}>
                  <benefit.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
              実際の<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-fuchsia-600">生成例</span>
            </h2>
            <p className="text-gray-500">全てAIが生成したプロモデル着用写真です</p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { src: '/landing/model-dress.webp', alt: 'ワンピース着用例' },
              { src: '/landing/model-bag.webp', alt: 'バッグ着用例' },
              { src: '/landing/model-casual.webp', alt: 'カジュアル着用例' },
              { src: '/landing/model-coat.webp', alt: 'コート着用例' },
            ].map((image, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease }}
                className="relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow group"
              >
                <Image src={image.src} alt={image.alt} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {[
              { src: '/landing/model-sneakers.webp', alt: 'スニーカー着用例' },
              { src: '/landing/model-accessories.webp', alt: 'アクセサリー着用例' },
            ].map((image, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.1, ease }}
                className="relative aspect-[4/3] rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow group"
              >
                <Image src={image.src} alt={image.alt} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
          className="max-w-4xl mx-auto text-center bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white p-12 rounded-3xl shadow-2xl"
        >
          <h2 className="text-3xl sm:text-4xl font-black mb-6">
            今すぐ始めましょう
          </h2>
          <p className="text-lg opacity-95 mb-8 leading-relaxed">
            最先端のAI技術で、プロ品質のファッション画像を瞬時に生成。<br />
            メルカリでの売れ行きを今日から変えましょう。
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 bg-white text-violet-600 h-14 px-10 rounded-xl text-lg font-bold hover:bg-gray-50 transition-all shadow-xl hover:shadow-2xl"
          >
            アカウントを作成
            <ArrowRight className="w-6 h-6" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm font-bold text-gray-900">生成（Seisei）</span>
              <span className="text-xs text-gray-400">by 合同会社はと</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/tokushoho" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
                特定商取引法に基づく表記
              </Link>
              <Link href="/terms" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
                利用規約
              </Link>
            </div>
            <p className="text-xs text-gray-400">© 2026 Seisei.me All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
