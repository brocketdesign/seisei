"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight,
  ChevronLeft,
  Image as ImageIcon,
  Video,
  Download,
  Play,
  Loader2,
  User,
  Camera,
  Check,
  Lock,
  Unlock,
  X,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { AIModel } from '@/types/models';
import { createClient } from '@/utils/supabase/client';

type Generation = {
  id: string;
  generated_image_url: string;
  model_type: string | null;
  background: string | null;
  aspect_ratio: string | null;
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
  created_at: string;
};

export default function ModelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const modelId = params.id as string;
  const supabase = createClient();

  const [model, setModel] = useState<AIModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'images' | 'videos'>('images');

  // Model's generations and videos
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [videos, setVideos] = useState<VideoGeneration[]>([]);
  const [generationsLoading, setGenerationsLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(true);

  // Edit form state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<AIModel | null>(null);

  // Image preview
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  // Video preview
  const [previewVideo, setPreviewVideo] = useState<VideoGeneration | null>(null);

  // Load model data
  useEffect(() => {
    async function loadModel() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from('ai_models')
        .select('id, name, thumbnail_url, type, model_data')
        .eq('id', modelId)
        .eq('user_id', user.id)
        .single();

      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = data as any;
        const mapped: AIModel = {
          id: d.id,
          name: d.name,
          avatar: d.thumbnail_url || '',
          tags: d.model_data?.tags || [],
          isActive: d.model_data?.isActive ?? true,
          bodyType: d.model_data?.bodyType || 'Slim',
          isLocked: d.model_data?.isLocked ?? false,
          age: d.model_data?.age,
          ethnicity: d.model_data?.ethnicity,
          sex: d.model_data?.sex || 'female',
        };
        setModel(mapped);
        setFormData(mapped);
      }
      setLoading(false);
    }
    loadModel();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelId]);

  // Load generations for this model
  useEffect(() => {
    async function loadGenerations() {
      setGenerationsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setGenerationsLoading(false); return; }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('generations')
        .select('id, generated_image_url, model_type, background, aspect_ratio, created_at')
        .eq('user_id', user.id)
        .eq('ai_model_id', modelId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      setGenerations(data || []);
      setGenerationsLoading(false);
    }
    loadGenerations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelId]);

  // Load videos for this model
  useEffect(() => {
    async function loadVideos() {
      setVideosLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setVideosLoading(false); return; }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('video_generations')
        .select('id, source_image_url, video_url, prompt, template, duration, status, created_at')
        .eq('user_id', user.id)
        .eq('ai_model_id', modelId)
        .order('created_at', { ascending: false });

      setVideos(data || []);
      setVideosLoading(false);
    }
    loadVideos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelId]);

  // Save model edits
  const handleSave = async () => {
    if (!formData || !model) return;

    const { data: existing } = await supabase
      .from('ai_models')
      .select('model_data')
      .eq('id', modelId)
      .single();

    if (existing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const currentModelData = (existing.model_data as Record<string, any>) || {};
      await supabase
        .from('ai_models')
        .update({
          name: formData.name,
          model_data: {
            ...currentModelData,
            isActive: formData.isActive,
            bodyType: formData.bodyType,
            isLocked: formData.isLocked,
            tags: formData.tags,
            sex: formData.sex,
            age: formData.age,
            ethnicity: formData.ethnicity,
          },
        })
        .eq('id', modelId);
    }

    setModel(formData);
    setIsEditing(false);
  };

  const handleDownloadVideo = (videoUrl: string) => {
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `seisei-video-${Date.now()}.mp4`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!model) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">モデルが見つかりません</p>
        <Link href="/dashboard/models" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
          モデル一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <Link href="/dashboard/models" className="hover:text-black transition-colors">モデル管理</Link>
        <ChevronRight size={14} />
        <span className="text-black font-medium">{model.name}</span>
      </div>

      {/* Model Header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
            {model.avatar ? (
              <img src={model.avatar} alt={model.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <User size={40} />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData?.name || ''}
                    onChange={(e) => setFormData(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="text-2xl font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1 outline-none focus:ring-2 focus:ring-black/10"
                  />
                ) : (
                  <h2 className="text-2xl font-bold text-gray-900">{model.name}</h2>
                )}
                <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    {model.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                    {model.isLocked ? '顔固定ON' : '顔固定OFF'}
                  </span>
                  <span>·</span>
                  <span>{model.sex === 'male' ? '男性' : '女性'}</span>
                  <span>·</span>
                  <span>{model.bodyType}</span>
                  {model.age && (
                    <>
                      <span>·</span>
                      <span>{model.age}歳</span>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {model.tags.map(tag => (
                    <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">#{tag}</span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => { setFormData(model); setIsEditing(false); }}
                      className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-1.5"
                    >
                      <Check size={14} />
                      保存
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    編集
                  </button>
                )}
              </div>
            </div>

            {/* Edit form (inline) */}
            {isEditing && formData && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">性別</label>
                  <div className="grid grid-cols-2 gap-1">
                    {(['female', 'male'] as const).map(sex => (
                      <button
                        key={sex}
                        onClick={() => setFormData({ ...formData, sex })}
                        className={`py-1.5 rounded text-xs border transition-all ${
                          formData.sex === sex ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {sex === 'female' ? '女性' : '男性'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">体型</label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['Slim', 'Athletic', 'Curvy'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setFormData({ ...formData, bodyType: type })}
                        className={`py-1.5 rounded text-xs border transition-all ${
                          formData.bodyType === type ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => setFormData({ ...formData, isLocked: !formData.isLocked })}
                    className={`w-full py-1.5 rounded text-xs border flex items-center justify-center gap-1.5 transition-all ${
                      formData.isLocked ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {formData.isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                    顔固定 {formData.isLocked ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{generations.length}</p>
                <p className="text-xs text-gray-500">生成画像</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{videos.filter(v => v.status === 'completed').length}</p>
                <p className="text-xs text-gray-500">生成動画</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('images')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-all ${
            activeTab === 'images'
              ? 'bg-white text-black shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ImageIcon size={16} />
          画像 ({generations.length})
        </button>
        <button
          onClick={() => setActiveTab('videos')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-all ${
            activeTab === 'videos'
              ? 'bg-white text-black shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Video size={16} />
          動画 ({videos.filter(v => v.status === 'completed').length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'images' && (
        <div>
          {generationsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : generations.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
              <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">このモデルで生成された画像はまだありません</p>
              <Link
                href="/dashboard/generate"
                className="text-sm text-blue-600 hover:underline mt-2 inline-block"
              >
                画像を生成する →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {generations.map((gen) => (
                <div
                  key={gen.id}
                  className="group bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all"
                  onClick={() => setPreviewImage(gen.generated_image_url)}
                >
                  <div className="aspect-square relative">
                    <img
                      src={gen.generated_image_url}
                      alt="Generated"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const a = document.createElement('a');
                            a.href = gen.generated_image_url;
                            a.download = `seisei-${gen.id}.png`;
                            a.click();
                          }}
                          className="p-2 bg-white/90 rounded-full shadow-lg hover:bg-white"
                        >
                          <Download className="w-4 h-4 text-gray-700" />
                        </button>
                        <Link
                          href={`/dashboard/video`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 bg-white/90 rounded-full shadow-lg hover:bg-white"
                        >
                          <Video className="w-4 h-4 text-gray-700" />
                        </Link>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-[11px] text-gray-400">
                      {new Date(gen.created_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'videos' && (
        <div>
          {videosLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : videos.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
              <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">このモデルで生成された動画はまだありません</p>
              <Link
                href="/dashboard/video"
                className="text-sm text-blue-600 hover:underline mt-2 inline-block"
              >
                動画を生成する →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden group"
                >
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
                      <img src={video.source_image_url} alt="Source" className="w-full h-full object-cover opacity-50" />
                    )}
                  </div>

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
                      <span className="text-[10px] text-gray-400">{video.duration}秒</span>
                    </div>
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
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-8"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[80vh] w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[80vh] rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {previewVideo && previewVideo.video_url && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-8"
          onClick={() => setPreviewVideo(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">動画プレビュー</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {previewVideo.template || 'カスタム'} · {previewVideo.duration}秒
                </p>
              </div>
              <button onClick={() => setPreviewVideo(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4">
              <video src={previewVideo.video_url} controls autoPlay className="w-full rounded-lg" />
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end">
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
