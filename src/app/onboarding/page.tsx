"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ArrowRight, ArrowLeft, Shirt, ShoppingBag, Instagram, Globe } from 'lucide-react';

type Step = 'style' | 'platform' | 'plan';

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('style');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  
  const styles = [
    { id: 'minimal', label: 'ミニマル', desc: 'シンプルで洗練された' },
    { id: 'street', label: 'ストリート', desc: '都会的で大胆な' },
    { id: 'casual', label: 'カジュアル', desc: '日常に溶け込む' },
    { id: 'luxury', label: 'ラグジュアリー', desc: '高級感のある' },
    { id: 'mode', label: 'モード', desc: '前衛的でスタイリッシュ' },
    { id: 'fem', label: 'フェミニン', desc: '柔らかく女性らしい' },
  ];

  const platforms = [
    { id: 'rakuten', label: '楽天市場', icon: ShoppingBag },
    { id: 'instagram', label: 'Instagram', icon: Instagram },
    { id: 'base', label: 'BASE / Shopify', icon: Globe },
    { id: 'amazon', label: 'Amazon', icon: ShoppingBag },
  ];

  const plans = [
    { 
      id: 'starter', 
      name: 'スターター', 
      price: '¥5,000', 
      period: '/月',
      features: ['月50枚生成', '標準画質', 'メールサポート'] 
    },
    { 
      id: 'pro', 
      name: 'プロフェッショナル', 
      price: '¥20,000', 
      period: '/月',
      features: ['無制限生成', '4K高画質', '優先サポート', '商用利用完全保証'],
      recommended: true
    },
    { 
      id: 'enterprise', 
      name: 'エンタープライズ', 
      price: '要相談', 
      period: '',
      features: ['API連携', '専属マネージャー', 'カスタムモデル'] 
    },
  ];

  const toggleStyle = (id: string) => {
    setSelectedStyles(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (step === 'style') setStep('platform');
    else if (step === 'platform') setStep('plan');
    else router.push('/dashboard');
  };

  const handleBack = () => {
    if (step === 'platform') setStep('style');
    else if (step === 'plan') setStep('platform');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="px-8 py-6 border-b border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="font-bold text-xl tracking-tighter">生成</div>
          <div className="text-sm text-gray-400">
            Step {step === 'style' ? '1' : step === 'platform' ? '2' : '3'} / 3
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center py-12 px-4">
        <div className="max-w-3xl w-full space-y-8">
          
          {/* Step 1: Style Selection */}
          {step === 'style' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-2 mb-10">
                <h2 className="text-2xl font-bold text-gray-900">ブランドのスタイルを選択</h2>
                <p className="text-gray-500">AIが生成する画像のトーン＆マナーを決定します（複数選択可）</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {styles.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => toggleStyle(s.id)}
                    className={`p-6 text-left border rounded-lg transition-all duration-200 hover:border-black ${
                      selectedStyles.includes(s.id) 
                        ? 'border-black bg-black text-white' 
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="text-lg font-medium mb-1">{s.label}</div>
                    <div className={`text-xs ${selectedStyles.includes(s.id) ? 'text-gray-300' : 'text-gray-500'}`}>
                      {s.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Platform Selection */}
          {step === 'platform' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-2 mb-10">
                <h2 className="text-2xl font-bold text-gray-900">主な展開プラットフォーム</h2>
                <p className="text-gray-500">画像サイズや構図を最適化するために使用します</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {platforms.map((p) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlatform(p.id)}
                      className={`p-8 flex flex-col items-center justify-center gap-4 border rounded-lg transition-all duration-200 ${
                        selectedPlatform === p.id
                          ? 'border-black bg-gray-50 ring-1 ring-black'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`w-8 h-8 ${selectedPlatform === p.id ? 'text-black' : 'text-gray-400'}`} />
                      <span className="font-medium">{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Plan Selection */}
          {step === 'plan' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-2 mb-10">
                <h2 className="text-2xl font-bold text-gray-900">プランの選択</h2>
                <p className="text-gray-500">ビジネス規模に合わせた最適なプランをお選びください</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <div 
                    key={plan.id}
                    className={`relative p-6 rounded-xl border flex flex-col ${
                      plan.recommended 
                        ? 'border-black shadow-lg bg-white scale-105 z-10' 
                        : 'border-gray-200 bg-gray-50 text-gray-500'
                    }`}
                  >
                    {plan.recommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-3 py-1 rounded-full">
                        おすすめ
                      </div>
                    )}
                    <h3 className="text-lg font-bold mb-2">{plan.name}</h3>
                    <div className="mb-6">
                      <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-sm">{plan.period}</span>
                    </div>
                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-center text-sm">
                          <Check className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={handleNext}
                      className={`w-full py-3 rounded-lg text-sm font-bold transition-colors ${
                        plan.recommended
                          ? 'bg-black text-white hover:bg-gray-800'
                          : 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      選択する
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Navigation */}
          <div className="flex justify-between pt-8 border-t border-gray-100 mt-8">
            {step !== 'style' ? (
              <button 
                onClick={handleBack}
                className="flex items-center text-gray-500 hover:text-black transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                戻る
              </button>
            ) : (
              <div /> // Spacer
            )}
            
            {step !== 'plan' && (
              <button 
                onClick={handleNext}
                disabled={step === 'style' && selectedStyles.length === 0}
                className="bg-black text-white px-8 py-3 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                次へ
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
