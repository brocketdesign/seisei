"use client";

import React, { useState } from 'react';
import {
  User,
  Bell,
  CreditCard,
  Shield,
  Globe,
  Palette,
  Key,
  ChevronRight,
  Check,
} from 'lucide-react';

type SettingsTab = 'profile' | 'billing' | 'notifications' | 'api';

const tabs = [
  { key: 'profile' as const, label: 'プロフィール', icon: User },
  { key: 'billing' as const, label: '請求・プラン', icon: CreditCard },
  { key: 'notifications' as const, label: '通知設定', icon: Bell },
  { key: 'api' as const, label: 'API連携', icon: Key },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  return (
    <>
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">設定</h2>
        <p className="text-gray-500 text-sm mt-1">アカウントとアプリケーションの設定を管理します。</p>
      </header>

      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        {/* Settings Tabs */}
        <div className="w-full md:w-56 flex-shrink-0">
          <nav className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-black text-white font-medium shadow-md shadow-black/10'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-black'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'billing' && <BillingSettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'api' && <ApiSettings />}
        </div>
      </div>
    </>
  );
}

function ProfileSettings() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <h3 className="font-bold text-gray-900">プロフィール情報</h3>
        <p className="text-sm text-gray-500 mt-1">公開プロフィールと連絡先情報を管理します。</p>
      </div>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <button className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            写真を変更
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">会社名</label>
            <input type="text" defaultValue="株式会社サンプル" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">担当者名</label>
            <input type="text" defaultValue="田中 太郎" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">メールアドレス</label>
            <input type="email" defaultValue="tanaka@example.com" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">電話番号</label>
            <input type="tel" defaultValue="03-1234-5678" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none" />
          </div>
        </div>
        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button className="bg-black text-white px-5 py-2.5 text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-lg shadow-black/10 flex items-center gap-2">
            <Check className="w-4 h-4" />
            変更を保存
          </button>
        </div>
      </div>
    </div>
  );
}

function BillingSettings() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-1">現在のプラン</h3>
        <p className="text-sm text-gray-500 mb-6">ご利用中のプランと使用状況を確認します。</p>
        <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl border border-gray-200">
          <div>
            <p className="font-bold text-lg text-gray-900">プロフェッショナル</p>
            <p className="text-sm text-gray-500">¥20,000 / 月</p>
          </div>
          <span className="px-3 py-1 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-full">有効</span>
        </div>
        <div className="mt-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">今月の生成枚数</span>
            <span className="font-medium text-gray-900">142 / 無制限</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">次回請求日</span>
            <span className="font-medium text-gray-900">2026年3月1日</span>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-4">お支払い方法</h3>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-900">•••• •••• •••• 4242</span>
          </div>
          <button className="text-sm text-gray-500 hover:text-black font-medium transition-colors">変更</button>
        </div>
      </div>
    </div>
  );
}

function NotificationSettings() {
  const notifications = [
    { label: '生成完了通知', desc: '画像生成が完了した際に通知を受け取ります', enabled: true },
    { label: 'キャンペーンレポート', desc: '週次のキャンペーンレポートをメールで送信します', enabled: true },
    { label: 'プラン更新リマインダー', desc: 'プラン更新の3日前に通知します', enabled: false },
    { label: '新機能のお知らせ', desc: '新機能やアップデートに関するお知らせを受け取ります', enabled: true },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <h3 className="font-bold text-gray-900">通知設定</h3>
        <p className="text-sm text-gray-500 mt-1">通知の受信方法とタイミングを設定します。</p>
      </div>
      <div className="divide-y divide-gray-100">
        {notifications.map((n, i) => (
          <div key={i} className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-gray-900">{n.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{n.desc}</p>
            </div>
            <button
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                n.enabled ? 'bg-black' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                n.enabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApiSettings() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-1">APIキー</h3>
        <p className="text-sm text-gray-500 mb-6">外部サービスとの連携に使用するAPIキーを管理します。</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm text-gray-600">
            sk-••••••••••••••••••••••••••••••••
          </div>
          <button className="px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            コピー
          </button>
          <button className="px-4 py-2.5 text-sm font-medium bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-lg shadow-black/10">
            再生成
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-4">Webhook設定</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">エンドポイントURL</label>
          <input type="url" placeholder="https://your-domain.com/webhook" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none" />
        </div>
        <div className="flex justify-end mt-4">
          <button className="bg-black text-white px-5 py-2.5 text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-lg shadow-black/10 flex items-center gap-2">
            <Check className="w-4 h-4" />
            保存する
          </button>
        </div>
      </div>
    </div>
  );
}
