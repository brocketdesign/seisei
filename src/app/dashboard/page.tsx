"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Image as ImageIcon,
  Video,
  Users,
  Megaphone,
  ArrowUpRight,
  Sparkles,
  Crown,
  Loader2,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

type Generation = {
  id: string;
  generated_image_url: string | null;
  model_type: string | null;
  created_at: string;
};

type AIModelRow = {
  id: string;
  name: string;
  thumbnail_url: string | null;
  model_data: Record<string, unknown> | null;
};

type CampaignRow = {
  id: string;
  name: string;
  status: string;
};

export default function Dashboard() {
  const supabase = createClient();

  const [imageCount, setImageCount] = useState(0);
  const [videoCount, setVideoCount] = useState(0);
  const [modelCount, setModelCount] = useState(0);
  const [activeCampaignCount, setActiveCampaignCount] = useState(0);
  const [latestGenerations, setLatestGenerations] = useState<Generation[]>([]);
  const [topModel, setTopModel] = useState<AIModelRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Fetch all stats in parallel
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const [generationsRes, videoRes, modelsRes, campaignsRes, latestRes] = await Promise.all([
        // Count image generations this month
        supabase
          .from('generations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('created_at', monthStart),
        // Count video generations this month
        supabase
          .from('video_generations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('created_at', monthStart),
        // Fetch models
        supabase
          .from('ai_models')
          .select('id, name, thumbnail_url, model_data')
          .eq('user_id', user.id),
        // Fetch campaigns
        supabase
          .from('campaigns')
          .select('id, name, status')
          .eq('user_id', user.id),
        // Latest 4 completed generations
        supabase
          .from('generations')
          .select('id, generated_image_url, model_type, created_at')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(4),
      ]);

      setImageCount(generationsRes.count ?? 0);
      setVideoCount(videoRes.count ?? 0);
      setModelCount(modelsRes.data?.length ?? 0);
      setActiveCampaignCount(
        (campaignsRes.data ?? []).filter((c: CampaignRow) => c.status === 'active').length
      );
      setLatestGenerations((latestRes.data as Generation[]) ?? []);

      // Pick the first active model as "top model"
      if (modelsRes.data && modelsRes.data.length > 0) {
        const activeModels = (modelsRes.data as AIModelRow[]).filter(
          m => (m.model_data as Record<string, unknown>)?.isActive !== false
        );
        setTopModel(activeModels[0] ?? (modelsRes.data as AIModelRow[])[0]);
      }

      setLoading(false);
    };

    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <>
        <header className="mb-6">
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">ダッシュボード</h2>
          <p className="text-gray-400 text-sm mt-1">クリエイティブスタジオの概要</p>
        </header>
        <div className="py-32 flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3 opacity-40" />
          <p className="text-sm">読み込み中...</p>
        </div>
      </>
    );
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}分前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}時間前`;
    const days = Math.floor(hours / 24);
    return `${days}日前`;
  };

  return (
    <>
      <header className="mb-6">
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">ダッシュボード</h2>
        <p className="text-gray-400 text-sm mt-1">クリエイティブスタジオの概要</p>
      </header>

      {/* Stats Row — 3 metric cards + 1 "Top Model" visual card */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* Generation counts card — images & videos */}
        <div className="bg-white p-5 rounded-xl border border-gray-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4">今月の生成数</p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-violet-50 text-violet-600">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900 tracking-tight leading-none">{imageCount}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">画像</p>
              </div>
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-fuchsia-50 text-fuchsia-600">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900 tracking-tight leading-none">{videoCount}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">動画</p>
              </div>
            </div>
          </div>
        </div>

        {[
          { label: '登録モデル数', value: String(modelCount), icon: Users, accent: 'bg-sky-50 text-sky-600' },
          { label: 'キャンペーン (実施中)', value: String(activeCampaignCount), icon: Megaphone, accent: 'bg-amber-50 text-amber-600' },
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

        {/* Top Model — Hero Card */}
        {topModel ? (
          <div className="relative bg-black rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)] group">
            {topModel.thumbnail_url && (
              <Image
                src={topModel.thumbnail_url}
                alt={`${topModel.name} — トップモデル`}
                fill
                className="object-cover opacity-70 group-hover:opacity-80 transition-opacity"
              />
            )}
            <div className="relative z-10 p-5 flex flex-col justify-end h-full">
              <div className="flex items-center gap-1.5 mb-1">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">トップモデル</span>
              </div>
              <p className="text-white text-lg font-black tracking-tight">{topModel.name}</p>
            </div>
          </div>
        ) : (
          <div className="bg-white p-5 rounded-xl border border-gray-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center text-gray-300">
            <Users className="w-8 h-8 mb-2" />
            <p className="text-xs text-gray-400">モデル未登録</p>
          </div>
        )}
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

        {latestGenerations.length > 0 ? (
          <div className="grid grid-cols-4 gap-3">
            {latestGenerations.map((item) => (
              <div key={item.id} className="group relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 cursor-pointer">
                {item.generated_image_url && (
                  <Image
                    src={item.generated_image_url}
                    alt="生成画像"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {/* Info on hover */}
                <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <p className="text-white/70 text-[10px]">{timeAgo(item.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-gray-300">
            <ImageIcon className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm text-gray-400">まだ生成作品がありません</p>
            <Link href="/dashboard/generate" className="mt-2 text-xs text-black underline">
              画像を生成する →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
