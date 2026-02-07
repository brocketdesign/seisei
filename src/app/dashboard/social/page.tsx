"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Share2,
  Plus,
  Search,
  Eye,
  Heart,
  MessageCircle,
  Repeat2,
  ExternalLink,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
  Link2,
  Unlink,
  BarChart3,
  TrendingUp,
  Calendar,
  Image as ImageIcon,
  ArrowUpRight,
  Send,
  Filter,
  ChevronDown,
  Users,
  Megaphone,
  FolderOpen,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Platform SVG Icons                                                 */
/* ------------------------------------------------------------------ */

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.75a8.18 8.18 0 004.77 1.52V6.84a4.84 4.84 0 01-1-.15z" />
    </svg>
  );
}

function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 0a12 12 0 00-4.373 23.178c-.07-.633-.134-1.606.028-2.298.146-.625.942-3.994.942-3.994s-.24-.482-.24-1.193c0-1.118.648-1.953 1.455-1.953.687 0 1.018.515 1.018 1.133 0 .69-.44 1.722-.667 2.678-.19.803.402 1.457 1.193 1.457 1.431 0 2.53-1.51 2.53-3.687 0-1.928-1.386-3.275-3.365-3.275-2.292 0-3.638 1.72-3.638 3.497 0 .692.267 1.434.6 1.837a.24.24 0 01.056.231c-.061.256-.198.803-.225.916-.035.147-.116.178-.268.107-1-.465-1.624-1.926-1.624-3.1 0-2.523 1.834-4.84 5.286-4.84 2.775 0 4.932 1.977 4.932 4.62 0 2.757-1.739 4.976-4.151 4.976-.811 0-1.573-.421-1.834-.919l-.498 1.902c-.181.695-.669 1.566-.995 2.097A12 12 0 1012 0z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function ThreadsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.004.587c-1.08-3.868-3.745-5.755-7.932-5.618l-.156.008c.566-.156 1.142-.24 1.72-.256h.01c2.058.03 3.827.732 5.115 2.03 1.233 1.243 1.928 2.966 2.066 5.12l2.066.078c-.17-2.75-1.08-4.93-2.7-6.462C18.894 1.24 16.65.407 13.993.38H13.99c-.67 0-1.33.058-1.97.17C8.9.94 6.6 2.78 5.264 5.527 4.126 7.865 3.508 10.702 3.473 12c.036 1.3.654 4.134 1.79 6.474 1.338 2.746 3.64 4.587 6.75 4.976.64.112 1.3.17 1.97.17h.003c2.66-.028 4.903-.86 6.668-2.473 1.62-1.533 2.528-3.71 2.7-6.462l-2.067.078c-.138 2.154-.833 3.877-2.065 5.12-1.29 1.298-3.058 2-5.116 2.03h-.01c-.578-.017-1.154-.1-1.72-.256l.157.008c4.186.137 6.852-1.75 7.932-5.618l2.004.587c-.651 2.337-1.832 4.177-3.509 5.467-1.783 1.373-4.08 2.078-6.826 2.098h-.014zM8.68 17.8c-.934-.467-1.62-1.188-2.043-2.143-.482-1.089-.576-2.474-.281-4.12l.015-.08a10.3 10.3 0 01.37-1.467c.352-.994.87-1.79 1.544-2.37.864-.74 1.983-1.12 3.328-1.128h.045c1.667.017 2.988.612 3.928 1.77.458.564.804 1.245 1.032 2.026-1.276-.594-2.77-.883-4.457-.855-2.262.037-4.058.743-5.337 2.099-1.01 1.07-1.577 2.43-1.688 4.044l-.004.076c.087 1.026.427 1.88 1.014 2.542.494.557 1.15.975 1.954 1.245-.415-.418-.769-.952-1.046-1.581l-.024-.058zm4.882-1.548c-.832.014-1.56-.185-2.162-.59-.538-.364-.922-.866-1.14-1.492-.26-.738-.228-1.538.094-2.384.267-.697.699-1.256 1.286-1.665.682-.475 1.57-.724 2.644-.743 1.372-.022 2.579.2 3.597.664.018.27.024.544.018.825-.055 2.465-.92 4.41-2.5 5.12-.533.245-1.14.275-1.837.265z" />
    </svg>
  );
}

