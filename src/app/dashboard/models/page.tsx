"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Users, 
  Plus, 
  MoreHorizontal, 
  Search, 
  Filter, 
  Upload, 
  Sparkles, 
  Lock, 
  Unlock,
  Camera,
  X,
  Check,
  ChevronRight,
  User,
  Loader2,
} from 'lucide-react';

import { AIModel, buildModelPrompt } from '@/types/models';
import { createClient } from '@/utils/supabase/client';

type Model = AIModel;

export default function ModelsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [view, setView] = useState<'roster' | 'add'>('roster');
  const [models, setModels] = useState<Model[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);

  // Filter State
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Add Model State
  const [addMode, setAddMode] = useState<'upload' | 'generate'>('upload');
  const [newModel, setNewModel] = useState<Partial<Model>>({
    name: '',
    bodyType: 'Slim',
    isLocked: false,
    tags: [],
    sex: 'female'
  });

  // Load models from Supabase on mount
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
        const mapped: Model[] = (data as any[]).map(m => ({
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
        setModels(mapped);
      }
      setModelsLoading(false);
    };
    fetchModels();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle Active Status (persists to DB)
  const toggleActive = async (id: string) => {
    const model = models.find(m => m.id === id);
    if (!model) return;
    const newIsActive = !model.isActive;
    setModels(models.map(m => m.id === id ? { ...m, isActive: newIsActive } : m));

    // Update in Supabase
    const { data: existing } = await supabase
      .from('ai_models')
      .select('model_data')
      .eq('id', id)
      .single();

    if (existing) {
      const currentModelData = (existing.model_data as Record<string, any>) || {};
      await supabase
        .from('ai_models')
        .update({ model_data: { ...currentModelData, isActive: newIsActive } })
        .eq('id', id);
    }
  };

  // Handle Model Click — navigate to model detail page
  const handleModelClick = (model: Model) => {
    router.push(`/dashboard/models/${model.id}`);
  };

  // Back to Roster
  const handleBack = () => {
    setView('roster');
    setNewModel({ name: '', bodyType: 'Slim', isLocked: false, tags: [], sex: 'female' });
  };

  // Handle new model saved
  const handleModelSaved = (savedModel: Model) => {
    setModels(prev => [...prev, savedModel]);
    setView('roster');
    setNewModel({ name: '', bodyType: 'Slim', isLocked: false, tags: [], sex: 'female' });
  };

  return (
    <>
      {/* Header */}
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">モデル管理</h2>
          <p className="text-gray-500 mt-1 text-sm">専属モデルの登録・編集・管理を行います</p>
        </div>
        {view === 'roster' && (
          <button 
            onClick={() => setView('add')}
            className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-colors shadow-lg shadow-black/10 text-sm font-medium"
          >
            <Plus size={16} />
            <span>モデルを追加</span>
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <div>
        {view === 'roster' && (
          <RosterView 
            models={models} 
            toggleActive={toggleActive} 
            onModelClick={handleModelClick}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
          />
        )}

        {view === 'add' && (
          <AddModelView 
            onBack={handleBack} 
            mode={addMode} 
            setMode={setAddMode} 
            newModel={newModel}
            setNewModel={setNewModel}
            onModelSaved={handleModelSaved}
          />
        )}
      </div>
    </>
  );
}

// --- Sub-Components ---

function RosterView({ 
  models, 
  toggleActive, 
  onModelClick,
  filterStatus,
  setFilterStatus
}: { 
  models: Model[], 
  toggleActive: (id: string) => void, 
  onModelClick: (m: Model) => void,
  filterStatus: 'all' | 'active' | 'inactive',
  setFilterStatus: (s: 'all' | 'active' | 'inactive') => void
}) {
  const filteredModels = models.filter(m => {
    if (filterStatus === 'all') return true;
    return filterStatus === 'active' ? m.isActive : !m.isActive;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="モデルを検索..." 
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
              {status === 'all' ? 'すべて' : status === 'active' ? '稼働中' : '停止中'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredModels.map(model => (
          <div 
            key={model.id} 
            className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer"
            onClick={() => onModelClick(model)}
          >
            <div className={`h-64 w-full relative flex items-center justify-center bg-gray-100`}>
              {/* Avatar Image */}
              <img 
                src={model.avatar} 
                alt={model.name}
                className="w-full h-full object-cover"
              />
              
              <div className="absolute top-3 right-3">
                <button 
                  onClick={(e) => { e.stopPropagation(); }}
                  className="p-1.5 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors"
                >
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>
            
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{model.name}</h3>
                  <div className="text-xs text-gray-500 mt-0.5 flex flex-wrap gap-1">
                    {model.tags.map(tag => (
                      <span key={tag} className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">#{tag}</span>
                    ))}
                  </div>
                </div>
                <div 
                  className="relative inline-flex items-center cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); toggleActive(model.id); }}
                >
                  <div className={`w-10 h-6 rounded-full p-1 transition-colors ${model.isActive ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${model.isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3 mt-4">
                <span className="flex items-center gap-1">
                  {model.isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                  {model.isLocked ? '顔固定ON' : '顔固定OFF'}
                </span>
                <span>{model.sex === 'male' ? '男性' : '女性'} · {model.bodyType}</span>
              </div>
            </div>
          </div>
        ))}
        
        {/* Empty State Helper */}
        {filteredModels.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                <Users size={48} className="mb-4 opacity-20" />
                <p className="text-sm">モデルが見つかりません</p>
            </div>
        )}
      </div>
    </div>
  );
}

function AddModelView({ 
  onBack, 
  mode, 
  setMode,
  newModel,
  setNewModel,
  onModelSaved
}: { 
  onBack: () => void, 
  mode: 'upload' | 'generate', 
  setMode: (m: 'upload' | 'generate') => void,
  newModel: any,
  setNewModel: (m: any) => void,
  onModelSaved: (m: Model) => void
}) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload mode state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  // Generate mode state
  const [genSex, setGenSex] = useState<'female' | 'male'>('female');
  const [genAge, setGenAge] = useState(24);
  const [genEthnicity, setGenEthnicity] = useState('Japanese');
  const [genVibe, setGenVibe] = useState('');
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Common state
  const [modelName, setModelName] = useState(newModel.name || '');
  const [bodyType, setBodyType] = useState<'Slim' | 'Athletic' | 'Curvy'>(newModel.bodyType || 'Slim');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Handle file upload
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 10 * 1024 * 1024) {
      setSaveError('ファイルサイズは10MB以下にしてください。');
      return;
    }
    setUploadedFile(file);
    setUploadPreview(URL.createObjectURL(file));
  };

  // Generate AI face preview
  const handleGeneratePreview = async () => {
    setIsGenerating(true);
    setGenerateError(null);
    setGeneratedPreview(null);

    try {
      // Build a temporary model to use buildModelPrompt
      const tempModel: AIModel = {
        id: 'temp',
        name: modelName || 'Model',
        avatar: '',
        tags: genVibe ? genVibe.split(/[,、\s]+/).filter(Boolean).slice(0, 3) : [],
        isActive: true,
        bodyType,
        isLocked: false,
        age: genAge,
        ethnicity: genEthnicity,
        sex: genSex,
      };

      const stylePrompt = buildModelPrompt(tempModel);
      const prompt = `Close-up professional headshot portrait photograph of ${stylePrompt}. Face clearly visible, looking at camera, natural expression, soft studio lighting, clean background, 8k resolution, photorealistic, sharp focus on face.${genVibe ? ` Style: ${genVibe}.` : ''}`;

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

  // Save model via API route (server-side storage + DB to bypass RLS)
  const handleSave = async () => {
    if (!modelName.trim()) {
      setSaveError('モデル名を入力してください。');
      return;
    }

    const hasImage = mode === 'upload' ? !!uploadedFile : !!generatedPreview;
    if (!hasImage) {
      setSaveError(mode === 'upload' ? '顔写真をアップロードしてください。' : 'まずプレビューを生成してください。');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // Build the base64 data URI for the thumbnail
      let thumbnailData: string;

      if (mode === 'upload' && uploadedFile) {
        thumbnailData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(uploadedFile);
        });
      } else if (mode === 'generate' && generatedPreview) {
        thumbnailData = generatedPreview;
      } else {
        throw new Error('画像が見つかりません。');
      }

      // Derive tags from vibe text in generate mode
      const tags = mode === 'generate' && genVibe
        ? genVibe.split(/[,、\s]+/).filter(Boolean).slice(0, 5)
        : [];

      const modelDataPayload = {
        isActive: true,
        isLocked: false,
        bodyType,
        tags,
        age: mode === 'generate' ? genAge : undefined,
        ethnicity: mode === 'generate' ? genEthnicity : undefined,
        sex: mode === 'generate' ? genSex : (newModel.sex || 'female'),
      };

      const response = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: modelName.trim(),
          type: mode === 'generate' ? 'ai-generated' : 'uploaded',
          thumbnailData,
          modelData: modelDataPayload,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '保存に失敗しました。');
      }

      // Map to AIModel type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = result.model as any;
      const savedModel: Model = {
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

      onModelSaved(savedModel);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : '保存に失敗しました。');
    } finally {
      setIsSaving(false);
    }
  };

  const previewImage = mode === 'upload' ? uploadPreview : generatedPreview;
  const canSave = modelName.trim() && (mode === 'upload' ? !!uploadedFile : !!generatedPreview);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <button onClick={onBack} className="hover:text-black transition-colors">モデル一覧</button>
        <ChevronRight size={14} />
        <span className="text-black font-medium">新規登録</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 flex">
          <button 
            onClick={() => setMode('upload')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              mode === 'upload' ? 'bg-gray-50 text-black border-b-2 border-black' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Upload size={16} />
            顔写真をアップロード
          </button>
          <button 
            onClick={() => setMode('generate')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              mode === 'generate' ? 'bg-gray-50 text-black border-b-2 border-black' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Sparkles size={16} />
            AIで顔を生成
          </button>
        </div>

        <div className="p-8">
          {/* Model Name — shared between modes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">モデル名 <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="例: Yuki"
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none"
            />
          </div>

          {mode === 'upload' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Upload Area */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f);
                  }}
                />
                {uploadPreview ? (
                  <div className="relative group">
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                      <Image
                        src={uploadPreview}
                        alt="アップロード画像"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <button
                      onClick={() => {
                        setUploadedFile(null);
                        if (uploadPreview) URL.revokeObjectURL(uploadPreview);
                        setUploadPreview(null);
                      }}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/70 hover:bg-black text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 text-xs text-gray-400 hover:text-black underline"
                    >
                      別の画像を選択
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const f = e.dataTransfer.files[0];
                      if (f) handleFileSelect(f);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed border-gray-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center hover:bg-gray-50 hover:border-black transition-colors cursor-pointer group"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-white group-hover:shadow-md transition-all">
                      <Upload className="text-gray-400 group-hover:text-black" size={24} />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">写真をドラッグ＆ドロップ</h3>
                    <p className="text-sm text-gray-500 mb-6">または クリックしてファイルを選択</p>
                    <p className="text-xs text-gray-400">推奨サイズ: 1024x1024px (JPG, PNG)</p>
                  </div>
                )}
              </div>

              {/* Upload Mode Settings */}
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">性別</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['female', 'male'] as const).map(sex => (
                      <button
                        key={sex}
                        onClick={() => setNewModel({ ...newModel, sex })}
                        className={`py-2.5 rounded-lg text-sm border transition-all ${
                          (newModel.sex || 'female') === sex
                            ? 'border-black bg-black text-white'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {sex === 'female' ? '女性' : '男性'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">体型</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Slim', 'Athletic', 'Curvy'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setBodyType(type)}
                        className={`py-2.5 rounded-lg text-sm border transition-all ${
                          bodyType === type
                            ? 'border-black bg-black text-white'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">性別</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['female', 'male'] as const).map(sex => (
                      <button
                        key={sex}
                        onClick={() => setGenSex(sex)}
                        className={`py-2.5 rounded-lg text-sm border transition-all ${
                          genSex === sex
                            ? 'border-black bg-black text-white'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {sex === 'female' ? '女性' : '男性'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">年齢</label>
                  <input
                    type="number"
                    value={genAge}
                    onChange={(e) => setGenAge(parseInt(e.target.value) || 24)}
                    min={18}
                    max={60}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">人種</label>
                  <select
                    value={genEthnicity}
                    onChange={(e) => setGenEthnicity(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none"
                  >
                    <option value="Japanese">日本人 (Japanese)</option>
                    <option value="Asian">アジア系 (Asian)</option>
                    <option value="Caucasian">白人 (Caucasian)</option>
                    <option value="Mixed">ミックス (Mixed)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">体型</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Slim', 'Athletic', 'Curvy'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setBodyType(type)}
                        className={`py-2.5 rounded-lg text-sm border transition-all ${
                          bodyType === type
                            ? 'border-black bg-black text-white'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">雰囲気・特徴 (タグ)</label>
                  <textarea 
                    value={genVibe}
                    onChange={(e) => setGenVibe(e.target.value)}
                    placeholder="例: 透明感のある、ナチュラルメイク、黒髪ロング..." 
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none h-24 resize-none"
                  />
                </div>
                <button
                  onClick={handleGeneratePreview}
                  disabled={isGenerating}
                  className={`w-full py-3 rounded-lg font-medium shadow-lg shadow-black/10 transition-all flex items-center justify-center gap-2 ${
                    isGenerating
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
              </div>

              {/* Preview Area */}
              <div className={`bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center min-h-[300px] overflow-hidden relative ${
                generatedPreview ? '' : ''
              }`}>
                {isGenerating ? (
                  <div className="text-center">
                    <Loader2 className="w-10 h-10 text-gray-400 animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-500">AIモデルを生成中...</p>
                    <p className="text-xs text-gray-400 mt-1">30秒〜1分ほどかかります</p>
                  </div>
                ) : generatedPreview ? (
                  <div className="relative w-full h-full min-h-[300px]">
                    <Image
                      src={generatedPreview}
                      alt="生成されたモデル"
                      fill
                      className="object-cover rounded-xl"
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
                      <User size={32} className="text-gray-300" />
                    </div>
                    <p className="text-sm">プレビューがここに表示されます</p>
                    <p className="text-xs text-gray-400 mt-1">左の設定を入力して「プレビューを生成」を押してください</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Error */}
        {saveError && (
          <div className="mx-8 mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-xs text-red-600">{saveError}</p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onBack}
            className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || isSaving}
            className={`px-5 py-2.5 font-medium rounded-lg transition-colors shadow-lg shadow-black/10 flex items-center gap-2 ${
              !canSave || isSaving
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Check size={16} />
                登録する
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModelDetailsView({ 
  model, 
  onBack,
  onSave
}: { 
  model: Model, 
  onBack: () => void,
  onSave: (m: Model) => void
}) {
  const [formData, setFormData] = useState(model);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <button onClick={onBack} className="hover:text-black transition-colors">モデル一覧</button>
        <ChevronRight size={14} />
        <span className="text-black font-medium">{model.name}</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Avatar Section */}
          <div className="w-full md:w-1/3 flex flex-col items-center">
            <div className={`w-48 h-48 ${formData.avatar} rounded-xl mb-4 shadow-inner flex items-center justify-center text-white/50`}>
               <User size={64} />
            </div>
            <button className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
              <Camera size={14} />
              写真を変更
            </button>
          </div>

          {/* Form Section */}
          <div className="flex-1 space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">モデル名</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/10 outline-none font-medium" 
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">性別 (Sex)</label>
              <div className="grid grid-cols-2 gap-2">
                {(['female', 'male'] as const).map(sex => (
                  <button
                    key={sex}
                    onClick={() => setFormData({...formData, sex})}
                    className={`py-2 rounded-lg text-sm border transition-all ${
                      formData.sex === sex 
                        ? 'border-black bg-black text-white' 
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {sex === 'female' ? '女性 (Female)' : '男性 (Male)'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">体型 (Body Type)</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Slim', 'Athletic', 'Curvy'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setFormData({...formData, bodyType: type})}
                    className={`py-2 rounded-lg text-sm border transition-all ${
                      formData.bodyType === type 
                        ? 'border-black bg-black text-white' 
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <span className="block text-sm font-bold text-gray-900">顔固定 (Lock Face)</span>
                <span className="text-xs text-gray-500">生成時にこの顔立ちを維持します</span>
              </div>
              <button 
                onClick={() => setFormData({...formData, isLocked: !formData.isLocked})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.isLocked ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.isLocked ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
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
  );
}
