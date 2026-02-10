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
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Sparkles,
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
  const [view, setView] = useState<'list' | 'add' | 'details' | 'csv'>('list');
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

  const handleProductsImported = (imported: Product[]) => {
    setProducts(prev => [...imported, ...prev]);
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
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">商品管理</h2>
          <p className="text-gray-500 mt-1 text-sm">キャンペーンに紐づく商品の登録・管理を行います</p>
        </div>
        {view === 'list' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('csv')}
              className="flex items-center gap-2 border border-gray-200 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <FileSpreadsheet size={16} />
              <span>CSVインポート</span>
            </button>
            <button
              onClick={() => setView('add')}
              className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-colors shadow-lg shadow-black/10 text-sm font-medium"
            >
              <Plus size={16} />
              <span>商品を追加</span>
            </button>
          </div>
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

        {view === 'csv' && (
          <CSVImportView
            onBack={handleBack}
            campaigns={campaigns}
            selectedCampaignId={selectedCampaignId}
            onProductsImported={handleProductsImported}
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
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
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
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
  // Mode state
  const [mode, setMode] = useState<'upload' | 'generate'>('upload');
  
  // Common state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [campaignId, setCampaignId] = useState(selectedCampaignId || '');
  const [error, setError] = useState<string | null>(null);
  
  // Upload mode state
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Generate mode state
  const [genPrompt, setGenPrompt] = useState('');
  const [genStyle, setGenStyle] = useState('');
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

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

  // Generate AI product preview
  const handleGeneratePreview = async () => {
    if (!genPrompt.trim()) {
      setGenerateError('商品の説明を入力してください。');
      return;
    }

    setIsGenerating(true);
    setGenerateError(null);
    setGeneratedPreview(null);

    try {
      const prompt = `Professional product photography of ${genPrompt.trim()}. Clean white background, studio lighting, high quality, photorealistic, 8k resolution, sharp focus.${genStyle ? ` Style: ${genStyle}.` : ''}`;

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'generate',
          prompt,
          aspectRatio: '1:1',
        }),
      });

      if (!response.ok && !response.body) {
        throw new Error('サーバーエラーが発生しました。');
      }

      // Read SSE stream
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lastNewline = buffer.lastIndexOf('\n');
        if (lastNewline === -1) continue;

        const complete = buffer.substring(0, lastNewline);
        buffer = buffer.substring(lastNewline + 1);
        const lines = complete.split('\n');

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            let data: Record<string, unknown>;
            try {
              data = JSON.parse(line.slice(6));
            } catch {
              continue;
            }

            if (currentEvent === 'complete') {
              setGeneratedPreview(data.image as string);
            } else if (currentEvent === 'error') {
              throw new Error((data.error as string) || '生成に失敗しました。');
            }
            currentEvent = '';
          }
        }
      }
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : '生成に失敗しました。');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !campaignId) {
      setError('商品名とキャンペーンは必須です。');
      return;
    }

    const hasImage = mode === 'upload' ? !!uploadedFile : !!generatedPreview;
    if (!hasImage) {
      setError(mode === 'upload' ? '画像をアップロードしてください。' : 'まずプレビューを生成してください。');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      let imageData: string;
      
      if (mode === 'upload' && uploadedFile) {
        // Convert file to base64 data URI
        const toDataUri = (file: File): Promise<string> =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        imageData = await toDataUri(uploadedFile);
      } else if (mode === 'generate' && generatedPreview) {
        imageData = generatedPreview;
      } else {
        throw new Error('画像が見つかりません。');
      }

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          campaignId,
          imageData,
          description: description.trim() || null,
          category: category.trim() || null,
          tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(Boolean) : null,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '登録失敗');

      onProductAdded(json.product);
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
        {/* Mode Tabs */}
        <div className="border-b border-gray-100 flex">
          <button 
            onClick={() => setMode('upload')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              mode === 'upload' ? 'bg-gray-50 text-black border-b-2 border-black' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Upload size={16} />
            画像をアップロード
          </button>
          <button 
            onClick={() => setMode('generate')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              mode === 'generate' ? 'bg-gray-50 text-black border-b-2 border-black' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Sparkles size={16} />
            AIで画像を生成
          </button>
        </div>

        <div className="p-8">
          {mode === 'upload' ? (
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
          ) : (
            /* Generate Mode */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Generation Form */}
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">商品の説明 <span className="text-red-400">*</span></label>
                  <textarea 
                    value={genPrompt}
                    onChange={(e) => setGenPrompt(e.target.value)}
                    placeholder="例: 白いオーバーサイズTシャツ、コットン素材、シンプルなデザイン..." 
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none h-32 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">スタイル・追加要素</label>
                  <input 
                    value={genStyle}
                    onChange={(e) => setGenStyle(e.target.value)}
                    placeholder="例: ミニマル、ヴィンテージ、モダン..." 
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none"
                  />
                </div>
                <button
                  onClick={handleGeneratePreview}
                  disabled={isGenerating || !genPrompt.trim()}
                  className={`w-full py-3 rounded-lg font-medium shadow-lg shadow-black/10 transition-all flex items-center justify-center gap-2 ${
                    isGenerating || !genPrompt.trim()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      プレビューを生成
                    </>
                  )}
                </button>
                {generateError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                    <p className="text-xs text-red-600">{generateError}</p>
                  </div>
                )}
                
                {/* Common form fields */}
                <div className="border-t border-gray-200 pt-5 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">キャンペーン <span className="text-red-400">*</span></label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">商品名 <span className="text-red-400">*</span></label>
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

              {/* Preview Area */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center min-h-[400px] overflow-hidden relative">
                {isGenerating ? (
                  <div className="text-center">
                    <Loader2 className="w-10 h-10 text-gray-400 animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-500">AI商品画像を生成中...</p>
                    <p className="text-xs text-gray-400 mt-1">30秒〜1分ほどかかります</p>
                  </div>
                ) : generatedPreview ? (
                  <div className="relative w-full h-full min-h-[400px]">
                    <Image
                      src={generatedPreview}
                      alt="生成された商品画像"
                      fill
                      className="object-contain rounded-xl"
                      unoptimized
                    />
                    <button
                      onClick={handleGeneratePreview}
                      className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/70 hover:bg-black text-white text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles size={12} />
                      再生成
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <div className="mx-auto w-16 h-16 mb-3 bg-gray-200 rounded-full flex items-center justify-center">
                      <Package size={32} className="text-gray-300" />
                    </div>
                    <p className="text-sm">プレビューがここに表示されます</p>
                    <p className="text-xs text-gray-400 mt-1">左の設定を入力して「プレビューを生成」を押してください</p>
                  </div>
                )}
              </div>
            </div>
          )}

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
            disabled={uploading || !name.trim() || !campaignId || (mode === 'upload' ? !uploadedFile : !generatedPreview)}
            className={`px-5 py-2.5 font-medium rounded-lg transition-colors shadow-lg shadow-black/10 flex items-center gap-2 ${
              uploading || !name.trim() || !campaignId || (mode === 'upload' ? !uploadedFile : !generatedPreview)
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

// --- CSV Import ---

type ParsedRow = {
  name: string;
  image_url: string;
  description: string;
  category: string;
  tags: string;
  valid: boolean;
  error?: string;
};

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      lines.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) lines.push(current);

  const rows = lines.map(line => {
    const cells: string[] = [];
    let cell = '';
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (q && line[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          q = !q;
        }
      } else if (ch === ',' && !q) {
        cells.push(cell);
        cell = '';
      } else {
        cell += ch;
      }
    }
    cells.push(cell);
    return cells;
  });

  const headers = rows[0]?.map(h => h.trim().toLowerCase()) || [];
  return { headers, rows: rows.slice(1) };
}

function CSVImportView({
  onBack,
  campaigns,
  selectedCampaignId,
  onProductsImported,
}: {
  onBack: () => void;
  campaigns: Campaign[];
  selectedCampaignId: string | null;
  onProductsImported: (products: Product[]) => void;
}) {
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [campaignId, setCampaignId] = useState(selectedCampaignId || '');
  const [importing, setImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{
    success: number;
    failed: Array<{ index: number; name: string; error: string }>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setError('CSVファイルのみアップロードできます。');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text?.trim()) {
        setError('ファイルが空です。');
        return;
      }

      const { headers, rows } = parseCSV(text);

      // Validate headers
      const nameIdx = headers.indexOf('name');
      const imageIdx = headers.indexOf('image_url');

      if (nameIdx === -1) {
        setError('CSVに "name" 列が見つかりません。ヘッダー行に name を含めてください。');
        return;
      }
      if (imageIdx === -1) {
        setError('CSVに "image_url" 列が見つかりません。ヘッダー行に image_url を含めてください。');
        return;
      }

      const descIdx = headers.indexOf('description');
      const catIdx = headers.indexOf('category');
      const tagsIdx = headers.indexOf('tags');

      const parsed: ParsedRow[] = rows
        .filter(row => row.some(cell => cell.trim()))
        .map(row => {
          const name = row[nameIdx]?.trim() || '';
          const image_url = row[imageIdx]?.trim() || '';
          const description = descIdx >= 0 ? row[descIdx]?.trim() || '' : '';
          const category = catIdx >= 0 ? row[catIdx]?.trim() || '' : '';
          const tags = tagsIdx >= 0 ? row[tagsIdx]?.trim() || '' : '';

          let valid = true;
          let errorMsg: string | undefined;

          if (!name) {
            valid = false;
            errorMsg = '商品名が空です';
          } else if (!image_url) {
            valid = false;
            errorMsg = '画像URLが空です';
          }

          return { name, image_url, description, category, tags, valid, error: errorMsg };
        });

      if (parsed.length === 0) {
        setError('インポートできる行がありません。');
        return;
      }

      setParsedRows(parsed);
      setStep('preview');
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const validCount = parsedRows.filter(r => r.valid).length;
  const invalidCount = parsedRows.filter(r => !r.valid).length;

  const handleImport = async () => {
    if (!campaignId) {
      setError('キャンペーンを選択してください。');
      return;
    }

    const validRows = parsedRows.filter(r => r.valid);
    if (validRows.length === 0) {
      setError('有効な行がありません。');
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          products: validRows.map(r => ({
            name: r.name,
            image_url: r.image_url,
            description: r.description || undefined,
            category: r.category || undefined,
            tags: r.tags || undefined,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'インポートに失敗しました。');
        return;
      }

      setResults({
        success: data.imported,
        failed: data.failed || [],
      });
      setStep('done');

      if (data.products?.length > 0) {
        onProductsImported(data.products);
      }
    } catch {
      setError('インポート中にエラーが発生しました。');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <button onClick={onBack} className="hover:text-black transition-colors">商品一覧</button>
        <ChevronRight size={14} />
        <span className="text-black font-medium">CSVインポート</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Upload Step */}
        {step === 'upload' && (
          <div className="p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-2">CSVファイルをアップロード</h3>
            <p className="text-sm text-gray-500 mb-6">
              商品データを含むCSVファイルを選択してください。
            </p>

            {/* Format guide */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs font-bold text-gray-700 mb-2">CSV形式</p>
              <p className="text-xs text-gray-500 mb-2">
                ヘッダー行に以下の列名を含めてください（<span className="text-red-500">*</span> は必須）:
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-white border border-gray-200 px-2 py-1 rounded font-mono">name<span className="text-red-500">*</span></span>
                <span className="bg-white border border-gray-200 px-2 py-1 rounded font-mono">image_url<span className="text-red-500">*</span></span>
                <span className="bg-white border border-gray-200 px-2 py-1 rounded font-mono">description</span>
                <span className="bg-white border border-gray-200 px-2 py-1 rounded font-mono">category</span>
                <span className="bg-white border border-gray-200 px-2 py-1 rounded font-mono">tags</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                例: name,image_url,description,category,tags
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />

            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group ${
                isDragging ? 'border-black bg-gray-50' : 'border-gray-200'
              }`}
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-white group-hover:shadow-md transition-all">
                <FileSpreadsheet className="text-gray-400 group-hover:text-black" size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">CSVファイルをドラッグ＆ドロップ</h3>
              <p className="text-sm text-gray-500 mb-6">または クリックしてファイルを選択</p>
              <p className="text-xs text-gray-400">.csv ファイル</p>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Preview Step */}
        {step === 'preview' && (
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">プレビュー</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {parsedRows.length}件の商品が見つかりました
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 size={14} />
                  {validCount}件 有効
                </span>
                {invalidCount > 0 && (
                  <span className="flex items-center gap-1 text-red-500">
                    <AlertCircle size={14} />
                    {invalidCount}件 エラー
                  </span>
                )}
              </div>
            </div>

            {/* Campaign selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">インポート先キャンペーン *</label>
              <select
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                className="w-full max-w-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none"
              >
                <option value="">選択してください</option>
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Preview table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3 w-12">#</th>
                      <th className="px-4 py-3">商品名</th>
                      <th className="px-4 py-3">画像URL</th>
                      <th className="px-4 py-3">説明</th>
                      <th className="px-4 py-3">カテゴリ</th>
                      <th className="px-4 py-3">タグ</th>
                      <th className="px-4 py-3 w-24">状態</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsedRows.map((row, i) => (
                      <tr
                        key={i}
                        className={row.valid ? 'hover:bg-gray-50' : 'bg-red-50/50'}
                      >
                        <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 max-w-[160px] truncate">{row.name || '—'}</td>
                        <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate font-mono text-xs">{row.image_url || '—'}</td>
                        <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate">{row.description || '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{row.category || '—'}</td>
                        <td className="px-4 py-3 text-gray-500 max-w-[120px] truncate">{row.tags || '—'}</td>
                        <td className="px-4 py-3">
                          {row.valid ? (
                            <span className="inline-flex items-center gap-1 text-green-600 text-xs">
                              <CheckCircle2 size={12} />
                              OK
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-500 text-xs" title={row.error}>
                              <AlertCircle size={12} />
                              {row.error}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Done Step */}
        {step === 'done' && results && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="text-green-500" size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">インポート完了</h3>
            <p className="text-sm text-gray-500 mb-6">
              {results.success}件の商品を正常にインポートしました。
              {results.failed.length > 0 && ` ${results.failed.length}件がスキップされました。`}
            </p>

            {results.failed.length > 0 && (
              <div className="max-w-md mx-auto mb-6 text-left">
                <p className="text-xs font-medium text-gray-700 mb-2">スキップされた行:</p>
                <div className="bg-red-50 rounded-lg p-3 space-y-1">
                  {results.failed.map((f, i) => (
                    <p key={i} className="text-xs text-red-600">
                      行 {f.index + 1}: {f.name} — {f.error}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={onBack}
              className="px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium shadow-lg shadow-black/10"
            >
              商品一覧に戻る
            </button>
          </div>
        )}

        {/* Footer Actions (preview step only) */}
        {step === 'preview' && (
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
            <button
              onClick={() => { setStep('upload'); setParsedRows([]); setError(null); }}
              className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors text-sm"
            >
              ファイルを変更
            </button>
            <div className="flex gap-3">
              <button
                onClick={onBack}
                className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleImport}
                disabled={importing || validCount === 0 || !campaignId}
                className={`px-5 py-2.5 font-medium rounded-lg transition-colors shadow-lg shadow-black/10 flex items-center gap-2 ${
                  importing || validCount === 0 || !campaignId
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    インポート中...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    {validCount}件をインポート
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
