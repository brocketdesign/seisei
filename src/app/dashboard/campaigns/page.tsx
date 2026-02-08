"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Megaphone,
  Plus,
  Calendar,
  BarChart3,
  MoreHorizontal,
  Search,
  ArrowUpRight,
  Loader2,
  Eye,
  Copy,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

type Campaign = {
  id: string;
  name: string;
  status: 'active' | 'scheduled' | 'completed' | 'draft';
  description: string | null;
  created_at: string;
  updated_at: string;
};

const statusLabels: Record<string, { label: string; style: string }> = {
  active: { label: '実施中', style: 'bg-green-50 text-green-700 border-green-200' },
  scheduled: { label: '予定', style: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed: { label: '完了', style: 'bg-gray-100 text-gray-600 border-gray-200' },
  draft: { label: '下書き', style: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
};

const statusOptions: { key: Campaign['status']; label: string }[] = [
  { key: 'draft', label: '下書き' },
  { key: 'active', label: '実施中' },
  { key: 'scheduled', label: '予定' },
  { key: 'completed', label: '完了' },
];

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [creating, setCreating] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setCampaigns(data || []);
      setLoading(false);
    };
    fetchCampaigns();
  }, []);

  const filtered = campaigns.filter(c =>
    filterStatus === 'all' ? true : c.status === filterStatus
  );

  const handleCreateCampaign = async () => {
    if (!newCampaignName.trim()) return;
    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCreating(false); return; }

    const { data, error } = await supabase
      .from('campaigns')
      .insert({ user_id: user.id, name: newCampaignName.trim(), status: 'draft' })
      .select()
      .single();

    if (data && !error) {
      setCampaigns(prev => [data, ...prev]);
      setNewCampaignName('');
      setShowCreateForm(false);
    }
    setCreating(false);
  };

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
        setStatusMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDuplicate = async (campaign: Campaign) => {
    setOpenMenuId(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        user_id: user.id,
        name: `${campaign.name} (コピー)`,
        status: 'draft' as const,
        description: campaign.description,
      })
      .select()
      .single();

    if (data && !error) {
      setCampaigns(prev => [data, ...prev]);
    }
  };

  const handleStatusChange = async (campaignId: string, newStatus: Campaign['status']) => {
    setOpenMenuId(null);
    setStatusMenuId(null);

    const { error } = await supabase
      .from('campaigns')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', campaignId);

    if (!error) {
      setCampaigns(prev =>
        prev.map(c => c.id === campaignId ? { ...c, status: newStatus, updated_at: new Date().toISOString() } : c)
      );
    }
  };

  const handleDelete = async (campaignId: string) => {
    setDeleting(true);
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', campaignId);

    if (!error) {
      setCampaigns(prev => prev.filter(c => c.id !== campaignId));
    }
    setDeleting(false);
    setDeleteConfirmId(null);
    setOpenMenuId(null);
  };

  return (
    <>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">キャンペーン管理</h2>
          <p className="text-gray-500 text-sm mt-1">キャンペーンの作成・管理・パフォーマンスを確認します。</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-black text-white px-5 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 rounded-lg shadow-lg shadow-black/10"
        >
          <Plus className="w-4 h-4" />
          新規キャンペーン
        </button>
      </header>

      {/* Create Campaign Inline Form */}
      {showCreateForm && (
        <div className="mb-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 text-sm mb-3">新規キャンペーンを作成</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newCampaignName}
              onChange={(e) => setNewCampaignName(e.target.value)}
              placeholder="キャンペーン名を入力..."
              className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateCampaign()}
              autoFocus
            />
            <button
              onClick={handleCreateCampaign}
              disabled={creating || !newCampaignName.trim()}
              className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                creating || !newCampaignName.trim()
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : '作成'}
            </button>
            <button
              onClick={() => { setShowCreateForm(false); setNewCampaignName(''); }}
              className="px-4 py-2.5 text-sm text-gray-500 hover:text-black hover:bg-gray-50 rounded-lg transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
        {[
          { label: '実施中', value: campaigns.filter(c => c.status === 'active').length, icon: Megaphone },
          { label: '予定', value: campaigns.filter(c => c.status === 'scheduled').length, icon: Calendar },
          { label: '合計キャンペーン', value: campaigns.length, icon: BarChart3 },
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="キャンペーンを検索..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-black/5 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {([
            { key: 'all', label: 'すべて' },
            { key: 'active', label: '実施中' },
            { key: 'scheduled', label: '予定' },
            { key: 'completed', label: '完了' },
            { key: 'draft', label: '下書き' },
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
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3 opacity-40" />
            <p className="text-sm">読み込み中...</p>
          </div>
        ) : filtered.length > 0 ? (
          filtered.map(campaign => (
            <div
              key={campaign.id}
              className={`bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all group relative ${openMenuId === campaign.id ? 'z-20' : 'z-0'}`}
            >
              <Link
                href={`/dashboard/campaigns/${campaign.id}`}
                className="absolute inset-0 rounded-xl z-0"
              />
              <div className="flex items-center justify-between relative">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                    <Megaphone className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      {campaign.name}
                      <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-black transition-colors" />
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      作成日: {new Date(campaign.created_at).toLocaleDateString('ja-JP')}
                      {campaign.description && ` · ${campaign.description}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 z-10">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full border ${(statusLabels[campaign.status] || statusLabels.draft).style}`}>
                    {(statusLabels[campaign.status] || statusLabels.draft).label}
                  </span>
                  <div className="relative" ref={openMenuId === campaign.id ? menuRef : undefined}>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === campaign.id ? null : campaign.id);
                        setStatusMenuId(null);
                        setDeleteConfirmId(null);
                      }}
                      className="p-2 text-gray-400 hover:text-black rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {openMenuId === campaign.id && (
                      <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                        {/* View details */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenMenuId(null);
                            router.push(`/dashboard/campaigns/${campaign.id}`);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Eye className="w-4 h-4 text-gray-400" />
                          詳細を表示
                        </button>

                        {/* Duplicate */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDuplicate(campaign);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Copy className="w-4 h-4 text-gray-400" />
                          複製する
                        </button>

                        {/* Status change */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setStatusMenuId(statusMenuId === campaign.id ? null : campaign.id);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <RefreshCw className="w-4 h-4 text-gray-400" />
                            ステータス変更
                          </button>
                          {statusMenuId === campaign.id && (
                            <div className="border-t border-gray-100 bg-gray-50/50">
                              {statusOptions.map(opt => (
                                <button
                                  key={opt.key}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleStatusChange(campaign.id, opt.key);
                                  }}
                                  className={`w-full flex items-center gap-3 px-4 pl-11 py-2 text-sm transition-colors ${
                                    campaign.status === opt.key
                                      ? 'text-black font-medium bg-gray-100'
                                      : 'text-gray-600 hover:bg-gray-100'
                                  }`}
                                >
                                  <span className={`w-2 h-2 rounded-full ${
                                    opt.key === 'active' ? 'bg-green-500' :
                                    opt.key === 'scheduled' ? 'bg-blue-500' :
                                    opt.key === 'completed' ? 'bg-gray-400' :
                                    'bg-yellow-500'
                                  }`} />
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-100 my-1" />

                        {/* Delete */}
                        {deleteConfirmId === campaign.id ? (
                          <div className="px-4 py-3">
                            <p className="text-xs text-gray-500 mb-2">このキャンペーンを削除しますか？</p>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDelete(campaign.id);
                                }}
                                disabled={deleting}
                                className="flex-1 px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                              >
                                {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : '削除する'}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setDeleteConfirmId(null);
                                }}
                                className="flex-1 px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                キャンセル
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDeleteConfirmId(campaign.id);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            削除する
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-16 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
            <Megaphone size={48} className="mb-4 opacity-20" />
            <p className="text-sm">キャンペーンが見つかりません</p>
            {campaigns.length === 0 && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-3 text-xs bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                最初のキャンペーンを作成
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
