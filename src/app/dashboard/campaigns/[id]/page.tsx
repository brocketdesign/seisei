"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Megaphone,
  Package,
  ImageIcon,
  Settings2,
  Plus,
  Trash2,
  Check,
  Loader2,
  Upload,
  X,
  ChevronDown,
  Edit3,
  Download,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

// --- Types ---

type Campaign = {
  id: string;
  user_id: string;
  name: string;
  status: 'active' | 'scheduled' | 'completed' | 'draft';
  description: string | null;
  created_at: string;
  updated_at: string;
};

type Product = {
  id: string;
  user_id: string;
  campaign_id: string;
  name: string;
  description: string | null;
  image_url: string;
  category: string | null;
  tags: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type Generation = {
  id: string;
  campaign_id: string | null;
  original_image_url: string | null;
  generated_image_url: string | null;
  model_type: string | null;
  background: string | null;
  aspect_ratio: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
};

const statusLabels: Record<string, { label: string; style: string }> = {
  active: { label: '実施中', style: 'bg-green-50 text-green-700 border-green-200' },
  scheduled: { label: '予定', style: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed: { label: '完了', style: 'bg-gray-100 text-gray-600 border-gray-200' },
  draft: { label: '下書き', style: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
};

const tabs = [
  { key: 'info', label: '基本情報', icon: Settings2 },
  { key: 'products', label: '商品', icon: Package },
  { key: 'generations', label: '生成画像', icon: ImageIcon },
] as const;

type TabKey = typeof tabs[number]['key'];

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const supabase = createClient();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('info');

  // Fetch campaign + products + generations
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: campaignData } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('user_id', user.id)
        .single();

      if (!campaignData) {
        setLoading(false);
        return;
      }
      setCampaign(campaignData);

      const [productsRes, generationsRes] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('campaign_id', campaignId)
          .order('created_at', { ascending: false }),
        supabase
          .from('generations')
          .select('*')
          .eq('campaign_id', campaignId)
          .order('created_at', { ascending: false }),
      ]);

      setProducts(productsRes.data || []);
      setGenerations(generationsRes.data || []);
      setLoading(false);
    };

    fetchData();
  }, [campaignId]);

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3 opacity-40" />
        <p className="text-sm">読み込み中...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="py-32 flex flex-col items-center justify-center text-gray-400">
        <Megaphone size={48} className="mb-4 opacity-20" />
        <p className="text-sm mb-4">キャンペーンが見つかりません</p>
        <Link href="/dashboard/campaigns" className="text-xs text-black underline">
          一覧に戻る
        </Link>
      </div>
    );
  }

  const statusInfo = statusLabels[campaign.status] || statusLabels.draft;

  return (
    <>
      {/* Header */}
      <header className="mb-8">
        <Link
          href="/dashboard/campaigns"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          キャンペーン一覧
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">{campaign.name}</h2>
              <span className={`px-3 py-1 text-xs font-medium rounded-full border ${statusInfo.style}`}>
                {statusInfo.label}
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-1">
              作成日: {new Date(campaign.created_at).toLocaleDateString('ja-JP')}
              {campaign.description && ` · ${campaign.description}`}
            </p>
          </div>
          <Link
            href={`/dashboard/generate`}
            className="bg-black text-white px-5 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 rounded-lg shadow-lg shadow-black/10"
          >
            <ImageIcon className="w-4 h-4" />
            画像を生成
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-6 border-b border-gray-200 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.key === 'products' && (
                <span className="ml-1 text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{products.length}</span>
              )}
              {tab.key === 'generations' && (
                <span className="ml-1 text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{generations.length}</span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <CampaignInfoTab
          campaign={campaign}
          onUpdate={(updated) => setCampaign(updated)}
          onDelete={() => router.push('/dashboard/campaigns')}
        />
      )}

      {activeTab === 'products' && (
        <CampaignProductsTab
          campaignId={campaignId}
          products={products}
          setProducts={setProducts}
        />
      )}

      {activeTab === 'generations' && (
        <CampaignGenerationsTab generations={generations} />
      )}
    </>
  );
}

// ============================================================
// Tab: Campaign Info
// ============================================================

