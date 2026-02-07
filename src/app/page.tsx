import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Zap, Shield, ImageIcon } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tighter">生成</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
            >
              ログイン
            </Link>
            <Link
              href="/signup"
              className="bg-black text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              無料で始める
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-full">
              <Zap className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">AIでファッション撮影を革新</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
              商品画像から<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                着用イメージを瞬時に生成
              </span>
            </h1>

            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              モデル撮影なしで、プロ品質のファッション画像を生成。
              撮影コストを90%削減し、EC売上を最大化します。
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-black text-white h-14 px-8 rounded-xl text-base font-bold hover:bg-gray-800 transition-all shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20"
              >
                無料で始める
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-gray-900 h-14 px-8 rounded-xl text-base font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                ログイン
              </Link>
            </div>

            <p className="text-sm text-gray-400">
              クレジットカード不要 · 10枚まで無料
            </p>
          </div>

          {/* Features */}
          <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: ImageIcon,
                title: 'バーチャル試着',
                description: '商品画像をアップロードするだけで、AIモデルが着用した高品質な画像を生成',
              },
              {
                icon: Zap,
                title: '瞬時に生成',
                description: '従来の撮影に比べ、数秒で高品質なファッション画像を大量生成',
              },
              {
                icon: Shield,
                title: '商用利用OK',
                description: '生成された画像は完全な商用利用が可能。EC・SNS・広告に利用可能',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-gray-900" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tighter">生成</span>
          </div>
          <p className="text-sm text-gray-400">
            © 2026 Seisei AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
