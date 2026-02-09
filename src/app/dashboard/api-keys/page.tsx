"use client";

import React, { useCallback, useEffect, useState } from 'react';
import {
    Key,
    Plus,
    Trash2,
    Copy,
    Check,
    AlertCircle,
    Loader2,
    ArrowUpRight,
    Eye,
    EyeOff,
    Clock,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

interface ApiKey {
    id: string;
    name: string;
    key_prefix: string;
    last_used_at: string | null;
    created_at: string;
}

// ─── Toast ────────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-slide-up ${type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}>
            {type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {message}
        </div>
    );
}

function useToast() {
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const showToast = useCallback((message: string, type: 'success' | 'error') => {
        setToast({ message, type });
    }, []);
    const clearToast = useCallback(() => setToast(null), []);
    return { toast, showToast, clearToast };
}

// ─── Main Page ────────────────────────────────────────────────────
export default function ApiKeysPage() {
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState<string>('starter');
    const [creating, setCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [revealedKey, setRevealedKey] = useState<string | null>(null);
    const [showKey, setShowKey] = useState(true);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [copied, setCopied] = useState(false);
    const { toast, showToast, clearToast } = useToast();

    const hasAccess = plan === 'business' || plan === 'enterprise';

    // Fetch keys and plan on mount
    useEffect(() => {
        async function load() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('plan')
                .eq('id', user.id)
                .single();
            setPlan(profile?.plan ?? 'starter');

            const res = await fetch('/api/api-keys');
            if (res.ok) {
                const { keys: fetchedKeys } = await res.json();
                setKeys(fetchedKeys ?? []);
            }
            setLoading(false);
        }
        load();
    }, []);

    // Create key
    async function handleCreate() {
        if (!newKeyName.trim()) return;
        setCreating(true);
        try {
            const res = await fetch('/api/api-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newKeyName.trim() }),
            });
            const data = await res.json();
            if (!res.ok) {
                showToast(data.error || 'Failed to create API key', 'error');
                return;
            }
            setRevealedKey(data.key);
            setShowForm(false);
            setNewKeyName('');
            showToast('APIキーが作成されました', 'success');
            // Refresh list
            const listRes = await fetch('/api/api-keys');
            if (listRes.ok) {
                const { keys: updated } = await listRes.json();
                setKeys(updated ?? []);
            }
        } catch {
            showToast('APIキーの作成に失敗しました', 'error');
        } finally {
            setCreating(false);
        }
    }

    // Revoke key
    async function handleRevoke(id: string) {
        setDeleting(true);
        try {
            const res = await fetch('/api/api-keys', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            if (!res.ok) {
                const data = await res.json();
                showToast(data.error || 'Failed to revoke', 'error');
                return;
            }
            setKeys(prev => prev.filter(k => k.id !== id));
            setConfirmDelete(null);
            showToast('APIキーを無効化しました', 'success');
        } catch {
            showToast('無効化に失敗しました', 'error');
        } finally {
            setDeleting(false);
        }
    }

    // Copy to clipboard
    function copyKey(text: string) {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString('ja-JP', {
            year: 'numeric', month: 'short', day: 'numeric',
        });
    }

    // ─── Loading skeleton ────────────────────────────────────────
    if (loading) {
        return (
            <>
                <header className="mb-6 sm:mb-8">
                    <div className="h-7 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-64 bg-gray-100 rounded mt-2 animate-pulse" />
                </header>
                <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                        ))}
                    </div>
                </div>
            </>
        );
    }

    // ─── Plan gate ───────────────────────────────────────────────
    if (!hasAccess) {
        return (
            <>
                <header className="mb-6 sm:mb-8">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">API連携</h2>
                    <p className="text-gray-500 text-xs sm:text-sm mt-1">APIキーを使用して外部サービスと連携します。</p>
                </header>

                <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-8 sm:p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Key className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">API連携はビジネスプラン以上で利用可能です</h3>
                    <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                        APIキーを作成して、AIエージェントや外部サービスからメール送信などの機能にアクセスできます。
                    </p>
                    <Link
                        href="/dashboard/settings"
                        className="inline-flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                        プランをアップグレード
                        <ArrowUpRight className="w-4 h-4" />
                    </Link>
                </div>
            </>
        );
    }

    // ─── Main content ────────────────────────────────────────────
    return (
        <>
            <header className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">API連携</h2>
                <p className="text-gray-500 text-xs sm:text-sm mt-1">APIキーを作成・管理して、外部サービスやAIエージェントと連携します。</p>
            </header>

            {/* Revealed key banner */}
            {revealedKey && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5 mb-6">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-amber-800 mb-1">
                                このキーは一度だけ表示されます。安全な場所に保存してください。
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <code className="flex-1 min-w-0 text-xs sm:text-sm bg-white border border-amber-200 rounded-lg px-3 py-2 font-mono text-gray-900 overflow-x-auto">
                                    {showKey ? revealedKey : '•'.repeat(40)}
                                </code>
                                <button
                                    onClick={() => setShowKey(!showKey)}
                                    className="p-2 text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
                                    title={showKey ? '非表示' : '表示'}
                                >
                                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => copyKey(revealedKey)}
                                    className="p-2 text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
                                    title="コピー"
                                >
                                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={() => { setRevealedKey(null); setShowKey(true); }}
                            className="text-amber-500 hover:text-amber-700 transition-colors flex-shrink-0"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* API Usage hint */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-5 mb-6">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">使い方</p>
                    <Link
                        href="/dashboard/api-keys/docs"
                        className="inline-flex items-center gap-1.5 text-xs text-black font-medium hover:underline"
                    >
                        APIドキュメント
                        <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
                <code className="block text-xs bg-white border border-gray-200 rounded-lg p-3 font-mono text-gray-700 overflow-x-auto whitespace-pre">{`curl -X POST ${typeof window !== 'undefined' ? window.location.origin : 'https://seisei.me'}/api/v1/email/send \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"to":"user@example.com","subject":"Hello","html":"<p>Hi!</p>"}'`}</code>
            </div>

            {/* Keys card */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900">APIキー</h3>
                    {!showForm && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="inline-flex items-center gap-1.5 bg-black text-white px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            新規作成
                        </button>
                    )}
                </div>

                {/* Create form */}
                {showForm && (
                    <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/50">
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">キー名</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newKeyName}
                                onChange={e => setNewKeyName(e.target.value)}
                                placeholder="例: My AI Agent"
                                className="flex-1 p-2 sm:p-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none transition-shadow"
                                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                                autoFocus
                            />
                            <button
                                onClick={handleCreate}
                                disabled={creating || !newKeyName.trim()}
                                className="inline-flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : '作成'}
                            </button>
                            <button
                                onClick={() => { setShowForm(false); setNewKeyName(''); }}
                                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                キャンセル
                            </button>
                        </div>
                    </div>
                )}

                {/* Keys list */}
                {keys.length === 0 ? (
                    <div className="py-12 sm:py-16 flex flex-col items-center justify-center text-gray-400">
                        <Key size={40} className="mb-3 opacity-20" />
                        <p className="text-sm">APIキーがありません</p>
                        <p className="text-xs text-gray-300 mt-1">「新規作成」からキーを発行してください</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {keys.map(k => (
                            <div key={k.id} className="flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50/50 transition-colors">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-gray-900 truncate">{k.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-400">
                                        <code className="font-mono text-gray-500">{k.key_prefix}</code>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {k.last_used_at ? `最終使用: ${formatDate(k.last_used_at)}` : '未使用'}
                                        </span>
                                        <span>作成: {formatDate(k.created_at)}</span>
                                    </div>
                                </div>

                                {confirmDelete === k.id ? (
                                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                        <span className="text-xs text-red-600 font-medium">無効化しますか？</span>
                                        <button
                                            onClick={() => handleRevoke(k.id)}
                                            disabled={deleting}
                                            className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                        >
                                            {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : '確認'}
                                        </button>
                                        <button
                                            onClick={() => setConfirmDelete(null)}
                                            className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                                        >
                                            戻る
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setConfirmDelete(k.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0 ml-4"
                                        title="無効化"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
        </>
    );
}
