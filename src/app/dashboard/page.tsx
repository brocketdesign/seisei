import React from 'react';
import Link from 'next/link';
import {
  Image as ImageIcon,
  Users,
  Megaphone,
  BarChart3,
  ArrowUpRight,
} from 'lucide-react';

export default function Dashboard() {
  return (
    <>
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">ダッシュボード</h2>
        <p className="text-gray-500 text-sm mt-1">生成状況とアクティビティの概要を確認します。</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {[
          { label: '今月の生成枚数', value: '142', icon: ImageIcon },
          { label: '登録モデル数', value: '3', icon: Users },
          { label: 'キャンペーン (実施中)', value: '2', icon: Megaphone },
          { label: '合計インプレッション', value: '66.2K', icon: BarChart3 },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-gray-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {[
          { label: '画像を生成する', desc: '商品写真からモデル着用イメージを作成', href: '/dashboard/generate' },
          { label: 'モデルを管理する', desc: '専属モデルの登録・編集', href: '/dashboard/models' },
          { label: 'キャンペーンを作成', desc: '新しいキャンペーンを立ち上げる', href: '/dashboard/campaigns' },
        ].map((action, i) => (
          <Link
            key={i}
            href={action.href}
            className="group bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-gray-900 group-hover:text-black">{action.label}</h3>
                <p className="text-xs text-gray-500 mt-1">{action.desc}</p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-300 group-hover:text-black transition-colors" />
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 text-sm mb-4">最近のアクティビティ</h3>
        <div className="space-y-4">
          {[
            { text: '春コレクション用画像を5枚生成しました', time: '2時間前' },
            { text: 'モデル「Yuki」の設定を更新しました', time: '5時間前' },
            { text: 'バレンタイン特集キャンペーンを開始しました', time: '1日前' },
            { text: '新作デニムライン用画像を12枚生成しました', time: '2日前' },
          ].map((activity, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
              <p className="text-sm text-gray-700">{activity.text}</p>
              <span className="text-xs text-gray-400 flex-shrink-0 ml-4">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
