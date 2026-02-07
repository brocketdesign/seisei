"use client";

import React, { useState } from 'react';
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

// Mock Data
type Model = {
  id: string;
  name: string;
  avatar: string; // Placeholder color or URL
  tags: string[];
  isActive: boolean;
  bodyType: 'Slim' | 'Athletic' | 'Curvy';
  isLocked: boolean;
  age?: number;
  ethnicity?: string;
};

const initialModels: Model[] = [
  { id: '1', name: 'Yuki', avatar: 'bg-pink-200', tags: ['Cute', 'Casual'], isActive: true, bodyType: 'Slim', isLocked: true, age: 22, ethnicity: 'Japanese' },
  { id: '2', name: 'Aoi', avatar: 'bg-blue-200', tags: ['Cool', 'Street'], isActive: false, bodyType: 'Athletic', isLocked: false, age: 25, ethnicity: 'Japanese' },
  { id: '3', name: 'Rina', avatar: 'bg-purple-200', tags: ['Elegant', 'Formal'], isActive: true, bodyType: 'Curvy', isLocked: true, age: 28, ethnicity: 'Japanese' },
];

export default function ModelsPage() {
  const [view, setView] = useState<'roster' | 'add' | 'details'>('roster');
  const [models, setModels] = useState<Model[]>(initialModels);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);

  // Filter State
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Add Model State
  const [addMode, setAddMode] = useState<'upload' | 'generate'>('upload');
  const [newModel, setNewModel] = useState<Partial<Model>>({
    name: '',
    bodyType: 'Slim',
    isLocked: false,
    tags: []
  });

  // Toggle Active Status
  const toggleActive = (id: string) => {
    setModels(models.map(m => m.id === id ? { ...m, isActive: !m.isActive } : m));
  };

  // Handle Model Click
  const handleModelClick = (model: Model) => {
    setSelectedModel(model);
    setView('details');
  };

  // Back to Roster
  const handleBack = () => {
    setView('roster');
    setSelectedModel(null);
    setNewModel({ name: '', bodyType: 'Slim', isLocked: false, tags: [] });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8 font-sans">
      {/* Header */}
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">所属モデル管理</h1>
          <p className="text-gray-500 mt-1 text-sm">専属モデルの登録・編集・管理を行います</p>
        </div>
        {view === 'roster' && (
          <button 
            onClick={() => setView('add')}
            className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus size={18} />
            <span className="font-medium">モデルを追加</span>
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main>
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

        {view === 'details' && selectedModel && (
          <ModelDetailsView 
            model={selectedModel} 
            onBack={handleBack} 
            onSave={(updated) => {
              setModels(models.map(m => m.id === updated.id ? updated : m));
              handleBack();
            }}
          />
        )}
      </main>
    </div>
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
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="モデルを検索..." 
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
            className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer"
            onClick={() => onModelClick(model)}
          >
            <div className={`h-48 w-full ${model.avatar} relative flex items-center justify-center`}>
              {/* Avatar Placeholder */}
              <User size={48} className="text-white/50" />
              
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
                <span>{model.bodyType}</span>
              </div>
            </div>
          </div>
        ))}
        
        {/* Empty State Helper */}
        {filteredModels.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                <Users size={48} className="mb-4 opacity-20" />
                <p>モデルが見つかりません</p>
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

      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
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
                <button className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
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
            <button onClick={onBack} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors">キャンセル</button>
            <button className="px-5 py-2.5 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-lg">登録する</button>
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

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Avatar Section */}
          <div className="w-full md:w-1/3 flex flex-col items-center">
            <div className={`w-48 h-48 ${formData.avatar} rounded-2xl mb-4 shadow-inner flex items-center justify-center text-white/50`}>
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
                 className="px-6 py-2.5 rounded-lg bg-black text-white hover:bg-gray-800 font-medium transition-colors shadow-lg flex items-center gap-2"
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
