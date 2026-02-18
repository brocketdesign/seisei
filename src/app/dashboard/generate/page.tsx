"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Upload,
  Plus,
  Download,
  Share2,
  Image as ImageIcon,
  Megaphone,
  ChevronDown,
  FolderOpen,
  X,
  Loader2,
  Package,
  RefreshCw,
} from 'lucide-react';

import { createClient } from '@/utils/supabase/client';
import { AIModel } from '@/types/models';

type Campaign = {
  id: string;
  name: string;
  status: 'active' | 'scheduled' | 'completed' | 'draft';
};

type Product = {
  id: string;
  campaign_id: string;
  name: string;
  description: string | null;
  image_url: string;
  category: string | null;
  tags: string[] | null;
  is_active: boolean;
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Compare two images by drawing them onto small canvases and diffing pixels.
 * Returns a similarity score between 0 (completely different) and 1 (identical).
 */
function compareImages(src1: string, src2: string): Promise<number> {
  return new Promise((resolve) => {
    const img1 = new window.Image();
    const img2 = new window.Image();
    let loaded = 0;

    const onLoad = () => {
      if (++loaded < 2) return;
      const size = 64;
      const c1 = document.createElement('canvas');
      const c2 = document.createElement('canvas');
      c1.width = c2.width = size;
      c1.height = c2.height = size;
      const ctx1 = c1.getContext('2d')!;
      const ctx2 = c2.getContext('2d')!;
      ctx1.drawImage(img1, 0, 0, size, size);
      ctx2.drawImage(img2, 0, 0, size, size);
      const d1 = ctx1.getImageData(0, 0, size, size).data;
      const d2 = ctx2.getImageData(0, 0, size, size).data;
      let diff = 0;
      for (let i = 0; i < d1.length; i += 4) {
        diff += Math.abs(d1[i] - d2[i]);
        diff += Math.abs(d1[i + 1] - d2[i + 1]);
        diff += Math.abs(d1[i + 2] - d2[i + 2]);
      }
      resolve(1 - diff / (size * size * 3 * 255));
    };

    const onError = () => resolve(-1);
    img1.onload = onLoad;
    img2.onload = onLoad;
    img1.onerror = onError;
    img2.onerror = onError;
    img1.src = src1;
    img2.src = src2;
  });
}

export default function GeneratePage() {
  const supabase = createClient();

  // Campaign state (from Supabase)
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [campaignsLoading, setCampaignsLoading] = useState(true);

  // Products state (from Supabase, filtered by campaign)
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [productsLoading, setProductsLoading] = useState(false);

  // Quick-add product state
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddFile, setQuickAddFile] = useState<File | null>(null);
  const [quickAddPreview, setQuickAddPreview] = useState<string | null>(null);
  const [quickAddUploading, setQuickAddUploading] = useState(false);
  const quickAddFileRef = useRef<HTMLInputElement>(null);

  // Upload state (manual upload for generation, used when no product is selected)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Models loaded from database
  const [activeModels, setActiveModels] = useState<AIModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);

  // Generation settings
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const selectedModel = selectedModelId
    ? activeModels.find(m => m.id === selectedModelId) ?? null
    : activeModels[0] ?? null;
  const [background, setBackground] = useState('スタジオ（白背景）');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [faceSwapOnly, setFaceSwapOnly] = useState(false);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [currentStepNum, setCurrentStepNum] = useState(0);
  const [totalSteps, setTotalSteps] = useState(4);
  const [faceSwapWarning, setFaceSwapWarning] = useState(false);

  // History — each entry has imageUrl (storage URL) and displayImage (base64 for current session or URL)
  const [history, setHistory] = useState<{ id?: string; image: string; createdAt?: string }[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Load generation history from Supabase on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch('/api/generate/history');
        if (res.ok) {
          const data = await res.json();
          setHistory(data.generations.map((g: { id: string; generated_image_url: string; created_at: string }) => ({
            id: g.id,
            image: g.generated_image_url,
            createdAt: g.created_at,
          })));
        }
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setHistoryLoaded(true);
      }
    }
    loadHistory();
  }, []);

  // --- Fetch AI models from Supabase ---
  useEffect(() => {
    const fetchModels = async () => {
      setModelsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setModelsLoading(false); return; }

      const { data } = await supabase
        .from('ai_models')
        .select('id, name, thumbnail_url, type, model_data')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: AIModel[] = (data as any[])
          .filter(m => m.model_data?.isActive !== false)
          .map(m => ({
            id: m.id,
            name: m.name,
            avatar: m.thumbnail_url || '',
            tags: m.model_data?.tags || [],
            isActive: m.model_data?.isActive ?? true,
            bodyType: m.model_data?.bodyType || 'Slim',
            isLocked: m.model_data?.isLocked ?? false,
            age: m.model_data?.age,
            ethnicity: m.model_data?.ethnicity,
            sex: m.model_data?.sex || 'female',
          }));
        setActiveModels(mapped);
        if (mapped.length > 0) setSelectedModelId(mapped[0].id);
      }
      setModelsLoading(false);
    };
    fetchModels();
  }, []);

  // --- Fetch campaigns from Supabase ---
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
        setSelectedCampaign(data[0]);
      }
      setCampaignsLoading(false);
    };
    fetchCampaigns();
  }, []);

  // --- Fetch products when campaign changes ---
  useEffect(() => {
    if (!selectedCampaign) {
      setProducts([]);
      setSelectedProductId(null);
      return;
    }

    const fetchProducts = async () => {
      setProductsLoading(true);
      const { data } = await supabase
        .from('products')
        .select('id, campaign_id, name, description, image_url, category, tags, is_active')
        .eq('campaign_id', selectedCampaign.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      const productsList = data || [];
      setProducts(productsList);
      setSelectedProductId(productsList[0]?.id ?? null);

      // Clear manual upload when switching campaigns
      removeUpload();
      setProductsLoading(false);
    };
    fetchProducts();
  }, [selectedCampaign?.id]);

  // Derive selected product
  const selectedProduct = products.find(p => p.id === selectedProductId) ?? null;

  // --- File Upload Handlers (manual upload fallback) ---
  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setGenerationError('画像ファイルのみアップロードできます。');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setGenerationError('ファイルサイズは10MB以下にしてください。');
      return;
    }
    setGenerationError(null);
    setUploadedFile(file);
    setSelectedProductId(null); // Deselect product when manually uploading
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

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const removeUpload = useCallback(() => {
    setUploadedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [previewUrl]);

  // When selecting a product, clear the manual upload
  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    removeUpload();
  };

  // --- Quick-add product ---
  const handleQuickAddFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setQuickAddFile(file);
    setQuickAddPreview(URL.createObjectURL(file));
  };

  const handleQuickAddSubmit = async () => {
    if (!quickAddFile || !quickAddName.trim() || !selectedCampaign) return;
    setQuickAddUploading(true);

    try {
      // Convert file to base64 data URI
      const imageData = await fileToBase64(quickAddFile);

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: quickAddName.trim(),
          campaignId: selectedCampaign.id,
          imageData,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '商品の追加に失敗しました。');

      const product = result.product;
      setProducts(prev => [product, ...prev]);
      setSelectedProductId(product.id);
      setShowQuickAdd(false);
      setQuickAddName('');
      setQuickAddFile(null);
      if (quickAddPreview) URL.revokeObjectURL(quickAddPreview);
      setQuickAddPreview(null);
    } catch {
      setGenerationError('商品の追加に失敗しました。');
    } finally {
      setQuickAddUploading(false);
    }
  };

  // --- Generation ---
  const handleGenerate = async () => {
    // Need either a selected product or a manually uploaded file
    const hasImage = selectedProduct || uploadedFile;
    if (!hasImage) {
      setGenerationError('商品を選択するか、画像をアップロードしてください。');
      return;
    }

    if (!selectedModel) {
      setGenerationError('モデルを選択してください。');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setGeneratedImage(null);
    setGenerationStep('準備中...');
    setCurrentStepNum(0);
    setTotalSteps(4);
    setFaceSwapWarning(false);

    try {
      let outfitImage: string;

      if (selectedProduct) {
        // Fetch the product image and convert to base64
        const response = await fetch(selectedProduct.image_url);
        const blob = await response.blob();
        const file = new File([blob], 'product.jpg', { type: blob.type });
        outfitImage = await fileToBase64(file);
      } else {
        outfitImage = await fileToBase64(uploadedFile!);
      }

      // The avatar URL is already a public Supabase Storage URL from the DB
      const modelAvatarUrl = selectedModel?.avatar || undefined;

      if (faceSwapOnly) {
        // Face swap only mode: use the product/uploaded image as target,
        // and the model's avatar as the source face
        if (!modelAvatarUrl) {
          throw new Error('フェイススワップにはモデルの顔画像が必要です。モデルを選択してください。');
        }
        setGenerationStep('フェイススワップ処理中...');
        setTotalSteps(2);
      } else {
        setGenerationStep('AIモデル画像を生成中...');
        setTotalSteps(4);
      }

      const requestBody = faceSwapOnly
        ? {
            mode: 'faceswap',
            sourceImage: modelAvatarUrl,  // the face to put (model avatar, already a URL so we pass it as-is)
            targetImage: outfitImage,     // the image to swap the face onto (product/uploaded image)
            campaignId: selectedCampaign?.id,
            background,
            aspectRatio,
            modelData: selectedModel ? { id: selectedModel.id } : undefined,
          }
        : {
            mode: 'full-pipeline',
            outfitImage,
            modelData: selectedModel ? {
              id: selectedModel.id,
              name: selectedModel.name,
              age: selectedModel.age,
              ethnicity: selectedModel.ethnicity,
              bodyType: selectedModel.bodyType,
              tags: selectedModel.tags,
              avatar: modelAvatarUrl,
              sex: selectedModel.sex,
            } : undefined,
            background,
            aspectRatio,
            campaignId: selectedCampaign?.id,
          };

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok && !response.body) {
        throw new Error('サーバーエラーが発生しました。');
      }

      // Read the SSE stream
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = '';
      let resultImage: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Only process complete lines (terminated by \n).
        // The last chunk may split a data: line mid-JSON, so keep
        // any trailing partial line in the buffer for the next read.
        const lastNewline = buffer.lastIndexOf('\n');
        if (lastNewline === -1) continue; // no complete line yet

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
              console.error('SSE JSON parse failed, skipping line');
              continue;
            }

            if (currentEvent === 'step') {
              setCurrentStepNum(data.step as number);
              if ((data.total as number) > 0) setTotalSteps(data.total as number);
              setGenerationStep(data.message as string);
            } else if (currentEvent === 'complete') {
              resultImage = ((data.imageUrl || data.image) as string) || null;
              setGeneratedImage(resultImage);
              const historyImage = (data.imageUrl || data.image) as string;
              const gen = data.generation as { id?: string } | null;
              setHistory(prev => [{ id: gen?.id, image: historyImage, createdAt: new Date().toISOString() }, ...prev].slice(0, 10));
              setGenerationStep('');
            } else if (currentEvent === 'error') {
              throw new Error((data.error as string) || '生成に失敗しました。');
            }
            currentEvent = '';
          }
          // Empty lines (SSE event separators) are simply skipped
        }
      }

      // After faceswap, compare original and result to detect if the swap actually happened
      if (faceSwapOnly && resultImage) {
        const similarity = await compareImages(outfitImage, resultImage);
        if (similarity > 0.97) {
          setFaceSwapWarning(true);
        }
      }
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : '生成に失敗しました。');
      setGenerationStep('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = `seisei-${Date.now()}.png`;
    a.click();
  };

  const hasImageSource = !!(selectedProduct || uploadedFile);

  return (
    <>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">画像生成</h2>
          <p className="text-gray-500 text-sm mt-1">商品を選択して、モデル着用イメージを生成します。</p>
        </div>
        <Link
          href="/dashboard/campaigns"
          className="bg-black text-white px-5 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 rounded-lg shadow-lg shadow-black/10"
        >
          <Plus className="w-4 h-4" />
          新規キャンペーン
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Column: Controls */}
        <div className="lg:col-span-4 space-y-6">

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
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {campaignsLoading ? '読み込み中...' : selectedCampaign?.name || 'キャンペーンを選択'}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">生成結果はこのキャンペーンに保存されます</p>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${campaignOpen ? 'rotate-180' : ''}`} />
              </button>

              {campaignOpen && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
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

          {/* Product Selection — from campaign */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-500" />
                商品選択
              </h3>
              <Link href="/dashboard/products" className="text-[10px] text-gray-400 hover:text-black underline">
                商品管理
              </Link>
            </div>

            {productsLoading ? (
              <div className="py-8 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
              </div>
            ) : !selectedCampaign ? (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                <p className="text-xs text-gray-400 mb-2">キャンペーンを選択してください</p>
              </div>
            ) : products.length === 0 && !showQuickAdd ? (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                <Package className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400 mb-3">この キャンペーンに商品がありません</p>
                <button
                  onClick={() => setShowQuickAdd(true)}
                  className="text-xs bg-black text-white px-3 py-1.5 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                  商品を追加
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleSelectProduct(product.id)}
                      className={`aspect-square rounded-lg border transition-all overflow-hidden relative group ${
                        selectedProductId === product.id
                          ? 'border-black ring-2 ring-black/10'
                          : 'border-gray-100 hover:border-black'
                      }`}
                    >
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                        <span className="text-[11px] text-white font-medium block truncate">{product.name}</span>
                        {product.category && (
                          <span className="text-[9px] text-white/70">{product.category}</span>
                        )}
                      </div>
                      {selectedProductId === product.id && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-black rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowQuickAdd(true)}
                  className="mt-3 w-full py-2 text-xs text-gray-500 border border-dashed border-gray-200 rounded-lg hover:border-black hover:text-black transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3 h-3" />
                  商品を追加
                </button>
              </>
            )}

            {/* Quick-add product inline */}
            {showQuickAdd && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">商品をすばやく追加</span>
                  <button onClick={() => { setShowQuickAdd(false); setQuickAddFile(null); setQuickAddPreview(null); setQuickAddName(''); }} className="text-gray-400 hover:text-black">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  ref={quickAddFileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleQuickAddFile(f);
                  }}
                />
                {quickAddPreview ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-200">
                    <Image src={quickAddPreview} alt="preview" fill className="object-contain" unoptimized />
                    <button onClick={() => { setQuickAddFile(null); if (quickAddPreview) URL.revokeObjectURL(quickAddPreview); setQuickAddPreview(null); }} className="absolute top-1 right-1 w-5 h-5 bg-black/70 text-white rounded-full flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => quickAddFileRef.current?.click()}
                    className="w-full py-4 border-2 border-dashed border-gray-200 rounded-lg text-xs text-gray-400 hover:border-black hover:text-black transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    画像を選択
                  </button>
                )}
                <input
                  type="text"
                  value={quickAddName}
                  onChange={(e) => setQuickAddName(e.target.value)}
                  placeholder="商品名"
                  className="w-full p-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none"
                />
                <button
                  onClick={handleQuickAddSubmit}
                  disabled={!quickAddFile || !quickAddName.trim() || quickAddUploading}
                  className={`w-full py-2 text-xs font-medium rounded-lg transition-colors ${
                    !quickAddFile || !quickAddName.trim() || quickAddUploading
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  {quickAddUploading ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      追加中...
                    </span>
                  ) : '追加する'}
                </button>
              </div>
            )}
          </div>

          {/* Manual Upload Fallback — if user wants to use a one-off image */}
          {!selectedProduct && (
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 text-sm">または画像を直接アップロード</h3>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileInput}
              />

              {previewUrl ? (
                <div className="relative group">
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                    <Image
                      src={previewUrl}
                      alt="アップロード画像プレビュー"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <button
                    onClick={removeUpload}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/70 hover:bg-black text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="画像を削除"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-xs text-gray-500 mt-2 truncate">{uploadedFile?.name}</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-gray-400 hover:text-black underline mt-1"
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
                  className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group ${
                    isDragging
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 hover:border-black'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors ${
                    isDragging ? 'bg-gray-200' : 'bg-gray-50 group-hover:bg-gray-100'
                  }`}>
                    <Upload className={`w-5 h-5 transition-colors ${
                      isDragging ? 'text-black' : 'text-gray-400 group-hover:text-black'
                    }`} />
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {isDragging ? 'ここにドロップ' : '画像をアップロード'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">またはドラッグ＆ドロップ</p>
                  <p className="text-[10px] text-gray-300 mt-2">JPG, PNG, WebP (最大 10MB)</p>
                </div>
              )}
            </div>
          )}

          {/* Model Selection — from active model roster */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-sm">モデル選択</h3>
              <Link href="/dashboard/models" className="text-[10px] text-gray-400 hover:text-black underline">
                モデル管理
              </Link>
            </div>
            {activeModels.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                <p className="text-xs text-gray-400 mb-2">稼働中のモデルがありません</p>
                <Link href="/dashboard/models" className="text-xs text-black underline font-medium">
                  モデルを追加・有効化する
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {activeModels.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModelId(model.id)}
                    className={`aspect-square rounded-lg border transition-all overflow-hidden relative group ${
                      selectedModelId === model.id
                        ? 'border-black ring-2 ring-black/10'
                        : 'border-gray-100 hover:border-black'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={model.avatar}
                      alt={model.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gray-200 -z-10" />
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                      <span className="text-[11px] text-white font-medium block">{model.name}</span>
                      <span className="text-[9px] text-white/70">
                        {model.tags.slice(0, 2).map(t => `#${t}`).join(' ')}
                      </span>
                    </div>
                    {selectedModelId === model.id && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-black rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Face Swap Only Toggle */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-gray-500" />
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">フェイススワップのみ</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">アップロード画像の顔をモデルの顔に入れ替えます</p>
                </div>
              </div>
              <button
                onClick={() => setFaceSwapOnly(!faceSwapOnly)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  faceSwapOnly ? 'bg-black' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                    faceSwapOnly ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            {faceSwapOnly && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <p className="text-[11px] text-amber-700">
                  有効時：商品画像の顔をモデルの顔に差し替えます。背景やアスペクト比の設定は無視されます。
                </p>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 text-sm">生成設定</h3>
            <div className="space-y-4">
              {!faceSwapOnly && (
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">背景</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: 'スタジオ（白背景）', label: 'スタジオ', image: '/backgrounds/studio.webp' },
                    { value: 'ストリート（昼）', label: 'ストリート', image: '/backgrounds/street.webp' },
                    { value: 'カフェ（屋内）', label: 'カフェ', image: '/backgrounds/cafe.webp' },
                    { value: '自然光', label: '自然光', image: '/backgrounds/nature.webp' },
                  ].map((bg) => (
                    <button
                      key={bg.value}
                      onClick={() => setBackground(bg.value)}
                      className={`relative aspect-square rounded-lg border overflow-hidden transition-all group ${
                        background === bg.value
                          ? 'border-black ring-2 ring-black/10'
                          : 'border-gray-100 hover:border-black'
                      }`}
                    >
                      <Image
                        src={bg.image}
                        alt={bg.label}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <span className="absolute bottom-1 left-0 right-0 text-[10px] text-white font-medium text-center">
                        {bg.label}
                      </span>
                      {background === bg.value && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-black rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              )}
              {!faceSwapOnly && (
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">アスペクト比</label>
                <div className="flex gap-2">
                  {([
                    { value: '1:1', label: 'スクエア', width: 'w-6', height: 'h-6' },
                    { value: '4:5', label: 'ポートレート', width: 'w-5', height: 'h-6' },
                    { value: '9:16', label: 'ストーリー', width: 'w-[14px]', height: 'h-6' },
                  ] as const).map(r => (
                    <button
                      key={r.value}
                      onClick={() => setAspectRatio(r.value)}
                      className={`flex-1 py-2.5 flex flex-col items-center gap-1.5 border rounded-lg transition-colors ${
                        aspectRatio === r.value
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 hover:border-black bg-white text-gray-700'
                      }`}
                    >
                      <div className={`${r.width} ${r.height} rounded-sm border-2 ${
                        aspectRatio === r.value ? 'border-white' : 'border-gray-400'
                      }`} />
                      <span className="text-[10px] font-medium leading-none">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              )}
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !hasImageSource}
              className={`w-full py-3 rounded-lg text-sm font-bold mt-6 transition-colors shadow-lg shadow-black/10 flex items-center justify-center gap-2 ${
                isGenerating || !hasImageSource
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {faceSwapOnly ? 'フェイススワップ中...' : '生成中...'}
                </>
              ) : (
                faceSwapOnly ? 'フェイススワップ実行' : '生成する'
              )}
            </button>
            <p className="text-[10px] text-gray-400 text-center mt-2">残りチケット: 20 · 保存先: {selectedCampaign?.name || '未選択'}</p>

            {generationError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-xs text-red-600">{generationError}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-8">
          <div className="bg-white h-full rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">生成結果</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">{selectedCampaign?.name || 'キャンペーン未選択'}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!generatedImage}
                  className="p-2 text-gray-400 hover:text-black border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-black border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Result Area */}
            {isGenerating ? (
              <div className="flex-1 border border-gray-200 rounded-lg bg-gray-50 flex flex-col items-center justify-center gap-6">
                {/* Loading Skeleton */}
                <div className="relative w-full max-w-md aspect-square mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-lg animate-pulse" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Loader2 className="w-10 h-10 text-gray-400 animate-spin mb-4" />
                    <p className="text-sm font-medium text-gray-600">{generationStep || '生成中...'}</p>
                    <p className="text-xs text-gray-400 mt-1">1〜2分ほどかかる場合があります</p>
                  </div>
                </div>
                {/* Progress indicator */}
                <div className="flex gap-4 text-xs text-gray-400">
                  {(faceSwapOnly
                    ? [
                        { step: 1, label: 'アップロード' },
                        { step: 2, label: 'フェイススワップ' },
                      ]
                    : [
                        { step: 1, label: 'モデル生成' },
                        { step: 2, label: 'アップロード' },
                        { step: 3, label: 'フェイススワップ' },
                        { step: 4, label: '衣装合成' },
                      ]
                  ).map(({ step, label }) => {
                    const isActive = currentStepNum === step;
                    const isCompleted = currentStepNum > step;
                    return (
                      <span key={step} className={`flex items-center gap-1.5 transition-colors ${isCompleted ? 'text-green-600' : isActive ? 'text-gray-800 font-medium' : 'text-gray-300'}`}>
                        {isCompleted ? (
                          <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-black animate-pulse' : 'bg-gray-300'}`} />
                        )}
                        {label}
                      </span>
                    );
                  })}
                </div>
                {/* Progress bar */}
                <div className="w-full max-w-md px-4">
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${Math.max(5, (currentStepNum / totalSteps) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 text-center mt-1.5">
                    ステップ {currentStepNum} / {totalSteps}
                  </p>
                </div>
              </div>
            ) : generatedImage ? (
              <div className="flex-1 flex flex-col gap-3">
                <div className="flex-1 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center p-4 overflow-hidden">
                  <div className="relative w-full h-full min-h-[400px]">
                    <Image
                      src={generatedImage}
                      alt="生成結果"
                      fill
                      className="object-contain rounded-lg"
                      unoptimized
                    />
                  </div>
                </div>
                {faceSwapWarning && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5 flex-shrink-0">&#9888;</span>
                    <div className="flex-1">
                      <p className="text-xs text-amber-700 font-medium">結果が元の画像と同じに見える場合</p>
                      <p className="text-[11px] text-amber-600 mt-0.5">
                        対象画像の顔が検出できなかった可能性があります。顔がはっきり写っている高解像度の画像をお試しください。
                      </p>
                    </div>
                    <button
                      onClick={() => setFaceSwapWarning(false)}
                      className="text-amber-400 hover:text-amber-600 flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 border border-dashed border-gray-200 rounded-lg bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                <ImageIcon className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm">左側のパネルから設定を行い、<br />「生成する」ボタンを押してください。</p>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-100">
              <h4 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Recent History</h4>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {history.length > 0 ? (
                  history.map((entry, i) => (
                    <button
                      key={entry.id || i}
                      onClick={() => setGeneratedImage(entry.image)}
                      className="w-20 h-20 flex-shrink-0 rounded-lg border border-gray-100 overflow-hidden relative hover:border-black transition-colors"
                    >
                      <Image src={entry.image} alt={`History ${i + 1}`} fill className="object-cover" unoptimized />
                    </button>
                  ))
                ) : (
                  [1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg border border-gray-100" />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