const PlatformIcon: Record<Platform, React.FC<{ className?: string }>> = {
  instagram: InstagramIcon,
  twitter: XIcon,
  tiktok: TikTokIcon,
  pinterest: PinterestIcon,
  facebook: FacebookIcon,
  threads: ThreadsIcon,
};

/* ------------------------------------------------------------------ */
/*  Types & Mock Data                                                  */
/* ------------------------------------------------------------------ */

type Platform = 'instagram' | 'twitter' | 'tiktok' | 'pinterest' | 'facebook' | 'threads';

type ConnectedAccount = {
  id: string;
  platform: Platform;
  handle: string;
  displayName: string;
  followers: number;
  connected: boolean;
};

type PostStatus = 'published' | 'scheduled' | 'failed' | 'draft';

type Post = {
  id: string;
  imageThumbColor: string;
  caption: string;
  platforms: Platform[];
  status: PostStatus;
  publishedAt: string | null;
  scheduledFor: string | null;
  campaignId: string;
  campaignName: string;
  modelId: string;
  modelName: string;
  analytics: {
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
  };
};

const platformMeta: Record<Platform, { label: string; color: string; bg: string; iconColor: string }> = {
  instagram:  { label: 'Instagram',   color: 'text-pink-600',   bg: 'bg-pink-50',  iconColor: 'text-pink-500' },
  twitter:    { label: 'X (Twitter)', color: 'text-gray-900',   bg: 'bg-gray-100', iconColor: 'text-gray-900' },
  tiktok:     { label: 'TikTok',      color: 'text-gray-900',   bg: 'bg-gray-100', iconColor: 'text-gray-900' },
  pinterest:  { label: 'Pinterest',   color: 'text-red-600',    bg: 'bg-red-50',   iconColor: 'text-red-500' },
  facebook:   { label: 'Facebook',    color: 'text-blue-600',   bg: 'bg-blue-50',  iconColor: 'text-blue-600' },
  threads:    { label: 'Threads',     color: 'text-gray-900',   bg: 'bg-gray-100', iconColor: 'text-gray-900' },
};

const connectedAccounts: ConnectedAccount[] = [
  { id: '1', platform: 'instagram',  handle: '@seisei_fashion',   displayName: 'Seisei Fashion', followers: 24500, connected: true },
  { id: '2', platform: 'twitter',    handle: '@seisei_ai',        displayName: 'Seisei AI',      followers: 8200,  connected: true },
  { id: '3', platform: 'tiktok',     handle: '@seisei.fashion',   displayName: 'Seisei Fashion', followers: 52100, connected: true },
  { id: '4', platform: 'pinterest',  handle: 'seiseifashion',     displayName: 'Seisei Fashion', followers: 3400,  connected: false },
  { id: '5', platform: 'facebook',   handle: 'SeiseiFashion',     displayName: 'Seisei Fashion', followers: 11800, connected: false },
  { id: '6', platform: 'threads',    handle: '@seisei_fashion',   displayName: 'Seisei Fashion', followers: 1900,  connected: true },
];

