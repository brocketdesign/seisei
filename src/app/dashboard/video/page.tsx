"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Video,
  Play,
  Download,
  Loader2,
  Image as ImageIcon,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  X,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

type Generation = {
  id: string;
  generated_image_url: string;
  ai_model_id: string | null;
  model_type: string | null;
  created_at: string;
};

type VideoGeneration = {
  id: string;
  source_image_url: string;
  video_url: string | null;
  prompt: string | null;
  template: string | null;
  duration: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  ai_model_id: string | null;
  generation_id: string | null;
  created_at: string;
};

type AIModelInfo = {
  id: string;
  name: string;
  thumbnail_url: string | null;
};

// Fashion-specific animation templates
const VIDEO_TEMPLATES = [
  {
    id: 'runway-walk',
    name: 'ランウェイウォーク',
    nameEn: 'Runway Walk',
    prompt: 'A fashion model gracefully walking down a runway, smooth confident stride, professional model walk, fashion show lighting, elegant movement',
    icon: '👠',
    description: 'ファッションショーのランウェイを歩くモデル',
  },
  {
    id: 'slow-turn',
    name: 'スローターン',
    nameEn: 'Slow Turn',
    prompt: 'A fashion model slowly turning around 360 degrees, showcasing the outfit from all angles, smooth rotation, studio lighting, elegant pose transition',
    icon: '🔄',
    description: '360度回転して衣装を見せる',
  },
  {
    id: 'pose-transition',
    name: 'ポーズ切替',
    nameEn: 'Pose Transition',
    prompt: 'A fashion model transitioning between elegant poses, natural fluid movement, professional modeling poses, studio photography style, confident expression',
    icon: '💃',
    description: '自然なポーズ切り替えアニメーション',
  },
  {
    id: 'wind-effect',
    name: '風エフェクト',
    nameEn: 'Wind Effect',
    prompt: 'A fashion model standing with wind blowing through hair and clothes, fabric flowing naturally, dramatic wind effect, cinematic lighting, editorial fashion photography',
    icon: '🌬️',
    description: '風になびく髪と衣装の動き',
  },
  {
    id: 'hair-flip',
    name: 'ヘアフリップ',
    nameEn: 'Hair Flip',
    prompt: 'A fashion model doing a natural hair flip, hair flowing in slow motion, glamorous movement, beauty shot, professional studio lighting',
    icon: '💇‍♀️',
    description: 'ヘアを優雅にフリップ',
  },
  {
    id: 'street-style',
    name: 'ストリートスタイル',
    nameEn: 'Street Style',
    prompt: 'A fashion model walking casually on a city street, confident street style movement, urban fashion, natural daylight, candid fashion photography feel',
    icon: '🏙️',
    description: 'ストリートでのカジュアルウォーク',
  },
  {
    id: 'product-showcase',
    name: '商品アピール',
    nameEn: 'Product Showcase',
    prompt: 'A fashion model showcasing clothing details, touching fabric, showing texture, elegant hand movements highlighting the garment, close-up fashion video style',
    icon: '✨',
    description: '衣装のディテールを見せる動き',
  },
  {
    id: 'custom',
    name: 'カスタム',
    nameEn: 'Custom',
    prompt: '',
    icon: '🎬',
    description: '自由にプロンプトを入力',
  },
];

