'use client'

import { Images, Rocket, Users, ShoppingBag, Upload, Sparkles, Check, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

const features = [
  {
    icon: Images,
    badge: '無料',
    title: '10枚の画像',
    titleHighlight: '無料で生成',
    description: '登録するだけでAI生成画像が10枚無料。すぐに始められます。',
    highlights: ['3日間無料トライアル', 'すぐに利用可能', '高品質な画像'],
  },
  {
    icon: Rocket,
    badge: '今すぐ開始',
    title: '無料で',
    titleHighlight: 'スタート',
    description: '初期費用ゼロ。今日からプロ品質の商品写真を作成しましょう。',
    highlights: ['初期費用ゼロ', '全機能利用可能', 'いつでも解約OK'],
  },
  {
    icon: Users,
    badge: 'AI搭載',
    title: 'モデルを',
    titleHighlight: '生成',
    description: 'リアルなAIファッションモデルが商品を着用した画像を数秒で作成。',
    highlights: ['多様なモデル', 'リアルなポーズ', 'スタイル自由'],
  },
  {
    icon: ShoppingBag,
    badge: 'クリエイティブ',
    title: '商品画像を',
    titleHighlight: '生成',
    description: 'シンプルな写真をプロ品質の商品画像に変換します。',
    highlights: ['プロ品質', '複数アングル', '背景除去'],
  },
  {
    icon: Upload,
    badge: '簡単',
    title: '商品を',
    titleHighlight: 'インポート',
    description: '既存の商品カタログをアップロードして、AIで一瞬で強化。',
    highlights: ['一括アップロード', '自動補正', 'ワンクリック'],
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
}

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">生成</span>
            <span className="text-xs text-gray-400 tracking-widest">SEISEI</span>
          </div>
          <span className="text-sm text-gray-500">機能紹介</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-sm text-gray-600 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-violet-500" />
              AI搭載
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              売上アップに必要な
              <br />
              <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
                すべてがここに
              </span>
            </h1>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              AIで商品写真をプロ品質に変える、すべてのツール
            </p>
          </motion.div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title + feature.titleHighlight}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="group"
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-200 p-6 sm:p-5 lg:p-6 flex flex-col transition-all duration-300 group-hover:border-gray-300 group-hover:shadow-lg">
                  {/* Badge + Icon Row */}
                  <div className="flex items-center justify-between mb-auto">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-black text-white text-xs font-medium">
                      {feature.badge}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                      <feature.icon className="w-4 h-4 text-gray-700" />
                    </div>
                  </div>

                  {/* Title */}
                  <div className="mb-2">
                    <h2 className="text-3xl sm:text-2xl lg:text-3xl font-bold tracking-tight leading-none text-black">
                      {feature.title}
                    </h2>
                    <h2 className="text-3xl sm:text-2xl lg:text-3xl font-bold tracking-tight leading-none mt-1 bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
                      {feature.titleHighlight}
                    </h2>
                  </div>

                  {/* Description */}
                  <p className="text-gray-500 text-xs lg:text-sm leading-relaxed mb-3">
                    {feature.description}
                  </p>

                  {/* Highlights */}
                  <div className="space-y-1.5 mt-auto">
                    {feature.highlights.map((h) => (
                      <div key={h} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                        <span className="text-sm sm:text-xs lg:text-sm text-gray-700">{h}</span>
                      </div>
                    ))}
                  </div>

                  {/* Bottom arrow */}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-end">
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
