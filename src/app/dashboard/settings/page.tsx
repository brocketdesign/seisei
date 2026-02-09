"use client";

import React, { useCallback, useEffect, useState } from 'react';
import {
  User,
  Bell,
  CreditCard,
  Key,
  Check,
  Loader2,
  Copy,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  X,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { PLAN_PRICES } from '@/utils/plans';

type SettingsTab = 'profile' | 'billing' | 'notifications' | 'security';

const tabs = [
  { key: 'profile' as const, label: 'プロフィール', icon: User },
  { key: 'billing' as const, label: '請求・プラン', icon: CreditCard },
  { key: 'notifications' as const, label: '通知設定', icon: Bell },
  { key: 'security' as const, label: 'セキュリティ', icon: Lock },
];

// ─── Toast Component ───────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-slide-up ${
      type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
    }`}>
      {type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {message}
    </div>
  );
}

// ─── Shared hook for toast notifications ───────────────────────────
function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  }, []);
  const clearToast = useCallback(() => setToast(null), []);
  return { toast, showToast, clearToast };
}

// ─── Main Settings Page ────────────────────────────────────────────
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  return (
    <>
      <header className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">設定</h2>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">アカウントとアプリケーションの設定を管理します。</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 min-w-0">
        {/* Settings Tabs — horizontal scroll on mobile, vertical sidebar on lg+ */}
        <div className="w-full lg:w-56 flex-shrink-0 min-w-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2.5 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm rounded-lg transition-colors whitespace-nowrap flex-shrink-0 lg:w-full ${
                  activeTab === tab.key
                    ? 'bg-black text-white font-medium shadow-md shadow-black/10'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-black'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'billing' && <BillingSettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'security' && <SecuritySettings />}
        </div>
      </div>
    </>
  );
}

// ─── Profile Settings ──────────────────────────────────────────────
function ProfileSettings() {
  const supabase = createClient();
  const { toast, showToast, clearToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    brand_name: '',
    email: '',
    website: '',
    description: '',
  });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('brand_name, email, website, description')
        .eq('id', user.id)
        .single();
      if (data) {
        setProfile({
          brand_name: data.brand_name ?? '',
          email: data.email ?? user.email ?? '',
          website: data.website ?? '',
          description: data.description ?? '',
        });
      }
      setLoading(false);
    })();
  }, [supabase]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          brand_name: profile.brand_name || null,
          email: profile.email || null,
          website: profile.website || null,
          description: profile.description || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      showToast('プロフィールを更新しました', 'success');
    } catch {
      showToast('保存に失敗しました。もう一度お試しください。', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SettingsCardSkeleton rows={4} />;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <h3 className="font-bold text-gray-900">プロフィール情報</h3>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">ブランドと連絡先情報を管理します。</p>
      </div>
      <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{profile.brand_name || 'ブランド名未設定'}</p>
            <p className="text-xs text-gray-500 mt-0.5">{profile.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">ブランド名</label>
            <input
              type="text"
              value={profile.brand_name}
              onChange={e => setProfile(p => ({ ...p, brand_name: e.target.value }))}
              placeholder="例: My Brand"
              className="w-full p-2 sm:p-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none transition-shadow"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">メールアドレス</label>
            <input
              type="email"
              value={profile.email}
              onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
              className="w-full p-2 sm:p-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none transition-shadow"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">ウェブサイト</label>
            <input
              type="url"
              value={profile.website}
              onChange={e => setProfile(p => ({ ...p, website: e.target.value }))}
              placeholder="https://example.com"
              className="w-full p-2 sm:p-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none transition-shadow"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">ブランド説明</label>
            <textarea
              value={profile.description}
              onChange={e => setProfile(p => ({ ...p, description: e.target.value }))}
              rows={3}
              placeholder="ブランドについて簡単に説明してください"
              className="w-full p-2 sm:p-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none transition-shadow resize-none"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-black text-white px-5 py-2.5 text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-lg shadow-black/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? '保存中...' : '変更を保存'}
          </button>
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
    </div>
  );
}

// ─── Plan hierarchy ────────────────────────────────────────────────
const PLAN_ORDER = ['starter', 'pro', 'business', 'enterprise'];

// ─── Billing Settings ──────────────────────────────────────────────
function BillingSettings() {
  const supabase = createClient();
  const { toast, showToast, clearToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<string>('starter');
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [usage, setUsage] = useState({ images: 0, videos: 0 });
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<string | null>(null);
  const [prorationPreview, setProrationPreview] = useState<{
    proratedAmount: number;
    daysRemaining: number;
    totalDays: number;
    fullPriceDifference: number;
    currentPlan: { name: string; price: number };
    targetPlan: { name: string; price: number };
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  // Check for upgrade success/cancelled query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const upgradeStatus = params.get('upgrade');
    const upgradedPlan = params.get('plan');
    if (upgradeStatus === 'success' && upgradedPlan) {
      showToast(`${PLAN_PRICES[upgradedPlan]?.name ?? upgradedPlan}プランにアップグレードしました！`, 'success');
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard/settings');
    } else if (upgradeStatus === 'cancelled') {
      showToast('アップグレードがキャンセルされました', 'error');
      window.history.replaceState({}, '', '/dashboard/settings');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch plan
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, billing_interval')
        .eq('id', user.id)
        .single();
      const currentPlan = profile?.plan ?? 'starter';
      setPlan(currentPlan);
      setBillingInterval((profile?.billing_interval ?? 'month') as 'month' | 'year');

      // Fetch usage this billing period
      const periodStart = new Date(
        Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)
      ).toISOString();

      const [{ count: imageCount }, { count: videoCount }] = await Promise.all([
        supabase
          .from('generations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', periodStart),
        supabase
          .from('video_generations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', periodStart),
      ]);

      setUsage({ images: imageCount ?? 0, videos: videoCount ?? 0 });
      setLoading(false);
    })();
  }, [supabase]);

  // Fetch proration preview when a plan is selected
  const fetchProrationPreview = async (targetPlanId: string) => {
    setPreviewLoading(true);
    setProrationPreview(null);
    try {
      const res = await fetch(`/api/stripe/upgrade?targetPlanId=${targetPlanId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch preview');
      }
      const data = await res.json();
      setProrationPreview(data);
    } catch (err) {
      console.error('Proration preview error:', err);
      showToast('プレビューの取得に失敗しました', 'error');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSelectUpgradePlan = (targetPlanId: string) => {
    setSelectedUpgradePlan(targetPlanId);
    setShowUpgradeModal(true);
    fetchProrationPreview(targetPlanId);
  };

  const handleUpgrade = async () => {
    if (!selectedUpgradePlan) return;
    setUpgrading(true);
    try {
      const res = await fetch('/api/stripe/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPlanId: selectedUpgradePlan }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upgrade failed');
      }

      // If upgraded immediately (0 cost)
      if (data.upgraded) {
        setPlan(selectedUpgradePlan);
        setShowUpgradeModal(false);
        showToast(data.message, 'success');
        return;
      }

      // If enterprise
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }

      // Redirect to Stripe checkout
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      }
    } catch (err) {
      console.error('Upgrade error:', err);
      showToast('アップグレードに失敗しました。もう一度お試しください。', 'error');
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) return <SettingsCardSkeleton rows={3} />;

  const planConfig = PLAN_PRICES[plan] ?? PLAN_PRICES.starter;
  const limits = planConfig.limits;
  const currentPlanIndex = PLAN_ORDER.indexOf(plan);

  // Available upgrade plans (higher tier only)
  const upgradePlans = PLAN_ORDER.filter((_, i) => i > currentPlanIndex)
    .map(id => ({ id, ...PLAN_PRICES[id] }))
    .filter(p => p.name); // Ensure valid plan

  const formatLimit = (used: number, limit: number) =>
    limit === -1 ? `${used} / 無制限` : `${used} / ${limit.toLocaleString()}`;

  const usagePercent = (used: number, limit: number) =>
    limit === -1 ? 0 : limit === 0 ? 100 : Math.min(100, Math.round((used / limit) * 100));

  // Calculate next billing date (1st of next month)
  const now = new Date();
  const nextBilling = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const nextBillingStr = nextBilling.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Current Plan Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
        <h3 className="font-bold text-gray-900 mb-1">現在のプラン</h3>
        <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">ご利用中のプランと使用状況を確認します。</p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-gray-50 rounded-xl border border-gray-200 gap-3">
          <div>
            <p className="font-bold text-base sm:text-lg text-gray-900">{planConfig.name}</p>
            <p className="text-xs sm:text-sm text-gray-500">
              ¥{(billingInterval === 'year' ? planConfig.yearlyPriceYen : planConfig.monthlyPriceYen).toLocaleString()} / {billingInterval === 'year' ? '年' : '月'}
            </p>
          </div>
          <span className="self-start sm:self-center px-3 py-1 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-full">有効</span>
        </div>

        {/* Usage bars */}
        <div className="mt-5 sm:mt-6 space-y-4">
          <div>
            <div className="flex justify-between text-xs sm:text-sm mb-1.5">
              <span className="text-gray-600">画像生成</span>
              <span className="font-medium text-gray-900">{formatLimit(usage.images, limits.images)}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-black rounded-full transition-all duration-500"
                style={{ width: `${usagePercent(usage.images, limits.images)}%` }}
              />
            </div>
          </div>

          {limits.videos !== 0 && (
            <div>
              <div className="flex justify-between text-xs sm:text-sm mb-1.5">
                <span className="text-gray-600">動画生成</span>
                <span className="font-medium text-gray-900">{formatLimit(usage.videos, limits.videos)}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-black rounded-full transition-all duration-500"
                  style={{ width: `${usagePercent(usage.videos, limits.videos)}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-between text-xs sm:text-sm pt-2 border-t border-gray-100">
            <span className="text-gray-600">次回請求日</span>
            <span className="font-medium text-gray-900">{nextBillingStr}</span>
          </div>
        </div>
      </div>

      {/* Upgrade Plans */}
      {upgradePlans.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-gray-900">プランをアップグレード</h3>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
            上位プランにアップグレードすると、残りの日数分の差額のみお支払いいただきます。
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {upgradePlans.map(targetPlan => {
              const targetPrice = billingInterval === 'year' ? targetPlan.yearlyPriceYen : targetPlan.monthlyPriceYen;
              const currentPrice = billingInterval === 'year' ? planConfig.yearlyPriceYen : planConfig.monthlyPriceYen;
              const priceDiff = targetPrice - currentPrice;

              return (
                <div
                  key={targetPlan.id}
                  className="relative border border-gray-200 rounded-xl p-4 sm:p-5 hover:border-black/30 hover:shadow-md transition-all group"
                >
                  {targetPlan.id === 'pro' && (
                    <span className="absolute -top-2.5 left-4 px-2 py-0.5 text-[10px] font-bold bg-black text-white rounded-full">
                      人気
                    </span>
                  )}
                  <div className="mb-3">
                    <h4 className="font-bold text-gray-900">{targetPlan.name}</h4>
                    <p className="text-sm text-gray-500 mt-0.5">
                      ¥{targetPrice.toLocaleString()} / {billingInterval === 'year' ? '年' : '月'}
                    </p>
                  </div>

                  <div className="text-xs text-gray-500 mb-3 pb-3 border-b border-gray-100">
                    <span className="text-green-600 font-medium">+¥{priceDiff.toLocaleString()}</span> / {billingInterval === 'year' ? '年' : '月'} の差額
                  </div>

                  <ul className="space-y-1.5 mb-4">
                    {targetPlan.features.slice(0, 3).map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                    {targetPlan.features.length > 3 && (
                      <li className="text-xs text-gray-400">他 {targetPlan.features.length - 3} 件の機能</li>
                    )}
                  </ul>

                  <button
                    onClick={() => targetPlan.id === 'enterprise' ? window.location.href = '/contact' : handleSelectUpgradePlan(targetPlan.id)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium bg-black text-white rounded-lg hover:bg-gray-800 transition-colors group-hover:shadow-lg group-hover:shadow-black/10"
                  >
                    {targetPlan.id === 'enterprise' ? (
                      <>お問い合わせ<ChevronRight className="w-3.5 h-3.5" /></>
                    ) : (
                      <>アップグレード<ArrowUpRight className="w-3.5 h-3.5" /></>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Plan features */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
        <h3 className="font-bold text-gray-900 mb-4">プランの機能</h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {planConfig.features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
              <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedUpgradePlan && (
        <UpgradeModal
          targetPlanId={selectedUpgradePlan}
          prorationPreview={prorationPreview}
          previewLoading={previewLoading}
          upgrading={upgrading}
          billingInterval={billingInterval}
          onConfirm={handleUpgrade}
          onClose={() => {
            setShowUpgradeModal(false);
            setSelectedUpgradePlan(null);
            setProrationPreview(null);
          }}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
    </div>
  );
}

// ─── Upgrade Confirmation Modal ────────────────────────────────────
function UpgradeModal({
  targetPlanId,
  prorationPreview,
  previewLoading,
  upgrading,
  billingInterval,
  onConfirm,
  onClose,
}: {
  targetPlanId: string;
  prorationPreview: {
    proratedAmount: number;
    daysRemaining: number;
    totalDays: number;
    fullPriceDifference: number;
    currentPlan: { name: string; price: number };
    targetPlan: { name: string; price: number };
  } | null;
  previewLoading: boolean;
  upgrading: boolean;
  billingInterval: 'month' | 'year';
  onConfirm: () => void;
  onClose: () => void;
}) {
  const targetPlan = PLAN_PRICES[targetPlanId];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-gray-900">プランアップグレード</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {previewLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <p className="text-sm text-gray-500">差額を計算中...</p>
            </div>
          ) : prorationPreview ? (
            <>
              {/* Plan transition */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl gap-3">
                <div className="text-center flex-1">
                  <p className="text-xs text-gray-500 mb-0.5">現在のプラン</p>
                  <p className="font-bold text-gray-900 text-sm">{prorationPreview.currentPlan.name}</p>
                  <p className="text-xs text-gray-500">¥{prorationPreview.currentPlan.price.toLocaleString()}/{billingInterval === 'year' ? '年' : '月'}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="text-center flex-1">
                  <p className="text-xs text-gray-500 mb-0.5">新しいプラン</p>
                  <p className="font-bold text-gray-900 text-sm">{prorationPreview.targetPlan.name}</p>
                  <p className="text-xs text-gray-500">¥{prorationPreview.targetPlan.price.toLocaleString()}/{billingInterval === 'year' ? '年' : '月'}</p>
                </div>
              </div>

              {/* Proration breakdown */}
              <div className="space-y-2.5 p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">{billingInterval === 'year' ? '年額' : '月額'}差額</span>
                  <span className="text-gray-900">¥{prorationPreview.fullPriceDifference.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">残り日数</span>
                  <span className="text-gray-900">{prorationPreview.daysRemaining}日 / {prorationPreview.totalDays}日</span>
                </div>
                <div className="border-t border-amber-200 pt-2.5 flex justify-between">
                  <span className="font-medium text-gray-900 text-sm">日割りお支払い額</span>
                  <span className="font-bold text-lg text-gray-900">¥{prorationPreview.proratedAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Info */}
              <div className="flex gap-2 p-3 bg-blue-50 rounded-lg">
                <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  今月の残り{prorationPreview.daysRemaining}日分の差額のみお支払いいただきます。来月からは{prorationPreview.targetPlan.name}プランの{billingInterval === 'year' ? '年額' : '月額'}（¥{prorationPreview.targetPlan.price.toLocaleString()}）が適用されます。
                </p>
              </div>

              {/* Features preview */}
              {targetPlan && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-2">アップグレードで追加される機能:</p>
                  <ul className="space-y-1">
                    {targetPlan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">プレビューの取得に失敗しました。</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            disabled={previewLoading || upgrading || !prorationPreview}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-lg shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {upgrading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />処理中...</>
            ) : (
              <><CreditCard className="w-4 h-4" />お支払いへ進む</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Notification Settings ─────────────────────────────────────────
interface NotificationPref {
  key: string;
  label: string;
  desc: string;
  enabled: boolean;
}

const DEFAULT_NOTIFICATIONS: NotificationPref[] = [
  { key: 'generation_complete', label: '生成完了通知', desc: '画像生成が完了した際に通知を受け取ります', enabled: true },
  { key: 'campaign_report', label: 'キャンペーンレポート', desc: '週次のキャンペーンレポートをメールで送信します', enabled: true },
  { key: 'plan_reminder', label: 'プラン更新リマインダー', desc: 'プラン更新の3日前に通知します', enabled: false },
  { key: 'new_features', label: '新機能のお知らせ', desc: '新機能やアップデートに関するお知らせを受け取ります', enabled: true },
];

function NotificationSettings() {
  const supabase = createClient();
  const { toast, showToast, clearToast } = useToast();
  const [notifications, setNotifications] = useState<NotificationPref[]>(DEFAULT_NOTIFICATIONS);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load preferences from Supabase on mount
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data } = await supabase
          .from('profiles')
          .select('notification_preferences')
          .eq('id', user.id)
          .single();

        if (data?.notification_preferences) {
          const stored = data.notification_preferences as Record<string, boolean>;
          setNotifications(prev =>
            prev.map(n => ({
              ...n,
              enabled: stored[n.key] !== undefined ? stored[n.key] : n.enabled,
            }))
          );
        }
      } catch {
        // Use defaults on error
      }
      setLoading(false);
    })();
  }, [supabase]);

  const toggleNotification = (key: string) => {
    setNotifications(prev =>
      prev.map(n => (n.key === key ? { ...n, enabled: !n.enabled } : n))
    );
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const prefs: Record<string, boolean> = {};
      notifications.forEach(n => { prefs[n.key] = n.enabled; });

      const { error } = await supabase
        .from('profiles')
        .update({
          notification_preferences: prefs,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      setDirty(false);
      showToast('通知設定を保存しました', 'success');
    } catch {
      showToast('保存に失敗しました。もう一度お試しください。', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SettingsCardSkeleton rows={4} />;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <h3 className="font-bold text-gray-900">通知設定</h3>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">通知の受信方法とタイミングを設定します。</p>
      </div>
      <div className="divide-y divide-gray-100">
        {notifications.map(n => (
          <div key={n.key} className="flex items-center justify-between p-4 sm:p-6 gap-4">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-900">{n.label}</p>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">{n.desc}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={n.enabled}
              onClick={() => toggleNotification(n.key)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 cursor-pointer ${
                n.enabled ? 'bg-black' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                n.enabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        ))}
      </div>
      {dirty && (
        <div className="p-4 sm:p-6 border-t border-gray-100 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-black text-white px-5 py-2.5 text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-lg shadow-black/10 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? '保存中...' : '設定を保存'}
          </button>
        </div>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
    </div>
  );
}

// ─── Security Settings (Password + Email change) ──────────────────
function SecuritySettings() {
  const supabase = createClient();
  const { toast, showToast, clearToast } = useToast();
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [newEmail, setNewEmail] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setUserEmail(user.email);
    })();
  }, [supabase]);

  const handlePasswordChange = async () => {
    if (passwords.new.length < 6) {
      showToast('パスワードは6文字以上にしてください', 'error');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      showToast('新しいパスワードが一致しません', 'error');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.new });
      if (error) throw error;
      setPasswords({ current: '', new: '', confirm: '' });
      showToast('パスワードを更新しました', 'success');
    } catch {
      showToast('パスワードの更新に失敗しました', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail || newEmail === userEmail) {
      showToast('新しいメールアドレスを入力してください', 'error');
      return;
    }
    setEmailSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      showToast('確認メールを送信しました。メールを確認して変更を完了してください。', 'success');
      setNewEmail('');
    } catch {
      showToast('メールアドレスの更新に失敗しました', 'error');
    } finally {
      setEmailSaving(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Password Change */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">パスワード変更</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">安全なパスワードに定期的に変更することをお勧めします。</p>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">現在のパスワード</label>
            <div className="relative">
              <input
                type={showOld ? 'text' : 'password'}
                value={passwords.current}
                onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
                className="w-full p-2 sm:p-2.5 pr-10 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none"
              />
              <button
                type="button"
                onClick={() => setShowOld(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">新しいパスワード</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={passwords.new}
                  onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))}
                  placeholder="6文字以上"
                  className="w-full p-2 sm:p-2.5 pr-10 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">新しいパスワード（確認）</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={passwords.confirm}
                  onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                  placeholder="もう一度入力"
                  className="w-full p-2 sm:p-2.5 pr-10 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-3 border-t border-gray-100">
            <button
              onClick={handlePasswordChange}
              disabled={saving || !passwords.new || !passwords.confirm}
              className="bg-black text-white px-5 py-2.5 text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-lg shadow-black/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {saving ? '更新中...' : 'パスワードを変更'}
            </button>
          </div>
        </div>
      </div>

      {/* Email Change */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">メールアドレス変更</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 break-all">
            現在のメールアドレス: <span className="font-medium text-gray-700">{userEmail}</span>
          </p>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">新しいメールアドレス</label>
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="new-email@example.com"
              className="w-full p-2 sm:p-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none"
            />
          </div>
          <div className="flex justify-end pt-3 border-t border-gray-100">
            <button
              onClick={handleEmailChange}
              disabled={emailSaving || !newEmail}
              className="bg-black text-white px-5 py-2.5 text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-lg shadow-black/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {emailSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {emailSaving ? '送信中...' : '確認メールを送信'}
            </button>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
    </div>
  );
}

// ─── Loading Skeleton ──────────────────────────────────────────────
function SettingsCardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse">
      <div className="p-4 sm:p-6 border-b border-gray-100 space-y-2">
        <div className="h-5 w-40 bg-gray-200 rounded" />
        <div className="h-3 w-64 bg-gray-100 rounded" />
      </div>
      <div className="p-4 sm:p-6 space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-24 bg-gray-100 rounded" />
            <div className="h-10 w-full bg-gray-100 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
