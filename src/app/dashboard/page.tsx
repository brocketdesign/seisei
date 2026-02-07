"use client";

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  Settings, 
  LogOut, 
  Upload, 
  Plus,
  Download,
  Share2,
  Users
} from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('generate');
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col fixed h-full">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tighter">生成</h1>
          <p className="text-xs text-gray-400 mt-1">BUSINESS DASHBOARD</p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="ダッシュボード" 
            active={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
          />
          <SidebarItem 
            icon={ImageIcon} 
            label="画像生成" 
            active={activeTab === 'generate'}
            onClick={() => setActiveTab('generate')}
          />
          <SidebarItem 
            icon={Users} 
            label="モデル管理" 
            active={activeTab === 'models'}
            onClick={() => setActiveTab('models')}
          />
          <SidebarItem 
            icon={Settings} 
            label="設定" 
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
          />
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:text-black cursor-pointer transition-colors">
            <LogOut className="w-4 h-4" />
            <span>ログアウト</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">新規プロジェクト作成</h2>
            <p className="text-gray-500 text-sm mt-1">商品画像をアップロードして、モデル着用イメージを生成します。</p>
          </div>
          <button className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新規プロジェクト
          </button>
        </header>

        <div className="grid grid-cols-12 gap-8">
          
          {/* Left Column: Controls */}
          <div className="col-span-4 space-y-6">
            
            {/* Upload Section */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 text-sm">商品画像</h3>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:border-black transition-colors cursor-pointer group">
                <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-gray-100">
                  <Upload className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
                </div>
                <p className="text-sm font-medium text-gray-900">画像をアップロード</p>
                <p className="text-xs text-gray-400 mt-1">またはドラッグ＆ドロップ</p>
                <p className="text-[10px] text-gray-300 mt-2">JPG, PNG (最大 10MB)</p>
              </div>
            </div>

            {/* Model Selection */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 text-sm">モデル選択</h3>
              <div className="grid grid-cols-2 gap-3">
                {['Japanese/Natural', 'Western/High-Fashion', 'Asian/Street', 'Mix/Casual'].map((model, i) => (
                  <button 
                    key={i}
                    className="aspect-square rounded-lg border border-gray-100 bg-gray-50 hover:border-black transition-all overflow-hidden relative group"
                  >
                    <div className="absolute inset-0 bg-gray-200" /> {/* Placeholder for image */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent">
                      <span className="text-[10px] text-white font-medium">{model.split('/')[0]}</span>
                    </div>
                  </button>
                ))}
              </div>
              <button className="w-full mt-4 text-xs text-center text-gray-500 hover:text-black underline">
                すべてのモデルを表示
              </button>
            </div>

            {/* Settings */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 text-sm">生成設定</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">背景</label>
                  <select className="w-full text-sm border-gray-200 rounded-md focus:border-black focus:ring-0">
                    <option>スタジオ（白背景）</option>
                    <option>ストリート（昼）</option>
                    <option>カフェ（屋内）</option>
                    <option>自然光</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">アスペクト比</label>
                  <div className="flex gap-2">
                    {['1:1', '4:5', '9:16'].map(r => (
                      <button key={r} className="flex-1 py-1.5 text-xs border rounded hover:border-black bg-white">
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <button className="w-full bg-black text-white py-3 rounded-lg text-sm font-bold mt-6 hover:bg-gray-800 transition-colors shadow-lg shadow-black/10">
                生成する (残りチケット: 20)
              </button>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="col-span-8">
            <div className="bg-white h-full rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900 text-sm">生成結果</h3>
                <div className="flex gap-2">
                  <button className="p-2 text-gray-400 hover:text-black border rounded hover:bg-gray-50">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-black border rounded hover:bg-gray-50">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Empty State / Loading State Placeholder */}
              <div className="flex-1 border border-dashed border-gray-100 rounded-lg bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                <ImageIcon className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm">左側のパネルから設定を行い、<br/>「生成する」ボタンを押してください。</p>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Recent History</h4>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg border border-gray-100" />
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition-colors ${
        active 
          ? 'bg-black text-white font-medium shadow-md shadow-black/10' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-black'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}
