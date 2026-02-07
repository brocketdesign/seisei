"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  Package,
  Plus,
  Search,
  Upload,
  X,
  ChevronRight,
  MoreHorizontal,
  FolderOpen,
  ChevronDown,
  Trash2,
  Edit3,
  Check,
  Loader2,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

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

type Campaign = {
  id: string;
  name: string;
  status: 'active' | 'scheduled' | 'completed' | 'draft';
};

export default function ProductsPage() {
  const [view, setView] = useState<'list' | 'add' | 'details'>('list');
  const [products, setProducts] = useState<Product[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const supabase = createClient();

  // Fetch campaigns
  useEffect(() => {
    const fetchCampaigns = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('campaigns')
        .select('id, name, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setCampaigns(data);
        setSelectedCampaignId(data[0].id);
      }
    };
    fetchCampaigns();
  }, []);

  // Fetch products for selected campaign
  useEffect(() => {
    if (!selectedCampaignId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('campaign_id', selectedCampaignId)
        .order('created_at', { ascending: false });

      setProducts(data || []);
      setLoading(false);
    };
    fetchProducts();
  }, [selectedCampaignId]);

  const handleDeleteProduct = async (id: string) => {
    await supabase.from('products').delete().eq('id', id);
    setProducts(products.filter(p => p.id !== id));
  };

  const handleToggleActive = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    await supabase.from('products').update({ is_active: !product.is_active }).eq('id', id);
    setProducts(products.map(p => p.id === id ? { ...p, is_active: !p.is_active } : p));
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setView('details');
  };

  const handleBack = () => {
    setView('list');
    setSelectedProduct(null);
  };

  const handleProductAdded = (product: Product) => {
    setProducts(prev => [product, ...prev]);
    setView('list');
  };

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

  const filteredProducts = products.filter(p => {
    if (filterStatus === 'all') return true;
    return filterStatus === 'active' ? p.is_active : !p.is_active;
  });

  return (
    <>
      {/* Header */}
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">商品管理</h2>
          <p className="text-gray-500 mt-1 text-sm">キャンペーンに紐づく商品の登録・管理を行います</p>
        </div>
        {view === 'list' && (
          <button
            onClick={() => setView('add')}
            className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-colors shadow-lg shadow-black/10 text-sm font-medium"
          >
            <Plus size={16} />
            <span>商品を追加</span>
          </button>
        )}
      </header>

      {/* Main Content */}
      <div>
        {view === 'list' && (
          <ListView
            products={filteredProducts}
            campaigns={campaigns}
            selectedCampaignId={selectedCampaignId}
            setSelectedCampaignId={setSelectedCampaignId}
            loading={loading}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            onProductClick={handleProductClick}
            onToggleActive={handleToggleActive}
            onDelete={handleDeleteProduct}
          />
        )}

        {view === 'add' && (
          <AddProductView
            onBack={handleBack}
            campaigns={campaigns}
            selectedCampaignId={selectedCampaignId}
            onProductAdded={handleProductAdded}
          />
        )}

        {view === 'details' && selectedProduct && (
          <ProductDetailsView
            product={selectedProduct}
            campaigns={campaigns}
            onBack={handleBack}
            onSave={async (updated) => {
              await supabase.from('products').update({
                name: updated.name,
                description: updated.description,
                category: updated.category,
                tags: updated.tags,
                is_active: updated.is_active,
              }).eq('id', updated.id);
              setProducts(products.map(p => p.id === updated.id ? updated : p));
              handleBack();
            }}
            onDelete={async () => {
              await handleDeleteProduct(selectedProduct.id);
              handleBack();
            }}
          />
        )}
      </div>
    </>
  );
}

// --- Sub-Components ---

