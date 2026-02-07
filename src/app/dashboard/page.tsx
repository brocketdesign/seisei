import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Image as ImageIcon,
  Users,
  Megaphone,
  ArrowUpRight,
  Sparkles,
  Crown,
} from 'lucide-react';

const latestCreations = [
  { src: '/models/yuki.jpg', model: 'Yuki', campaign: '春コレクション', time: '2時間前' },
  { src: '/models/aoi.jpg', model: 'Aoi', campaign: 'デニムライン', time: '5時間前' },
  { src: '/models/hana.jpg', model: 'Hana', campaign: 'バレンタイン特集', time: '1日前' },
  { src: '/models/rina.jpg', model: 'Rina', campaign: 'ストリート SS26', time: '2日前' },
];

export default function Dashboard() {
  return (
    <>
      <header className="mb-6">
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">ダッシュボード</h2>
        <p className="text-gray-400 text-sm mt-1">クリエイティブスタジオの概要</p>
      </header>

      {/* Stats Row — 3 metric cards + 1 "Top Model" visual card */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '今月の生成枚数', value: '142', icon: ImageIcon, accent: 'bg-violet-50 text-violet-600' },
          { label: '登録モデル数', value: '3', icon: Users, accent: 'bg-sky-50 text-sky-600' },
          { label: 'キャンペーン (実施中)', value: '2', icon: Megaphone, accent: 'bg-amber-50 text-amber-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-gray-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.accent}`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{stat.label}</p>
            </div>
            <p className="text-3xl font-black text-gray-900 tracking-tight">{stat.value}</p>
          </div>
        ))}

        {/* Top Model of the Week — Hero Card */}
        <div className="relative bg-black rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)] group">
          <Image
            src="/models/yuki.jpg"
            alt="Yuki — 今週のトップモデル"
            fill
            className="object-cover opacity-70 group-hover:opacity-80 transition-opacity"
          />
          <div className="relative z-10 p-5 flex flex-col justify-end h-full">
            <div className="flex items-center gap-1.5 mb-1">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">今週のトップモデル</span>
            </div>
            <p className="text-white text-lg font-black tracking-tight">Yuki</p>
            <p className="text-white/60 text-[11px]">48枚生成 · 32.1K 表示</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: '画像を生成する', desc: '商品写真からモデル着用イメージを作成', href: '/dashboard/generate', icon: Sparkles },
          { label: 'モデルを管理する', desc: '専属モデルの登録・編集', href: '/dashboard/models', icon: Users },
          { label: 'キャンペーンを作成', desc: '新しいキャンペーンを立ち上げる', href: '/dashboard/campaigns', icon: Megaphone },
        ].map((action, i) => (
          <Link
            key={i}
            href={action.href}
            className="group bg-white p-5 rounded-xl border border-gray-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-gray-300 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center mt-0.5 group-hover:bg-black group-hover:text-white transition-colors">
                  <action.icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm group-hover:text-black">{action.label}</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{action.desc}</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-200 group-hover:text-black transition-colors flex-shrink-0" />
            </div>
          </Link>
        ))}
      </div>

      {/* Latest Creations Gallery */}
      <div className="bg-white rounded-xl border border-gray-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gray-400" />
            <h3 className="font-extrabold text-gray-900 text-sm tracking-tight">最新の生成作品</h3>
          </div>
          <Link
            href="/dashboard/generate"
            className="text-[11px] font-semibold text-gray-400 hover:text-black transition-colors flex items-center gap-1"
          >
            すべて表示 <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {latestCreations.map((item, i) => (
            <div key={i} className="group relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 cursor-pointer">
              <Image
                src={item.src}
                alt={`${item.model} — ${item.campaign}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {/* Info on hover */}
              <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <p className="text-white text-xs font-bold">{item.model}</p>
                <p className="text-white/70 text-[10px]">{item.campaign} · {item.time}</p>
              </div>
              {/* Subtle label always visible */}
              <div className="absolute top-2 left-2">
                <span className="bg-white/90 backdrop-blur-sm text-[9px] font-bold text-gray-700 px-1.5 py-0.5 rounded">
                  {item.model}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
