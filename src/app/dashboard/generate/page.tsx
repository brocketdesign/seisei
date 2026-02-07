"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Upload,
  Plus,
  Download,
  Share2,
  Image as ImageIcon,
  Megaphone,
  ChevronDown,
  FolderOpen,
} from 'lucide-react';

const mockCampaigns = [
  { id: '1', name: '春コレクション 2026', status: 'active' as const },
  { id: '2', name: 'バレンタイン特集', status: 'active' as const },
  { id: '3', name: '新作デニムライン', status: 'scheduled' as const },
  { id: '4', name: 'Summer 2026', status: 'active' as const },
];

export default function GeneratePage() {
  const [selectedCampaign, setSelectedCampaign] = useState(mockCampaigns[0]);
  const [campaignOpen, setCampaignOpen] = useState(false);

  return (
    <>
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">画像生成</h2>
          <p className="text-gray-500 text-sm mt-1">商品画像をアップロードして、モデル着用イメージを生成します。</p>
        </div>
        <Link
          href="/dashboard/campaigns"
          className="bg-black text-white px-5 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 rounded-lg shadow-lg shadow-black/10"
        >
          <Plus className="w-4 h-4" />
          新規キャンペーン
        </Link>
      </header>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column: Controls */}
        <div className="col-span-4 space-y-6">

          {/* Campaign Selector */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-gray-500" />
              キャンペーン
            </h3>
            <div className="relative">
              <button
                onClick={() => setCampaignOpen(!campaignOpen)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-black transition-colors text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FolderOpen className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{selectedCampaign.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">生成結果はこのキャンペーンに保存されます</p>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${campaignOpen ? 'rotate-180' : ''}`} />
              </button>

              {campaignOpen && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  {mockCampaigns.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCampaign(c); setCampaignOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors ${
                        selectedCampaign.id === c.id ? 'bg-gray-50 font-medium text-black' : 'text-gray-700'
                      }`}
                    >
                      <FolderOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{c.name}</span>
                      {selectedCampaign.id === c.id && (
                        <span className="ml-auto text-[10px] bg-black text-white px-1.5 py-0.5 rounded">選択中</span>
                      )}
                    </button>
                  ))}
                  <Link
                    href="/dashboard/campaigns"
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-500 hover:bg-gray-50 transition-colors border-t border-gray-100"
                  >
                    <Plus className="w-4 h-4" />
                    <span>新規キャンペーンを作成</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Upload Section */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 text-sm">商品画像</h3>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:border-black transition-colors cursor-pointer group">
              <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-gray-100">
                <Upload className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
              </div>
              <p className="text-sm font-medium text-gray-900">画像をアップロード</p>
              <p className="text-xs text-gray-400 mt-1">またはドラッグ＆ドロップ</p>
              <p className="text-[10px] text-gray-300 mt-2">JPG, PNG (最大 10MB)</p>
            </div>
          </div>

          {/* Model Selection */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 text-sm">モデル選択</h3>
            <div className="grid grid-cols-2 gap-3">
              {['Japanese/Natural', 'Western/High-Fashion', 'Asian/Street', 'Mix/Casual'].map((model, i) => (
                <button
                  key={i}
                  className="aspect-square rounded-lg border border-gray-100 bg-gray-50 hover:border-black transition-all overflow-hidden relative group"
                >
                  <div className="absolute inset-0 bg-gray-200" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent">
                    <span className="text-[10px] text-white font-medium">{model.split('/')[0]}</span>
                  </div>
                </button>
              ))}
            </div>
            <button className="w-full mt-4 text-xs text-center text-gray-500 hover:text-black underline">
              すべてのモデルを表示
            </button>
          </div>

          {/* Settings */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 text-sm">生成設定</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">背景</label>
                <select className="w-full text-sm border border-gray-200 rounded-lg p-2.5 bg-gray-50 focus:border-black focus:ring-0 outline-none">
                  <option>スタジオ（白背景）</option>
                  <option>ストリート（昼）</option>
                  <option>カフェ（屋内）</option>
                  <option>自然光</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">アスペクト比</label>
                <div className="flex gap-2">
                  {['1:1', '4:5', '9:16'].map(r => (
                    <button key={r} className="flex-1 py-2 text-xs border border-gray-200 rounded-lg hover:border-black bg-white transition-colors">
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button className="w-full bg-black text-white py-3 rounded-lg text-sm font-bold mt-6 hover:bg-gray-800 transition-colors shadow-lg shadow-black/10">
              生成する
            </button>
            <p className="text-[10px] text-gray-400 text-center mt-2">残りチケット: 20 · 保存先: {selectedCampaign.name}</p>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="col-span-8">
          <div className="bg-white h-full rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">生成結果</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">{selectedCampaign.name}</p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-gray-400 hover:text-black border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Download className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-black border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Empty State */}
            <div className="flex-1 border border-dashed border-gray-200 rounded-lg bg-gray-50 flex flex-col items-center justify-center text-gray-400">
              <ImageIcon className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">左側のパネルから設定を行い、<br />「生成する」ボタンを押してください。</p>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <h4 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Recent History</h4>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg border border-gray-100" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
