"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Send,
  Building2,
  User,
  Mail,
  Phone,
  MessageSquare,
  Briefcase,
  CheckCircle2,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                  */
/* ------------------------------------------------------------------ */

const ease = [0.25, 0.1, 0.25, 1] as [number, number, number, number];

const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.2 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
};

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ContactForm {
  name: string;
  company: string;
  email: string;
  phone: string;
  plan: string;
  message: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ContactPage() {
  const [form, setForm] = useState<ContactForm>({
    name: '',
    company: '',
    email: '',
    phone: '',
    plan: 'enterprise',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contact',
          ...form,
        }),
      });

      if (!res.ok) {
        throw new Error('送信に失敗しました。もう一度お試しください。');
      }

      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '送信に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = form.name.trim() && form.email.trim() && form.message.trim();

  /* ---- Success State ---- */
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease }}
          className="max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-green-50 rounded-full mb-6"
          >
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease }}
            className="text-2xl font-bold text-gray-900 mb-3"
          >
            送信完了
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5, ease }}
            className="text-gray-500 text-sm leading-relaxed mb-8"
          >
            お問い合わせいただきありがとうございます。<br />
            担当者より2営業日以内にご連絡いたします。
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5, ease }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors"
            >
              トップに戻る
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              プラン選択に戻る
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  /* ---- Form ---- */
  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-purple-50 via-transparent to-transparent rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-blue-50 via-transparent to-transparent rounded-full translate-y-1/2 -translate-x-1/4" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="relative z-10 px-4 sm:px-8 py-6 border-b border-gray-100 bg-white/80 backdrop-blur-md"
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tighter">生成</span>
          </Link>
          <Link
            href="/onboarding?step=plan"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            プラン選択に戻る
          </Link>
        </div>
      </motion.header>

      {/* Main */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">

          {/* Left column — Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease }}
            className="lg:col-span-2 space-y-8"
          >
            <div>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-black text-white rounded-xl mb-5">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 mb-3">
                お問い合わせ
              </h1>
              <p className="text-gray-500 text-sm leading-relaxed">
                エンタープライズプランや導入に関するご相談など、
                お気軽にお問い合わせください。担当者が丁寧にご対応いたします。
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-4">
              {[
                {
                  icon: Building2,
                  title: 'カスタムプラン',
                  desc: '貴社の規模に応じた柔軟なプランをご提案',
                },
                {
                  icon: User,
                  title: '専属マネージャー',
                  desc: '導入から運用まで専任の担当者がサポート',
                },
                {
                  icon: Briefcase,
                  title: 'API連携',
                  desc: '既存システムとのシームレスな統合が可能',
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.4, ease }}
                  className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Contact info */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Mail className="w-4 h-4" />
                <a href="mailto:enterprise@seisei.ai" className="hover:text-black transition-colors">
                  enterprise@seisei.ai
                </a>
              </div>
              <p className="text-xs text-gray-400">
                ※ 通常2営業日以内にご返信いたします
              </p>
            </div>
          </motion.div>

          {/* Right column — Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease }}
            className="lg:col-span-3"
          >
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6"
            >
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="space-y-5"
              >
                {/* Name & Company — 2-col */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <motion.div variants={staggerItem}>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      お名前 <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="山田 太郎"
                        required
                        className="w-full h-12 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black focus:bg-white transition-all placeholder:text-gray-300"
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={staggerItem}>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      会社名
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                      <input
                        type="text"
                        name="company"
                        value={form.company}
                        onChange={handleChange}
                        placeholder="株式会社サンプル"
                        className="w-full h-12 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black focus:bg-white transition-all placeholder:text-gray-300"
                      />
                    </div>
                  </motion.div>
                </div>

                {/* Email & Phone — 2-col */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <motion.div variants={staggerItem}>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      メールアドレス <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="email@example.com"
                        required
                        className="w-full h-12 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black focus:bg-white transition-all placeholder:text-gray-300"
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={staggerItem}>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      電話番号
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="03-1234-5678"
                        className="w-full h-12 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black focus:bg-white transition-all placeholder:text-gray-300"
                      />
                    </div>
                  </motion.div>
                </div>

                {/* Plan interest */}
                <motion.div variants={staggerItem}>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    ご興味のあるプラン
                  </label>
                  <select
                    name="plan"
                    value={form.plan}
                    onChange={handleChange}
                    className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black focus:bg-white transition-all text-gray-700 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat"
                  >
                    <option value="enterprise">エンタープライズ</option>
                    <option value="business">ビジネス</option>
                    <option value="pro">プロフェッショナル</option>
                    <option value="starter">スターター</option>
                    <option value="other">その他・未定</option>
                  </select>
                </motion.div>

                {/* Message */}
                <motion.div variants={staggerItem}>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    お問い合わせ内容 <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="導入に関するご相談内容、ご質問、ご要望などをご記入ください"
                    rows={5}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black focus:bg-white transition-all resize-none placeholder:text-gray-300 leading-relaxed"
                  />
                </motion.div>
              </motion.div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* Submit */}
              <motion.button
                whileHover={{ scale: canSubmit ? 1.01 : 1 }}
                whileTap={{ scale: canSubmit ? 0.98 : 1 }}
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="w-full py-4 bg-black text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-black/5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    送信中...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    送信する
                  </>
                )}
              </motion.button>

              <p className="text-center text-xs text-gray-400">
                <Link href="/terms" className="underline hover:text-gray-600 transition-colors">
                  利用規約
                </Link>
                および
                <Link href="/tokushoho" className="underline hover:text-gray-600 transition-colors">
                  プライバシーポリシー
                </Link>
                に同意の上、送信してください。
              </p>
            </form>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
