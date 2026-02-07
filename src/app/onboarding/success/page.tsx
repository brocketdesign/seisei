"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Check, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

type Status = 'verifying' | 'processing' | 'logging-in' | 'success' | 'error';

function OnboardingSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');

    const [status, setStatus] = useState<Status>('verifying');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!sessionId) {
            setError('セッションが見つかりません');
            setStatus('error');
            return;
        }

        const verifyAndLogin = async () => {
            const supabase = createClient();
            let attempts = 0;
            const maxAttempts = 20; // 20 seconds max wait

            while (attempts < maxAttempts) {
                try {
                    const response = await fetch(`/api/stripe/session?session_id=${sessionId}`);
                    const data = await response.json();

                    if (data.status === 'ready' && data.email && data.tempPassword) {
                        setStatus('logging-in');

                        // Auto-login with credentials
                        const { error: loginError } = await supabase.auth.signInWithPassword({
                            email: data.email,
                            password: data.tempPassword,
                        });

                        if (loginError) {
                            console.error('Login error:', loginError);
                            // If login fails, redirect to login page
                            router.push('/login?message=account_created');
                            return;
                        }

                        setStatus('success');

                        // Redirect to dashboard after brief success animation
                        setTimeout(() => {
                            router.push('/dashboard');
                        }, 1500);
                        return;
                    }

                    if (data.status === 'processing' || data.status === 'pending') {
                        setStatus('processing');
                    }

                    if (data.error) {
                        throw new Error(data.error);
                    }
                } catch (err) {
                    console.error('Verification attempt failed:', err);
                }

                attempts++;
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Timeout - redirect to login
            setError('アカウント設定に時間がかかっています。ログインページからお試しください。');
            setStatus('error');
        };

        verifyAndLogin();
    }, [sessionId, router]);

    const statusMessages: Record<Status, { title: string; subtitle: string }> = {
        'verifying': {
            title: 'お支払いを確認中...',
            subtitle: 'しばらくお待ちください',
        },
        'processing': {
            title: 'アカウントを設定中...',
            subtitle: 'もう少しで完了します',
        },
        'logging-in': {
            title: 'ログイン中...',
            subtitle: 'ダッシュボードへ移動します',
        },
        'success': {
            title: 'ようこそ！',
            subtitle: 'ダッシュボードへ移動しています',
        },
        'error': {
            title: 'エラーが発生しました',
            subtitle: error || '問題が発生しました',
        },
    };

    const currentStatus = statusMessages[status];

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            {/* Ambient glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(168,85,247,0.15)_0%,_transparent_60%)]" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative text-center px-6"
            >
                {/* Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="mb-8"
                >
                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl border ${status === 'success'
                            ? 'bg-green-500/20 border-green-500/30'
                            : status === 'error'
                                ? 'bg-red-500/20 border-red-500/30'
                                : 'bg-white/10 border-white/10'
                        }`}>
                        {status === 'success' ? (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                            >
                                <Check className="w-10 h-10 text-green-400" />
                            </motion.div>
                        ) : status === 'error' ? (
                            <Sparkles className="w-8 h-8 text-red-400" />
                        ) : (
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                        )}
                    </div>
                </motion.div>

                {/* Text */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-3xl font-bold text-white mb-3"
                >
                    {currentStatus.title}
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-white/50 text-base"
                >
                    {currentStatus.subtitle}
                </motion.p>

                {/* Error action */}
                {status === 'error' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-8"
                    >
                        <button
                            onClick={() => router.push('/login')}
                            className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors"
                        >
                            ログインページへ
                        </button>
                    </motion.div>
                )}

                {/* Loading progress */}
                {(status === 'verifying' || status === 'processing' || status === 'logging-in') && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="mt-10"
                    >
                        <div className="w-48 h-[2px] bg-white/20 rounded-full mx-auto overflow-hidden">
                            <motion.div
                                className="h-full bg-white/60 rounded-full"
                                initial={{ x: '-100%' }}
                                animate={{ x: '100%' }}
                                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                            />
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}

export default function OnboardingSuccess() {
    return (
        <Suspense>
            <OnboardingSuccessContent />
        </Suspense>
    );
}
