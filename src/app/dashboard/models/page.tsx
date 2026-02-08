"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  User
} from 'lucide-react';

import { AIModel } from '@/types/models';
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
  setNewModel
}: { 
  onBack: () => void, 
  mode: 'upload' | 'generate', 
  setMode: (m: 'upload' | 'generate') => void,
  newModel: any,
  setNewModel: (m: any) => void
}) {
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
          {mode === 'upload' ? (
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-white group-hover:shadow-md transition-all">
                <Upload className="text-gray-400 group-hover:text-black" size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">写真をドラッグ＆ドロップ</h3>
              <p className="text-sm text-gray-500 mb-6">または クリックしてファイルを選択</p>
              <p className="text-xs text-gray-400">推奨サイズ: 1024x1024px (JPG, PNG)</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">性別 (Sex)</label>
                  <select className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none">
                    <option value="female">女性 (Female)</option>
                    <option value="male">男性 (Male)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">年齢</label>
                  <input type="number" defaultValue={24} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">人種</label>
                  <select className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none">
                    <option>日本人 (Japanese)</option>
                    <option>アジア系 (Asian)</option>
                    <option>白人 (Caucasian)</option>
                    <option>ミックス (Mixed)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">雰囲気・特徴 (Vibe)</label>
                  <textarea 
                    placeholder="例: 透明感のある、ナチュラルメイク、黒髪ロング..." 
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none h-24 resize-none"
                  ></textarea>
                </div>
                <button className="w-full py-3 bg-black text-white rounded-lg font-medium shadow-lg shadow-black/10 hover:bg-gray-800 transition-all flex items-center justify-center gap-2">
                  <Sparkles size={18} />
                  プレビューを生成
                </button>
              </div>
              <div className="bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 min-h-[300px]">
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 mb-2 bg-gray-200 rounded-full animate-pulse"></div>
                  <p>プレビューがここに表示されます</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer Actions */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <button onClick={onBack} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">キャンセル</button>
            <button className="px-5 py-2.5 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-lg shadow-black/10">登録する</button>
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