const mockPosts: Post[] = [
  {
    id: 'p1',
    imageThumbColor: 'bg-pink-100',
    caption: '春の新作コレクション🌸 ナチュラルな着こなしで、毎日をもっと素敵に。',
    platforms: ['instagram', 'twitter', 'threads'],
    status: 'published',
    publishedAt: '2026-02-06T14:00:00Z',
    scheduledFor: null,
    campaignId: '1',
    campaignName: '春コレクション 2026',
    modelId: '1',
    modelName: 'Yuki',
    analytics: { impressions: 3420, likes: 287, comments: 34, shares: 52 },
  },
  {
    id: 'p2',
    imageThumbColor: 'bg-red-100',
    caption: 'バレンタイン限定✨ 大切な人と過ごす特別な日に。',
    platforms: ['instagram', 'tiktok'],
    status: 'published',
    publishedAt: '2026-02-05T10:00:00Z',
    scheduledFor: null,
    campaignId: '2',
    campaignName: 'バレンタイン特集',
    modelId: '3',
    modelName: 'Rina',
    analytics: { impressions: 5890, likes: 512, comments: 67, shares: 89 },
  },
  {
    id: 'p3',
    imageThumbColor: 'bg-blue-100',
    caption: 'デニムの新しいカタチ。こだわりの一本を見つけよう。',
    platforms: ['instagram', 'twitter', 'pinterest'],
    status: 'scheduled',
    publishedAt: null,
    scheduledFor: '2026-02-10T09:00:00Z',
    campaignId: '3',
    campaignName: '新作デニムライン',
    modelId: '2',
    modelName: 'Aoi',
    analytics: { impressions: 0, likes: 0, comments: 0, shares: 0 },
  },
  {
    id: 'p4',
    imageThumbColor: 'bg-yellow-100',
    caption: 'Summer vibes are coming ☀️ Stay tuned for our new collection.',
    platforms: ['instagram', 'twitter', 'tiktok', 'threads'],
    status: 'scheduled',
    publishedAt: null,
    scheduledFor: '2026-02-14T12:00:00Z',
    campaignId: '4',
    campaignName: 'Summer 2026',
    modelId: '1',
    modelName: 'Yuki',
    analytics: { impressions: 0, likes: 0, comments: 0, shares: 0 },
  },
  {
    id: 'p5',
    imageThumbColor: 'bg-gray-200',
    caption: 'カジュアルストリート × AI。新しいファッションの提案。',
    platforms: ['tiktok'],
    status: 'failed',
    publishedAt: null,
    scheduledFor: '2026-02-04T18:00:00Z',
    campaignId: '1',
    campaignName: '春コレクション 2026',
    modelId: '2',
    modelName: 'Aoi',
    analytics: { impressions: 0, likes: 0, comments: 0, shares: 0 },
  },
  {
    id: 'p6',
    imageThumbColor: 'bg-purple-100',
    caption: 'エレガントな夜のスタイリング。特別な日のために。',
    platforms: ['instagram'],
    status: 'draft',
    publishedAt: null,
    scheduledFor: null,
    campaignId: '2',
    campaignName: 'バレンタイン特集',
    modelId: '3',
    modelName: 'Rina',
    analytics: { impressions: 0, likes: 0, comments: 0, shares: 0 },
  },
];

