"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Video,
  Play,
  Loader2,
  Download,
  X,
  Clock,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  Megaphone,
  FolderOpen,
  Plus,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Campaign = {
  id: string;
  name: string;
  status: 'active' | 'scheduled' | 'completed' | 'draft';
};

type Generation = {
  id: string;
  result_url: string;
  prompt: string | null;
  created_at: string;
  campaign_id: string | null;
};

type VideoGeneration = {
  id: string;
  user_id: string;
  generation_id: string | null;
  source_image_url: string;
  video_url: string | null;
  prompt: string;
  duration: string;
  status: string;
  error_message: string | null;
  created_at: string;
  campaign_id: string | null;
};

/* ------------------------------------------------------------------ */
/*  Fashion video templates                                            */
/* ------------------------------------------------------------------ */

const VIDEO_TEMPLATES = [
  { id: 'runway-walk', label: 'ランウェイウォーク', prompt: 'Fashion model walking on a runway, professional catwalk walk, confident stride, fashion show lighting, elegant movement, smooth camera tracking', icon: '🚶‍♀️' },
  { id: 'slow-turn',   label: 'スローターン',      prompt: 'Fashion model doing a slow elegant 360 degree turn, showing outfit from all angles, studio lighting, smooth rotation, professional fashion photography', icon: '🔄' },
  { id: 'pose-transition', label: 'ポーズ切替',    prompt: 'Fashion model transitioning between elegant poses, natural fluid movement, professional studio, fashion editorial style, smooth transitions', icon: '💃' },
  { id: 'wind-effect', label: '風なびき効果',       prompt: 'Fashion model with clothes and hair gently flowing in the wind, dreamy atmosphere, soft lighting, elegant movement, cinematic fashion video', icon: '🌬️' },
  { id: 'hair-flip',   label: 'ヘアフリップ',      prompt: 'Fashion model doing a stylish hair flip, dynamic movement, professional lighting, fashion editorial style, slow motion effect', icon: '💇‍♀️' },
  { id: 'street-style', label: 'ストリートスタイル', prompt: 'Fashion model walking confidently on a city street, urban background, natural lighting, street style fashion video, casual elegant movement', icon: '🏙️' },
  { id: 'product-showcase', label: '商品クローズアップ', prompt: 'Close-up showcase of fashion garment details, camera slowly panning across fabric texture and design details, professional product video, soft studio lighting', icon: '👗' },
  { id: 'custom',      label: 'カスタム',           prompt: '', icon: '✏️' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function VideoPage() {
  const supabase = createClient();

  /* ---- Campaign state ---- */
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [campaignsLoading, setCampaignsLoading] = useState(true);

  /* ---- Source images & video history (all, before filtering) ---- */
  const [allGenerations, setAllGenerations] = useState<Generation[]>([]);
  const [allVideos, setAllVideos] = useState<VideoGeneration[]>([]);

  /* ---- Filtered by selected campaign ---- */
  const generations = selectedCampaign
    ? allGenerations.filter(g => g.campaign_id === selectedCampaign.id)
    : allGenerations;

  const videos = selectedCampaign
    ? allVideos.filter(v => v.campaign_id === selectedCampaign.id)
    : allVideos;

  /* ---- Selection & generation state ---- */
  const [selectedImage, setSelectedImage] = useState<Generation | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState(VIDEO_TEMPLATES[0]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [duration, setDuration] = useState<'5' | '10'>('5');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  /* ---- Loading ---- */
  const [imagesLoading, setImagesLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(true);

  /* ---- Preview modal ---- */
  const [previewVideo, setPreviewVideo] = useState<VideoGeneration | null>(null);

  /* ---- Hover-play refs ---- */
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  /* ================================================================ */
  /*  Data fetching                                                    */
  /* ================================================================ */

  /* --- Campaigns --- */
  useEffect(() => {
    const fetchCampaigns = async () => {
      setCampaignsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setCampaignsLoading(false); return; }

      const { data } = await supabase
        .from('campaigns')
        .select('id, name, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setCampaigns(data);
        // don't auto-select — show "すべてのキャンペーン" by default
      }
      setCampaignsLoading(false);
    };
    fetchCampaigns();
  }, []);

  /* --- Reset selected image when campaign changes --- */
  useEffect(() => {
    setSelectedImage(null);
  }, [selectedCampaign?.id]);

  /* --- Source images (generation history) --- */
  useEffect(() => {
    const fetchImages = async () => {
      setImagesLoading(true);
      try {
        const res = await fetch('/api/generate/history');
        if (res.ok) {
          const data = await res.json();
          setAllGenerations(
            (data.history || []).map((h: { id: string; imageUrl: string; prompt?: string; createdAt?: string; campaign_id?: string }) => ({
              id: h.id,
              result_url: h.imageUrl,
              prompt: h.prompt || null,
              created_at: h.createdAt || new Date().toISOString(),
              campaign_id: h.campaign_id || null,
            }))
          );
        }
      } catch { /* ignore */ }
      setImagesLoading(false);
    };
    fetchImages();
  }, []);

  /* --- Video history --- */
  useEffect(() => {
    const fetchVideos = async () => {
      setVideosLoading(true);
      try {
        const res = await fetch('/api/generate/video');
        if (res.ok) {
          const data = await res.json();
          setAllVideos(data.videos || []);
        }
      } catch { /* ignore */ }
      setVideosLoading(false);
    };
    fetchVideos();
  }, []);

  /* ================================================================ */
  /*  Generate handler                                                 */
  /* ================================================================ */

  const handleGenerate = async () => {
    if (!selectedImage) return;

    const prompt = selectedTemplate.id === 'custom' ? customPrompt : selectedTemplate.prompt;
    if (!prompt.trim()) {
      setGenerationError('プロンプトを入力してください。');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const res = await fetch('/api/generate/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceImageUrl: selectedImage.result_url,
          prompt,
          duration,
          generationId: selectedImage.id,
          campaignId: selectedCampaign?.id || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '動画生成に失敗しました。');

      // prepend new video to history
      setAllVideos(prev => [data.videoGeneration, ...prev]);
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : '動画生成に失敗しました。');
    } finally {
      setIsGenerating(false);
    }
  };

  /* ================================================================ */
  /*  Hover-play helpers                                               */
  /* ================================================================ */

  const handleVideoHover = (id: string) => {
    const el = videoRefs.current[id];
    if (el) { el.currentTime = 0; el.play().catch(() => {}); }
  };
  const handleVideoLeave = (id: string) => {
    const el = videoRefs.current[id];
    if (el) { el.pause(); el.currentTime = 0; }
  };

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  const completedVideos = videos.filter(v => v.status === 'completed' && v.video_url);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-8 py-8">

        {/* ---------- Header ---------- */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">動画生成</h1>
            <p className="text-sm text-gray-500 mt-1">画像から動画を生成します</p>
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

          {/* ========================================================= */}
          {/*  Left Column: Controls                                     */}
          {/* ========================================================= */}
          <div className="col-span-4 space-y-6">

            {/* --- Campaign Selector --- */}
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
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {campaignsLoading ? '読み込み中...' : selectedCampaign?.name || 'すべてのキャンペーン'}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {selectedCampaign ? '生成結果はこのキャンペーンに保存されます' : 'すべての画像・動画を表示中'}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${campaignOpen ? 'rotate-180' : ''}`} />
                </button>

                {campaignOpen && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-64 overflow-y-auto">
                    {/* "All" option */}
                    <button
                      onClick={() => { setSelectedCampaign(null); setCampaignOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors ${
                        !selectedCampaign ? 'bg-gray-50 font-medium text-black' : 'text-gray-700'
                      }`}
                    >
                      <FolderOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">すべてのキャンペーン</span>
                      {!selectedCampaign && (
                        <span className="ml-auto text-[10px] bg-black text-white px-1.5 py-0.5 rounded">選択中</span>
                      )}
                    </button>

                    {campaigns.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedCampaign(c); setCampaignOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors ${
                          selectedCampaign?.id === c.id ? 'bg-gray-50 font-medium text-black' : 'text-gray-700'
                        }`}
                      >
                        <FolderOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{c.name}</span>
                        {selectedCampaign?.id === c.id && (
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

            {/* --- Template Selector --- */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gray-500" />
                テンプレート
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {VIDEO_TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t)}
                    className={`text-left p-3 rounded-lg border text-sm transition-all ${
                      selectedTemplate.id === t.id
                        ? 'border-black bg-gray-50 font-medium'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-base mr-1.5">{t.icon}</span>
                    <span className="text-xs">{t.label}</span>
                  </button>
                ))}
              </div>

              {selectedTemplate.id === 'custom' && (
                <textarea
                  value={customPrompt}
                  onChange={e => setCustomPrompt(e.target.value)}
                  placeholder="動画のプロンプトを入力..."
                  className="mt-3 w-full border border-gray-200 rounded-lg p-3 text-sm focus:border-black focus:ring-1 focus:ring-black outline-none resize-none"
                  rows={3}
                />
              )}
            </div>

            {/* --- Duration --- */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                動画の長さ
              </h3>
              <div className="flex gap-3">
                {(['5', '10'] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-all ${
                      duration === d ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {d}秒
                  </button>
                ))}
              </div>
            </div>

            {/* --- Generate Button --- */}
            <button
              onClick={handleGenerate}
              disabled={!selectedImage || isGenerating}
              className="w-full py-4 rounded-xl bg-black text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-black/10"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  生成中... (最大5分)
                </>
              ) : (
                <>
                  <Video className="w-4 h-4" />
                  動画を生成
                </>
              )}
            </button>

            {generationError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {generationError}
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/*  Right Column: Image selection + Video history              */}
          {/* ========================================================= */}
          <div className="col-span-8 space-y-8">

            {/* --- Source Image Selection --- */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 text-sm flex items-center gap-2">
                <Play className="w-4 h-4 text-gray-500" />
                ソース画像を選択
                {selectedCampaign && (
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full ml-2">{selectedCampaign.name}</span>
                )}
              </h3>

              {imagesLoading ? (
                <div className="py-12 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                </div>
              ) : generations.length === 0 ? (
                <div className="py-12 text-center">
                  <Video className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 mb-1">
                    {selectedCampaign ? `「${selectedCampaign.name}」に画像がありません` : '生成された画像がありません'}
                  </p>
                  <p className="text-xs text-gray-300">まず画像生成ダッシュボードで画像を生成してください</p>
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-3 max-h-64 overflow-y-auto pr-1">
                  {generations.map(g => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedImage(g)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage?.id === g.id ? 'border-black ring-2 ring-black/20' : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <Image src={g.result_url} alt="" fill className="object-cover" sizes="120px" />
                      {selectedImage?.id === g.id && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* --- Generated Videos --- */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Video className="w-4 h-4 text-gray-500" />
                  生成された動画
                  {selectedCampaign && (
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full ml-2">{selectedCampaign.name}</span>
                  )}
                  {completedVideos.length > 0 && (
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{completedVideos.length}件</span>
                  )}
                </h3>
              </div>

              {videosLoading ? (
                <div className="py-12 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                </div>
              ) : completedVideos.length === 0 ? (
                <div className="py-12 text-center">
                  <Video className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">
                    {selectedCampaign ? `「${selectedCampaign.name}」に動画がありません` : 'まだ動画がありません'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {completedVideos.map(v => (
                    <div
                      key={v.id}
                      className="relative aspect-video rounded-lg overflow-hidden bg-black cursor-pointer group"
                      onMouseEnter={() => handleVideoHover(v.id)}
                      onMouseLeave={() => handleVideoLeave(v.id)}
                      onClick={() => setPreviewVideo(v)}
                    >
                      <video
                        ref={el => { videoRefs.current[v.id] = el; }}
                        src={v.video_url!}
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-100 group-hover:opacity-0 transition-opacity">
                        <Play className="w-8 h-8 text-white" fill="white" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[10px] text-white truncate">{v.prompt}</p>
                        <p className="text-[9px] text-white/60">{v.duration}秒 • {new Date(v.created_at).toLocaleDateString('ja-JP')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/*  Video Preview Modal                                           */}
      {/* ============================================================= */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8" onClick={() => setPreviewVideo(null)}>
          <div className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewVideo(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="aspect-video bg-black">
              <video
                src={previewVideo.video_url!}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-700 mb-2">{previewVideo.prompt}</p>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>{previewVideo.duration}秒</span>
                <span>{new Date(previewVideo.created_at).toLocaleString('ja-JP')}</span>
              </div>

              <div className="flex gap-3 mt-4">
                <a
                  href={previewVideo.video_url!}
                  download
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  ダウンロード
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