function CampaignSelector({
  campaigns,
  selectedCampaignId,
  setSelectedCampaignId,
}: {
  campaigns: Campaign[];
  selectedCampaignId: string | null;
  setSelectedCampaignId: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = campaigns.find(c => c.id === selectedCampaignId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:border-black transition-colors text-left min-w-[240px]"
      >
        <FolderOpen className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <span className="text-sm font-medium text-gray-900 truncate">
          {selected?.name || 'キャンペーンを選択'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 ml-auto flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden min-w-[240px]">
          {campaigns.map((c) => (
            <button
              key={c.id}
              onClick={() => { setSelectedCampaignId(c.id); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors ${
                selectedCampaignId === c.id ? 'bg-gray-50 font-medium text-black' : 'text-gray-700'
              }`}
            >
              <FolderOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">{c.name}</span>
              {selectedCampaignId === c.id && (
                <span className="ml-auto text-[10px] bg-black text-white px-1.5 py-0.5 rounded">選択中</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ListView({
  products,
  campaigns,
  selectedCampaignId,
  setSelectedCampaignId,
  loading,
  filterStatus,
  setFilterStatus,
  onProductClick,
  onToggleActive,
  onDelete,
}: {
  products: Product[];
  campaigns: Campaign[];
  selectedCampaignId: string | null;
  setSelectedCampaignId: (id: string) => void;
  loading: boolean;
  filterStatus: 'all' | 'active' | 'inactive';
  setFilterStatus: (s: 'all' | 'active' | 'inactive') => void;
  onProductClick: (p: Product) => void;
  onToggleActive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Campaign Selector + Filters */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <CampaignSelector
          campaigns={campaigns}
          selectedCampaignId={selectedCampaignId}
          setSelectedCampaignId={setSelectedCampaignId}
        />
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="商品を検索..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-black/5 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'すべて' : status === 'active' ? '有効' : '無効'}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3 opacity-40" />
          <p className="text-sm">読み込み中...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
          <FolderOpen size={48} className="mb-4 opacity-20" />
          <p className="text-sm mb-2">キャンペーンがありません</p>
          <p className="text-xs text-gray-300">先にキャンペーンを作成してください</p>
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => (
              <div
                key={product.id}
                className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer"
                onClick={() => onProductClick(product)}
              >
                <div className="h-64 w-full relative flex items-center justify-center bg-gray-100">
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(product.id); }}
                      className="p-1.5 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-red-500/80 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{product.name}</h3>
                      {product.category && (
                        <span className="text-xs text-gray-500">{product.category}</span>
                      )}
                      <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-1">
                        {product.tags?.map(tag => (
                          <span key={tag} className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">#{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div
                      className="relative inline-flex items-center cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); onToggleActive(product.id); }}
                    >
                      <div className={`w-10 h-6 rounded-full p-1 transition-colors ${product.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${product.is_active ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3 mt-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${product.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {product.is_active ? '有効' : '無効'}
                    </span>
                    <span className="text-[10px]">{new Date(product.created_at).toLocaleDateString('ja-JP')}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {products.length === 0 && !loading && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                <Package size={48} className="mb-4 opacity-20" />
                <p className="text-sm">このキャンペーンに商品がありません</p>
                <p className="text-xs text-gray-300 mt-1">「商品を追加」から商品を登録してください</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function AddProductView({
  onBack,
  campaigns,
  selectedCampaignId,
  onProductAdded,
}: {
  onBack: () => void;
  campaigns: Campaign[];
  selectedCampaignId: string | null;
  onProductAdded: (product: Product) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [campaignId, setCampaignId] = useState(selectedCampaignId || '');
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('画像ファイルのみアップロードできます。');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('ファイルサイズは10MB以下にしてください。');
      return;
    }
    setError(null);
    setUploadedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeUpload = useCallback(() => {
    setUploadedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [previewUrl]);

  const handleSubmit = async () => {
    if (!uploadedFile || !name.trim() || !campaignId) {
      setError('商品名、画像、キャンペーンは必須です。');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ログインが必要です。');

      // Upload image to Supabase Storage
      const ext = uploadedFile.name.split('.').pop() || 'jpg';
      const fileName = `products/${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('generation-images')
        .upload(fileName, uploadedFile, {
          contentType: uploadedFile.type,
          upsert: false,
        });

      if (uploadError) throw new Error(`アップロード失敗: ${uploadError.message}`);

      const { data: urlData } = supabase.storage
        .from('generation-images')
        .getPublicUrl(fileName);

      const imageUrl = urlData.publicUrl;

      // Insert product record
      const { data: product, error: insertError } = await supabase
        .from('products')
        .insert({
          user_id: user.id,
          campaign_id: campaignId,
          name: name.trim(),
          description: description.trim() || null,
          image_url: imageUrl,
          category: category.trim() || null,
          tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(Boolean) : null,
          is_active: true,
        })
        .select()
        .single();

      if (insertError) throw new Error(`登録失敗: ${insertError.message}`);

      onProductAdded(product);
    } catch (err) {
      setError(err instanceof Error ? err.message : '商品の登録に失敗しました。');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <button onClick={onBack} className="hover:text-black transition-colors">商品一覧</button>
        <ChevronRight size={14} />
        <span className="text-black font-medium">新規登録</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Image Upload */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-4">商品画像</h3>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />

              {previewUrl ? (
                <div className="relative group">
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                    <Image
                      src={previewUrl}
                      alt="プレビュー"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <button
                    onClick={removeUpload}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/70 hover:bg-black text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-gray-400 hover:text-black underline mt-2"
                  >
                    別の画像を選択
                  </button>
                </div>
              ) : (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group ${
                    isDragging ? 'border-black bg-gray-50' : 'border-gray-200'
                  }`}
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-white group-hover:shadow-md transition-all">
                    <Upload className="text-gray-400 group-hover:text-black" size={24} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">写真をドラッグ＆ドロップ</h3>
                  <p className="text-sm text-gray-500 mb-6">または クリックしてファイルを選択</p>
                  <p className="text-xs text-gray-400">JPG, PNG, WebP (最大 10MB)</p>
                </div>
              )}
            </div>

            {/* Form */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">キャンペーン *</label>
                <select
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none"
                >
                  <option value="">選択してください</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">商品名 *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例: オーバーサイズTシャツ"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="商品の説明を入力..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none h-24 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none"
                >
                  <option value="">選択してください</option>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">タグ (カンマ区切り)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="例: カジュアル, 夏物, コットン"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-6 p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onBack}
            className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading || !uploadedFile || !name.trim() || !campaignId}
            className={`px-5 py-2.5 font-medium rounded-lg transition-colors shadow-lg shadow-black/10 flex items-center gap-2 ${
              uploading || !uploadedFile || !name.trim() || !campaignId
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                登録中...
              </>
            ) : (
              '登録する'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductDetailsView({
  product,
  campaigns,
  onBack,
  onSave,
  onDelete,
}: {
  product: Product;
  campaigns: Campaign[];
  onBack: () => void;
  onSave: (updated: Product) => void;
  onDelete: () => void;
}) {
  const [formData, setFormData] = useState(product);
  const [tagInput, setTagInput] = useState(product.tags?.join(', ') || '');
  const campaignName = campaigns.find(c => c.id === product.campaign_id)?.name || '不明';

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <button onClick={onBack} className="hover:text-black transition-colors">商品一覧</button>
        <ChevronRight size={14} />
        <span className="text-black font-medium">{product.name}</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Image */}
          <div className="w-full md:w-1/3 flex flex-col items-center">
            <div className="w-48 h-48 rounded-xl overflow-hidden shadow-inner relative bg-gray-100">
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-3">キャンペーン: {campaignName}</p>
          </div>

          {/* Form */}
          <div className="flex-1 space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">商品名</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/10 outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">説明</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/10 outline-none h-24 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">カテゴリ</label>
              <select
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
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

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">タグ (カンマ区切り)</label>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value);
                  setFormData({
                    ...formData,
                    tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean),
                  });
                }}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <span className="block text-sm font-bold text-gray-900">有効 / 無効</span>
                <span className="text-xs text-gray-500">画像生成時にこの商品を表示します</span>
              </div>
              <button
                onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.is_active ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.is_active ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-between">
              <button
                onClick={onDelete}
                className="px-4 py-2.5 rounded-lg text-red-600 hover:bg-red-50 font-medium transition-colors text-sm flex items-center gap-2"
              >
                <Trash2 size={14} />
                削除
              </button>
              <div className="flex gap-3">
                <button
                  onClick={onBack}
                  className="px-6 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => onSave(formData)}
                  className="px-6 py-2.5 rounded-lg bg-black text-white hover:bg-gray-800 font-medium transition-colors shadow-lg shadow-black/10 flex items-center gap-2"
                >
                  <Check size={16} />
                  変更を保存
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