function CampaignInfoTab({
  campaign,
  onUpdate,
  onDelete,
}: {
  campaign: Campaign;
  onUpdate: (c: Campaign) => void;
  onDelete: () => void;
}) {
  const supabase = createClient();
  const [name, setName] = useState(campaign.name);
  const [description, setDescription] = useState(campaign.description || '');
  const [status, setStatus] = useState(campaign.status);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const hasChanges = name !== campaign.name || description !== (campaign.description || '') || status !== campaign.status;

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { data, error } = await supabase
      .from('campaigns')
      .update({ name: name.trim(), description: description.trim() || null, status })
      .eq('id', campaign.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (data && !error) {
      onUpdate(data);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('campaigns').delete().eq('id', campaign.id).eq('user_id', user.id);
    }
    onDelete();
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1">キャンペーン名</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/10 outline-none font-medium"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1">説明</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="キャンペーンの説明を入力..."
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/10 outline-none h-28 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">ステータス</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['draft', 'active', 'scheduled', 'completed'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`py-2.5 rounded-lg text-sm border transition-all font-medium ${
                  status === s
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {statusLabels[s].label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-gray-100 gap-3">
          <div className="text-xs text-gray-400">
            最終更新: {new Date(campaign.updated_at).toLocaleString('ja-JP')}
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges || !name.trim()}
            className={`px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-black/10 flex items-center gap-2 text-sm ${
              saving || !hasChanges || !name.trim()
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            保存
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border border-red-100 shadow-sm p-6">
        <h3 className="text-sm font-bold text-red-600 mb-2">危険な操作</h3>
        <p className="text-xs text-gray-500 mb-4">
          キャンペーンを削除すると、紐づく商品も全て削除されます。この操作は取り消せません。
        </p>
        {confirmDelete ? (
          <div className="flex items-center gap-3">
            <span className="text-xs text-red-500 font-medium">本当に削除しますか？</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5"
            >
              {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              削除する
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-4 py-2 text-xs text-gray-500 hover:text-black transition-colors"
            >
              キャンセル
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="px-4 py-2 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3 h-3" />
            キャンペーンを削除
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Tab: Products
// ============================================================

function CampaignProductsTab({
  campaignId,
  products,
  setProducts,
}: {
  campaignId: string;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}) {
  const supabase = createClient();
  const [showAddForm, setShowAddForm] = useState(false);

  const handleDelete = async (id: string) => {
    await supabase.from('products').delete().eq('id', id);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleToggleActive = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    await supabase.from('products').update({ is_active: !product.is_active }).eq('id', id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !p.is_active } : p));
  };

  const handleProductAdded = (product: Product) => {
    setProducts(prev => [product, ...prev]);
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{products.length} 件の商品</p>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium shadow-lg shadow-black/10"
        >
          <Plus className="w-4 h-4" />
          商品を追加
        </button>
      </div>

      {/* Inline Add Form */}
      {showAddForm && (
        <InlineAddProduct
          campaignId={campaignId}
          onAdded={handleProductAdded}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Product Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => (
            <div
              key={product.id}
              className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              <div className="h-56 w-full relative bg-gray-100">
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-1.5 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-red-500/80 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 truncate">{product.name}</h4>
                    {product.category && (
                      <span className="text-[10px] text-gray-500">{product.category}</span>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {product.tags?.map(tag => (
                        <span key={tag} className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">#{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div
                    className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-2"
                    onClick={() => handleToggleActive(product.id)}
                  >
                    <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${product.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                      <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${product.is_active ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !showAddForm ? (
        <div className="py-16 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
          <Package size={48} className="mb-4 opacity-20" />
          <p className="text-sm">このキャンペーンに商品がありません</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-3 text-xs bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            最初の商品を追加
          </button>
        </div>
      ) : null}
    </div>
  );
}

function InlineAddProduct({
  campaignId,
  onAdded,
  onCancel,
}: {
  campaignId: string;
  onAdded: (product: Product) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) { setError('画像ファイルのみ。'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('10MB以下にしてください。'); return; }
    setError(null);
    setUploadedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleSubmit = async () => {
    if (!uploadedFile || !name.trim()) { setError('商品名と画像は必須です。'); return; }
    setUploading(true); setError(null);

    try {
      // Convert file to base64 data URI
      const toDataUri = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

      const imageData = await toDataUri(uploadedFile);

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          campaignId,
          imageData,
          category: category.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '追加に失敗しました。');

      onAdded(json.product);
    } catch (err) {
      setError(err instanceof Error ? err.message : '追加に失敗しました。');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm text-gray-900">商品を追加</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-black">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Image Upload */}
        <div>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          {previewUrl ? (
            <div className="relative group">
              <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <Image src={previewUrl} alt="preview" fill className="object-contain" unoptimized />
              </div>
              <button
                onClick={() => { setUploadedFile(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }}
                className="absolute top-2 right-2 w-6 h-6 bg-black/70 hover:bg-black text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer transition-colors group ${
                isDragging ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-black'
              }`}
            >
              <Upload className="w-6 h-6 text-gray-300 group-hover:text-black transition-colors mb-2" />
              <p className="text-xs text-gray-400">画像をアップロード</p>
            </div>
          )}
        </div>

        {/* Fields */}
        <div className="md:col-span-2 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">商品名 *</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="例: オーバーサイズTシャツ"
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">カテゴリ</label>
            <select
              value={category} onChange={e => setCategory(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none text-sm"
            >
              <option value="">なし</option>
              <option value="トップス">トップス</option>
              <option value="ボトムス">ボトムス</option>
              <option value="ワンピース">ワンピース</option>
              <option value="アウター">アウター</option>
              <option value="アクセサリー">アクセサリー</option>
              <option value="シューズ">シューズ</option>
              <option value="バッグ">バッグ</option>
              <option value="その他">その他</option>
            </select>
          </div>

          {error && (
            <div className="p-2.5 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={uploading || !uploadedFile || !name.trim()}
              className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                uploading || !uploadedFile || !name.trim()
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800 shadow-lg shadow-black/10'
              }`}
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {uploading ? '追加中...' : '追加する'}
            </button>
            <button onClick={onCancel} className="px-4 py-2.5 text-sm text-gray-500 hover:text-black transition-colors">
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Tab: Generations
// ============================================================

function CampaignGenerationsTab({ generations }: { generations: Generation[] }) {
  const completed = generations.filter(g => g.status === 'completed');
  const pending = generations.filter(g => g.status !== 'completed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{generations.length} 件の生成画像</p>
        <Link
          href="/dashboard/generate"
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium shadow-lg shadow-black/10"
        >
          <ImageIcon className="w-4 h-4" />
          新規生成
        </Link>
      </div>

      {/* Completed Generations */}
      {completed.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {completed.map(gen => (
            <div key={gen.id} className="group rounded-xl border border-gray-100 shadow-sm overflow-hidden bg-white hover:shadow-md transition-all">
              <div className="relative aspect-square bg-gray-100">
                {gen.generated_image_url && (
                  <Image
                    src={gen.generated_image_url}
                    alt="生成結果"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors">
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {gen.generated_image_url && (
                      <a
                        href={gen.generated_image_url}
                        download
                        className="p-2 bg-white/90 rounded-lg text-gray-700 hover:bg-white transition-colors inline-block"
                        onClick={e => e.stopPropagation()}
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">
                    {new Date(gen.created_at).toLocaleDateString('ja-JP')}
                  </span>
                  {gen.background && (
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{gen.background}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
          <ImageIcon size={48} className="mb-4 opacity-20" />
          <p className="text-sm">生成された画像がありません</p>
          <Link
            href="/dashboard/generate"
            className="mt-3 text-xs bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            画像を生成する
          </Link>
        </div>
      )}

      {/* Pending/Failed */}
      {pending.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">処理中 / 失敗</h4>
          <div className="space-y-2">
            {pending.map(gen => (
              <div key={gen.id} className="flex items-center gap-4 bg-white rounded-lg border border-gray-100 p-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {gen.status === 'failed' ? (
                    <X className="w-5 h-5 text-red-400" />
                  ) : (
                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-700 font-medium">
                    {gen.status === 'pending' ? '待機中' : gen.status === 'processing' ? '処理中' : '失敗'}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {new Date(gen.created_at).toLocaleString('ja-JP')}
                  </p>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                  gen.status === 'failed'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-yellow-50 text-yellow-600'
                }`}>
                  {gen.status === 'pending' ? '待機中' : gen.status === 'processing' ? '処理中' : '失敗'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