export default function VideoPage() {
  const supabase = createClient();

  // Generated images (from image generation history)
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [generationsLoading, setGenerationsLoading] = useState(true);

  // Video history
  const [videos, setVideos] = useState<VideoGeneration[]>([]);
  const [videosLoading, setVideosLoading] = useState(true);

  // AI Models for display
  const [modelsMap, setModelsMap] = useState<Record<string, AIModelInfo>>({});

  // Selection state
  const [selectedImage, setSelectedImage] = useState<Generation | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState(VIDEO_TEMPLATES[0]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [duration, setDuration] = useState(5);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Modal state for video preview  
  const [previewVideo, setPreviewVideo] = useState<VideoGeneration | null>(null);

  // Load generated images from history
  useEffect(() => {
    async function loadGenerations() {
      try {
        const res = await fetch('/api/generate/history');
        if (res.ok) {
          const data = await res.json();
          setGenerations(data.generations || []);
        }
      } catch (err) {
        console.error('Failed to load generations:', err);
      } finally {
        setGenerationsLoading(false);
      }
    }
    loadGenerations();
  }, []);

  // Load video history
  useEffect(() => {
    async function loadVideos() {
      try {
        const res = await fetch('/api/generate/video');
        if (res.ok) {
          const data = await res.json();
          setVideos(data.videos || []);
        }
      } catch (err) {
        console.error('Failed to load videos:', err);
      } finally {
        setVideosLoading(false);
      }
    }
    loadVideos();
  }, []);

  // Load AI models for name display
  useEffect(() => {
    async function loadModels() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('ai_models')
        .select('id, name, thumbnail_url')
        .eq('user_id', user.id);

      if (data) {
        const map: Record<string, AIModelInfo> = {};
        for (const m of data) {
          map[m.id] = { id: m.id, name: m.name, thumbnail_url: m.thumbnail_url };
        }
        setModelsMap(map);
      }
    }
    loadModels();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Generate video
  const handleGenerate = useCallback(async () => {
    if (!selectedImage) {
      setGenerationError('動画にする画像を選択してください。');
      return;
    }

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
          sourceImageUrl: selectedImage.generated_image_url,
          prompt,
          template: selectedTemplate.id !== 'custom' ? selectedTemplate.name : null,
          duration,
          generationId: selectedImage.id,
          aiModelId: selectedImage.ai_model_id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '動画の生成に失敗しました。');
      }

      // Add the new video to the list
      if (data.videoGeneration) {
        setVideos(prev => [data.videoGeneration, ...prev]);
      }

      setSelectedImage(null);
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : '動画の生成に失敗しました。');
    } finally {
      setIsGenerating(false);
    }
  }, [selectedImage, selectedTemplate, customPrompt, duration]);

  const handleDownloadVideo = (videoUrl: string) => {
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `seisei-video-${Date.now()}.mp4`;
    a.click();
  };

  return (
    <>
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">動画生成</h2>
          <p className="text-gray-500 text-sm mt-1">生成した画像を選択して、動画を作成します。</p>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column: Image Selection + Settings */}
        <div className="col-span-5 space-y-6">
          {/* Source Image Selection */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                ソース画像を選択
              </h3>
              <p className="text-xs text-gray-500 mt-1">生成済み画像から動画にしたい画像を選びます</p>
            </div>

            <div className="p-4 max-h-[360px] overflow-y-auto">
              {generationsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : generations.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">生成済み画像がありません</p>
                  <p className="text-xs mt-1">まず画像生成ダッシュボードで画像を生成してください</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {generations.map((gen) => (
                    <button
                      key={gen.id}
                      onClick={() => setSelectedImage(gen)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all group ${
                        selectedImage?.id === gen.id
                          ? 'border-black shadow-lg ring-2 ring-black/10'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={gen.generated_image_url}
                        alt="Generated"
                        className="w-full h-full object-cover"
                      />
                      {selectedImage?.id === gen.id && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                      )}
                      {gen.ai_model_id && modelsMap[gen.ai_model_id] && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                          <p className="text-[10px] text-white truncate">{modelsMap[gen.ai_model_id].name}</p>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Template Selection */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                アニメーションテンプレート
              </h3>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2">
              {VIDEO_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    selectedTemplate.id === template.id
                      ? 'border-black bg-gray-50 shadow-sm'
                      : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{template.icon}</span>
                    <span className="text-sm font-medium text-gray-900">{template.name}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-tight">{template.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Prompt (only if custom template selected) */}
          {selectedTemplate.id === 'custom' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <label className="block text-sm font-bold text-gray-900 mb-2">カスタムプロンプト</label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="例: A fashion model gracefully walking and turning..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/10 outline-none text-sm h-24 resize-none"
              />
            </div>
          )}

          {/* Duration Setting */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <label className="block text-sm font-bold text-gray-900 mb-2">動画の長さ</label>
            <div className="flex gap-2">
              {[5, 10].map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    duration === d
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {d}秒
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedImage}
            className="w-full py-4 bg-black text-white rounded-xl font-bold shadow-lg shadow-black/10 hover:bg-gray-800 transition-all disabled:bg-gray-300 disabled:shadow-none flex items-center justify-center gap-3 text-base"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                動画を生成中...（最大5分）
              </>
            ) : (
              <>
                <Video className="w-5 h-5" />
                動画を生成する
              </>
            )}
          </button>

          {generationError && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-sm text-red-600">{generationError}</p>
            </div>
          )}
        </div>

        {/* Right Column: Video History */}
        <div className="col-span-7 space-y-6">
          {/* Selected image preview */}
          {selectedImage && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">選択中の画像</h3>
                <button onClick={() => setSelectedImage(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 flex gap-4">
                <div className="w-48 h-48 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={selectedImage.generated_image_url}
                    alt="Selected"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="space-y-2 text-sm">
                    {selectedImage.ai_model_id && modelsMap[selectedImage.ai_model_id] && (
                      <div>
                        <span className="text-gray-500">モデル:</span>{' '}
                        <span className="font-medium">{modelsMap[selectedImage.ai_model_id].name}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">生成日:</span>{' '}
                      <span className="font-medium">{new Date(selectedImage.created_at).toLocaleDateString('ja-JP')}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">テンプレート:</span>{' '}
                      <span className="font-medium">{selectedTemplate.icon} {selectedTemplate.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">長さ:</span>{' '}
                      <span className="font-medium">{duration}秒</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Video History */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Video className="w-4 h-4" />
                生成済み動画
              </h3>
            </div>

            {videosLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : videos.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Video className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">まだ動画がありません</p>
                <p className="text-xs mt-1">画像を選択して動画を生成してください</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 p-4">
                {videos.map((video) => (
                  <div
                    key={video.id}
                    className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden group"
                  >
                    {/* Thumbnail / Video Preview */}
                    <div className="relative aspect-video bg-gray-200">
                      {video.status === 'completed' && video.video_url ? (
                        <>
                          <video
                            src={video.video_url}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                            onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                            onMouseLeave={(e) => {
                              const v = e.target as HTMLVideoElement;
                              v.pause();
                              v.currentTime = 0;
                            }}
                          />
                          <button
                            onClick={() => setPreviewVideo(video)}
                            className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors"
                          >
                            <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-5 h-5 text-black ml-0.5" />
                            </div>
                          </button>
                        </>
                      ) : video.status === 'processing' ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">生成中...</p>
                          </div>
                        </div>
                      ) : video.status === 'failed' ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center">
                            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                            <p className="text-xs text-red-500">生成失敗</p>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={video.source_image_url}
                          alt="Source"
                          className="w-full h-full object-cover opacity-50"
                        />
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          {video.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                          {video.status === 'processing' && <Clock className="w-3.5 h-3.5 text-amber-500" />}
                          {video.status === 'failed' && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                          <span className="text-xs font-medium text-gray-700">
                            {video.template || 'カスタム'}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {video.duration}秒
                        </span>
                      </div>

                      {video.ai_model_id && modelsMap[video.ai_model_id] && (
                        <p className="text-[11px] text-gray-500 mb-2">
                          モデル: {modelsMap[video.ai_model_id].name}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">
                          {new Date(video.created_at).toLocaleDateString('ja-JP')}
                        </span>
                        {video.status === 'completed' && video.video_url && (
                          <button
                            onClick={() => handleDownloadVideo(video.video_url!)}
                            className="text-xs text-gray-500 hover:text-black flex items-center gap-1 transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            DL
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Preview Modal */}
      {previewVideo && previewVideo.video_url && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-8"
          onClick={() => setPreviewVideo(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">動画プレビュー</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {previewVideo.template || 'カスタム'} · {previewVideo.duration}秒
                </p>
              </div>
              <button
                onClick={() => setPreviewVideo(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4">
              <video
                src={previewVideo.video_url}
                controls
                autoPlay
                className="w-full rounded-lg"
              />
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => handleDownloadVideo(previewVideo.video_url!)}
                className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                <Download className="w-4 h-4" />
                ダウンロード
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
