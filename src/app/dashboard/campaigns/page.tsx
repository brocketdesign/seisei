"use client";

import React, { useState } from 'react';
import {
  Megaphone,
  Plus,
  Calendar,
  BarChart3,
  Eye,
  MoreHorizontal,
  Search,
  ArrowUpRight,
} from 'lucide-react';

type Campaign = {
  id: string;
  name: string;
  status: 'active' | 'scheduled' | 'completed';
  platform: string;
  impressions: number;
  startDate: string;
  endDate: string;
};

const mockCampaigns: Campaign[] = [
  { id: '1', name: '春コレクション 2026', status: 'active', platform: '楽天市場', impressions: 12400, startDate: '2026-02-01', endDate: '2026-03-31' },
  { id: '2', name: 'バレンタイン特集', status: 'active', platform: 'Instagram', impressions: 8200, startDate: '2026-02-01', endDate: '2026-02-14' },
  { id: '3', name: '新作デニムライン', status: 'scheduled', platform: 'ZOZOTOWN', impressions: 0, startDate: '2026-03-01', endDate: '2026-04-30' },
  { id: '4', name: '冬セール最終', status: 'completed', platform: 'Amazon', impressions: 45600, startDate: '2026-01-01', endDate: '2026-01-31' },
];

const statusLabels: Record<Campaign['status'], { label: string; style: string }> = {
  active: { label: '実施中', style: 'bg-green-50 text-green-700 border-green-200' },
  scheduled: { label: '予定', style: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed: { label: '完了', style: 'bg-gray-100 text-gray-600 border-gray-200' },
};

export default function CampaignsPage() {
  const [filterStatus, setFilterStatus] = useState<'all' | Campaign['status']>('all');

  const filtered = mockCampaigns.filter(c =>
    filterStatus === 'all' ? true : c.status === filterStatus
  );

  return (
    <>
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">キャンペーン管理</h2>
          <p className="text-gray-500 text-sm mt-1">キャンペーンの作成・管理・パフォーマンスを確認します。</p>
        </div>
        <button className="bg-black text-white px-5 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 rounded-lg shadow-lg shadow-black/10">
          <Plus className="w-4 h-4" />
          新規キャンペーン
        </button>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {[
          { label: '実施中', value: mockCampaigns.filter(c => c.status === 'active').length, icon: Megaphone },
          { label: '予定', value: mockCampaigns.filter(c => c.status === 'scheduled').length, icon: Calendar },
          { label: '合計インプレッション', value: mockCampaigns.reduce((s, c) => s + c.impressions, 0).toLocaleString(), icon: BarChart3 },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
              <stat.icon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="キャンペーンを検索..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-black/5 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2">
          {([
            { key: 'all', label: 'すべて' },
            { key: 'active', label: '実施中' },
            { key: 'scheduled', label: '予定' },
            { key: 'completed', label: '完了' },
          ] as const).map(f => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === f.key
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Campaign List */}
      <div className="space-y-4">
        {filtered.map(campaign => (
          <div
            key={campaign.id}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                  <Megaphone className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    {campaign.name}
                    <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-black transition-colors" />
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">{campaign.platform} · {campaign.startDate} ~ {campaign.endDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 text-xs font-medium rounded-full border ${statusLabels[campaign.status].style}`}>
                  {statusLabels[campaign.status].label}
                </span>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Eye className="w-4 h-4" />
                  {campaign.impressions.toLocaleString()}
                </div>
                <button className="p-2 text-gray-400 hover:text-black rounded-lg hover:bg-gray-50 transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-16 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
            <Megaphone size={48} className="mb-4 opacity-20" />
            <p className="text-sm">キャンペーンが見つかりません</p>
          </div>
        )}
      </div>
    </>
  );
}