const statusMeta: Record<PostStatus, { label: string; icon: typeof CheckCircle2; style: string }> = {
  published: { label: '公開済み', icon: CheckCircle2, style: 'text-green-600 bg-green-50 border-green-200' },
  scheduled: { label: '予約中',   icon: Clock,        style: 'text-blue-600 bg-blue-50 border-blue-200' },
  failed:    { label: '失敗',     icon: XCircle,      style: 'text-red-600 bg-red-50 border-red-200' },
  draft:     { label: '下書き',   icon: Clock,        style: 'text-gray-600 bg-gray-50 border-gray-200' },
};

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function SocialPage() {
  const [filterStatus, setFilterStatus] = useState<'all' | PostStatus>('all');
  const [filterPlatform, setFilterPlatform] = useState<'all' | Platform>('all');
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [showAccounts, setShowAccounts] = useState(false);

  const connectedCount = connectedAccounts.filter(a => a.connected).length;
  const totalFollowers = connectedAccounts.filter(a => a.connected).reduce((s, a) => s + a.followers, 0);

  const filteredPosts = mockPosts.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterPlatform !== 'all' && !p.platforms.includes(filterPlatform)) return false;
    return true;
  });

  const totalImpressions = mockPosts.reduce((s, p) => s + p.analytics.impressions, 0);
  const totalEngagement = mockPosts.reduce((s, p) => s + p.analytics.likes + p.analytics.comments + p.analytics.shares, 0);

  return (
    <>
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ソーシャルメディア</h2>
          <p className="text-gray-500 text-sm mt-1">SNS投稿の管理・スケジュール・パフォーマンスを確認します。</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAccounts(!showAccounts)}
            className="px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Link2 className="w-4 h-4" />
            アカウント管理
          </button>
          <button className="bg-black text-white px-5 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 rounded-lg shadow-lg shadow-black/10">
            <Plus className="w-4 h-4" />
            新規投稿
          </button>
        </div>
      </header>

      {/* Connected Accounts Panel (collapsible) */}
      {showAccounts && (
        <div className="mb-8 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">接続済みアカウント</h3>
                <p className="text-xs text-gray-500 mt-1">
                  <a href="https://getlate.dev" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black transition-colors inline-flex items-center gap-1">
                    Powered by Late API <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">{connectedCount} / {connectedAccounts.length} 接続済み</span>
                <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-lg shadow-black/10">
                  <Plus className="w-3.5 h-3.5" />
                  新規アカウント接続
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-gray-100">
            {connectedAccounts.map((account) => {
              const meta = platformMeta[account.platform];
              const Icon = PlatformIcon[account.platform];
              return (
                <div key={account.id} className="bg-white p-5 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${meta.iconColor}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-gray-900 truncate">{account.displayName}</p>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{account.handle}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${meta.bg} ${meta.color}`}>{meta.label}</span>
                      {account.connected && (
                        <span className="text-[10px] text-gray-400">{account.followers.toLocaleString()} フォロワー</span>
                      )}
                    </div>
                  </div>
                  {account.connected ? (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                        <CheckCircle2 className="w-3 h-3" /> 接続済み
                      </span>
                    </div>
                  ) : (
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex-shrink-0">
                      <Link2 className="w-3 h-3" />
                      接続
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {[
          { label: '接続プラットフォーム', value: connectedCount, icon: Share2 },
          { label: '合計フォロワー', value: totalFollowers.toLocaleString(), icon: Users },
          { label: '合計インプレッション', value: totalImpressions.toLocaleString(), icon: Eye },
          { label: '合計エンゲージメント', value: totalEngagement.toLocaleString(), icon: TrendingUp },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-gray-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="投稿を検索..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-black/5 outline-none transition-all"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          {([
            { key: 'all', label: 'すべて' },
            { key: 'published', label: '公開済み' },
            { key: 'scheduled', label: '予約中' },
            { key: 'draft', label: '下書き' },
            { key: 'failed', label: '失敗' },
          ] as const).map(f => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === f.key
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Platform Filter */}
        <select
          value={filterPlatform}
          onChange={(e) => setFilterPlatform(e.target.value as 'all' | Platform)}
          className="px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 border-none outline-none cursor-pointer"
        >
          <option value="all">全プラットフォーム</option>
          {Object.entries(platformMeta).map(([key, meta]) => (
            <option key={key} value={key}>{meta.label}</option>
          ))}
        </select>
      </div>

      {/* Posts List */}
      <div className="space-y-3">
        {filteredPosts.map((post) => {
          const sMeta = statusMeta[post.status];
          const StatusIcon = sMeta.icon;
          const isExpanded = expandedPost === post.id;

          return (
            <div
              key={post.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              {/* Main Row */}
              <div
                className="p-5 flex items-center gap-5 cursor-pointer"
                onClick={() => setExpandedPost(isExpanded ? null : post.id)}
              >
                {/* Image Thumbnail */}
                <div className={`w-16 h-16 rounded-lg ${post.imageThumbColor} flex-shrink-0 flex items-center justify-center`}>
                  <ImageIcon className="w-6 h-6 text-gray-400/50" />
                </div>

                {/* Caption & Meta */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{post.caption}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    {/* Platforms */}
                    <div className="flex gap-1">
                      {post.platforms.map(p => {
                        const PIcon = PlatformIcon[p];
                        return (
                          <span key={p} className={`text-[10px] px-1.5 py-0.5 rounded ${platformMeta[p].bg} ${platformMeta[p].color} font-medium inline-flex items-center gap-1`}>
                            <PIcon className="w-3 h-3" />
                            {platformMeta[p].label}
                          </span>
                        );
                      })}
                    </div>
                    <span className="text-gray-300">·</span>
                    {/* Campaign Link */}
                    <Link
                      href="/dashboard/campaigns"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[10px] text-gray-500 hover:text-black flex items-center gap-1 transition-colors"
                    >
                      <Megaphone className="w-3 h-3" />
                      {post.campaignName}
                    </Link>
                    <span className="text-gray-300">·</span>
                    {/* Model Link */}
                    <Link
                      href="/dashboard/models"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[10px] text-gray-500 hover:text-black flex items-center gap-1 transition-colors"
                    >
                      <Users className="w-3 h-3" />
                      {post.modelName}
                    </Link>
                  </div>
                </div>

                {/* Status */}
                <span className={`px-3 py-1 text-xs font-medium rounded-full border flex items-center gap-1.5 flex-shrink-0 ${sMeta.style}`}>
                  <StatusIcon className="w-3 h-3" />
                  {sMeta.label}
                </span>

                {/* Date */}
                <div className="text-right flex-shrink-0 w-28">
                  {post.status === 'published' && post.publishedAt && (
                    <p className="text-xs text-gray-500">{new Date(post.publishedAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  )}
                  {post.status === 'scheduled' && post.scheduledFor && (
                    <p className="text-xs text-blue-500 flex items-center gap-1 justify-end">
                      <Calendar className="w-3 h-3" />
                      {new Date(post.scheduledFor).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                  {post.status === 'draft' && <p className="text-xs text-gray-400">未設定</p>}
                  {post.status === 'failed' && post.scheduledFor && (
                    <p className="text-xs text-red-400">{new Date(post.scheduledFor).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}</p>
                  )}
                </div>

                {/* Expand */}
                <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </div>

              {/* Expanded Detail Panel */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50/50">
                  <div className="p-6 grid grid-cols-12 gap-6">

                    {/* Left: Image & Caption */}
                    <div className="col-span-4 space-y-4">
                      <div className={`w-full aspect-[4/5] rounded-lg ${post.imageThumbColor} flex items-center justify-center`}>
                        <ImageIcon className="w-12 h-12 text-gray-400/30" />
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{post.caption}</p>
                    </div>

                    {/* Middle: Details */}
                    <div className="col-span-4 space-y-5">
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">投稿情報</h4>
                        <div className="space-y-3">
                          <DetailRow label="ステータス">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${sMeta.style}`}>{sMeta.label}</span>
                          </DetailRow>
                          <DetailRow label="プラットフォーム">
                            <div className="flex flex-wrap gap-1">
                              {post.platforms.map(p => {
                                const PIcon = PlatformIcon[p];
                                return (
                                  <span key={p} className={`text-[10px] px-1.5 py-0.5 rounded ${platformMeta[p].bg} ${platformMeta[p].color} font-medium inline-flex items-center gap-1`}>
                                    <PIcon className="w-3 h-3" />
                                    {platformMeta[p].label}
                                  </span>
                                );
                              })}
                            </div>
                          </DetailRow>
                          {post.publishedAt && (
                            <DetailRow label="公開日時">
                              <span className="text-xs text-gray-700">{new Date(post.publishedAt).toLocaleString('ja-JP')}</span>
                            </DetailRow>
                          )}
                          {post.scheduledFor && (
                            <DetailRow label="予約日時">
                              <span className="text-xs text-gray-700">{new Date(post.scheduledFor).toLocaleString('ja-JP')}</span>
                            </DetailRow>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">関連データ</h4>
                        <div className="space-y-2">
                          <Link
                            href="/dashboard/campaigns"
                            className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-black transition-colors group"
                          >
                            <div className="flex items-center gap-2.5">
                              <FolderOpen className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-xs font-medium text-gray-900">{post.campaignName}</p>
                                <p className="text-[10px] text-gray-400">キャンペーン</p>
                              </div>
                            </div>
                            <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-black transition-colors" />
                          </Link>
                          <Link
                            href="/dashboard/models"
                            className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-black transition-colors group"
                          >
                            <div className="flex items-center gap-2.5">
                              <Users className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-xs font-medium text-gray-900">{post.modelName}</p>
                                <p className="text-[10px] text-gray-400">モデル</p>
                              </div>
                            </div>
                            <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-black transition-colors" />
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Right: Analytics */}
                    <div className="col-span-4">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">パフォーマンス</h4>
                      {post.status === 'published' ? (
                        <div className="space-y-3">
                          {[
                            { label: 'インプレッション', value: post.analytics.impressions, icon: Eye },
                            { label: 'いいね', value: post.analytics.likes, icon: Heart },
                            { label: 'コメント', value: post.analytics.comments, icon: MessageCircle },
                            { label: 'シェア', value: post.analytics.shares, icon: Repeat2 },
                          ].map((metric) => (
                            <div key={metric.label} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                              <div className="flex items-center gap-2.5">
                                <metric.icon className="w-4 h-4 text-gray-400" />
                                <span className="text-xs text-gray-600">{metric.label}</span>
                              </div>
                              <span className="text-sm font-bold text-gray-900">{metric.value.toLocaleString()}</span>
                            </div>
                          ))}
                          <div className="p-3 bg-white rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs text-gray-600">エンゲージメント率</span>
                              <span className="text-sm font-bold text-gray-900">
                                {post.analytics.impressions > 0
                                  ? ((post.analytics.likes + post.analytics.comments + post.analytics.shares) / post.analytics.impressions * 100).toFixed(1)
                                  : 0}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div
                                className="bg-black rounded-full h-1.5 transition-all"
                                style={{
                                  width: `${Math.min(
                                    post.analytics.impressions > 0
                                      ? ((post.analytics.likes + post.analytics.comments + post.analytics.shares) / post.analytics.impressions * 100)
                                      : 0,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-400 border border-dashed border-gray-200 rounded-lg bg-white">
                          <BarChart3 className="w-8 h-8 mb-2 opacity-20" />
                          <p className="text-xs">公開後にデータが表示されます</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
                    {post.status === 'draft' && (
                      <button className="px-4 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2">
                        <Send className="w-3.5 h-3.5" />
                        今すぐ投稿
                      </button>
                    )}
                    {post.status === 'scheduled' && (
                      <button className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        予約を編集
                      </button>
                    )}
                    {post.status === 'failed' && (
                      <button className="px-4 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2">
                        <Repeat2 className="w-3.5 h-3.5" />
                        再試行
                      </button>
                    )}
                    <button className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                      <ExternalLink className="w-3.5 h-3.5" />
                      投稿を確認
                    </button>
                    <button className="p-2 text-gray-400 hover:text-black rounded-lg hover:bg-gray-100 transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredPosts.length === 0 && (
          <div className="py-16 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
            <Share2 size={48} className="mb-4 opacity-20" />
            <p className="text-sm">投稿が見つかりません</p>
          </div>
        )}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper                                                             */
/* ------------------------------------------------------------------ */

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between">
      <span className="text-xs text-gray-500">{label}</span>
      {children}
    </div>
  );
}
