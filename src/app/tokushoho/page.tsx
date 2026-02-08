import React from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '特定商取引法に基づく表記 | 生成 (Seisei)',
  description: '特定商取引法に基づく表記 - 合同会社はと',
};

export default function TokushohoPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-black rounded-lg flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tighter">生成</span>
            <span className="text-[10px] text-gray-400 tracking-widest ml-1 mt-1 hidden sm:inline">SEISEI</span>
            <span className="text-[10px] text-gray-400 ml-1 mt-1 hidden sm:inline">by 合同会社はと</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-6">
            <Link href="/login" className="text-xs sm:text-sm font-medium text-gray-600 hover:text-black transition-colors">
              ログイン
            </Link>
            <Link
              href="/onboarding"
              className="bg-black text-white px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold hover:bg-gray-800 transition-colors"
            >
              今すぐ始める
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-24 sm:pt-28 pb-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 mb-8">
            特定商取引法に基づく表記
          </h1>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <th className="bg-gray-50 px-4 sm:px-6 py-4 text-left font-semibold text-gray-900 w-1/3 align-top">
                    販売業者
                  </th>
                  <td className="px-4 sm:px-6 py-4 text-gray-700">
                    合同会社はと
                  </td>
                </tr>
                <tr>
                  <th className="bg-gray-50 px-4 sm:px-6 py-4 text-left font-semibold text-gray-900 w-1/3 align-top">
                    運営責任者
                  </th>
                  <td className="px-4 sm:px-6 py-4 text-gray-700">
                    バーティディディエルイモリス
                  </td>
                </tr>
                <tr>
                  <th className="bg-gray-50 px-4 sm:px-6 py-4 text-left font-semibold text-gray-900 w-1/3 align-top">
                    所在地
                  </th>
                  <td className="px-4 sm:px-6 py-4 text-gray-700">
                    大阪府大阪市北区梅田１丁目２番２号大阪駅前第２ビル１２－１２
                  </td>
                </tr>
                <tr>
                  <th className="bg-gray-50 px-4 sm:px-6 py-4 text-left font-semibold text-gray-900 w-1/3 align-top">
                    電話番号
                  </th>
                  <td className="px-4 sm:px-6 py-4 text-gray-700">
                    +81 72 200 3399
                  </td>
                </tr>
                <tr>
                  <th className="bg-gray-50 px-4 sm:px-6 py-4 text-left font-semibold text-gray-900 w-1/3 align-top">
                    メールアドレス
                  </th>
                  <td className="px-4 sm:px-6 py-4 text-gray-700">
                    support@seisei.me
                  </td>
                </tr>
                <tr>
                  <th className="bg-gray-50 px-4 sm:px-6 py-4 text-left font-semibold text-gray-900 w-1/3 align-top">
                    販売URL
                  </th>
                  <td className="px-4 sm:px-6 py-4 text-gray-700">
                    <a href="https://www.seisei.me" className="text-blue-600 hover:underline">https://www.seisei.me</a>
                  </td>
                </tr>
                <tr>
                  <th className="bg-gray-50 px-4 sm:px-6 py-4 text-left font-semibold text-gray-900 w-1/3 align-top">
                    コーポレートサイト
                  </th>
                  <td className="px-4 sm:px-6 py-4 text-gray-700">
                    <a href="https://hatoltd.com" className="text-blue-600 hover:underline">https://hatoltd.com</a>
                  </td>
                </tr>
                <tr>
                  <th className="bg-gray-50 px-4 sm:px-6 py-4 text-left font-semibold text-gray-900 w-1/3 align-top">
                    販売価格
                  </th>
                  <td className="px-4 sm:px-6 py-4 text-gray-700">
                    各プランページに記載の価格（税込）<br />
                    スタータープラン：月額 ¥5,000<br />
                    プロフェッショナルプラン：月額 ¥20,000<br />
                    エンタープライズプラン：月額 ¥100,000〜（要相談）
                  </td>
                </tr>
                <tr>
                  <th className="bg-gray-50 px-4 sm:px-6 py-4 text-left font-semibold text-gray-900 w-1/3 align-top">
                    商品以外の必要料金
                  </th>
                  <td className="px-4 sm:px-6 py-4 text-gray-700">
                    なし（インターネット接続にかかる通信料はお客様のご負担となります）
                  </td>
                </tr>
                <tr>
                  <th className="bg-gray-50 px-4 sm:px-6 py-4 text-left font-semibold text-gray-900 w-1/3 align-top">
                    お支払い方法
                  </th>
                  <td className="px-4 sm:px-6 py-4 text-gray-700">
                    クレジットカード（Visa、Mastercard、American Express、JCB）
                  </td>
                </tr>
                <tr>
                  <th className="bg-gray-50 px-4 sm:px-6 py-4 text-left font-semibold text-gray-900 w-1/3 align-top">
                    お支払い時期
                  </th>
                  <td className="px-4 sm:px-6 py-4 text-gray-700">
                    クレジットカード決済：ご注文時に即時決済されます。<br />
                    サブスクリプション：毎月の契約更新日に自動決済されます。
                  </td>
                </tr>
                <tr>
                  <th className="bg-gray-50 px-4 sm:px-6 py-4 text-left font-semibold text-gray-900 w-1/3 align-top">
                    サービス提供時期
                  </th>
                  <td className="px-4 sm:px-6 py-4 text-gray-700">
                    お支払い確認後、直ちにサービスをご利用いただけます。
                  </td>
                </tr>
                <tr>
                  <th className="bg-gray-50 px-4 sm:px-6 py-4 text-left font-semibold text-gray-900 w-1/3 align-top">
                    返品・交換・キャンセルについて
                  </th>
                  <td className="px-4 sm:px-6 py-4 text-gray-700">
                    <p className="mb-2">
                      <span className="font-semibold">＜お客様都合による返品・キャンセル＞</span><br />
                      デジタルサービスの性質上、サービス提供開始後の返品はお受けしておりません。
                      サブスクリプションは、次回更新日の前日までにダッシュボードの設定画面よりいつでも解約いただけます。
                      解約後も、当月の残りの期間はサービスをご利用いただけます。
                    </p>
                    <p>
                      <span className="font-semibold">＜サービスに不具合があった場合＞</span><br />
                      サービスの不具合が確認された場合は、サポートまでご連絡ください。
                      調査の上、適切な対応（サービスの修正、利用期間の延長、または返金）をさせていただきます。
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-black transition-colors"
            >
              ← トップページに戻る
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 sm:py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tighter">生成</span>
            <span className="text-[10px] text-gray-400">by 合同会社はと</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/tokushoho" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">特定商取引法に基づく表記</Link>
            <Link href="/terms" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">利用規約</Link>
          </div>
          <p className="text-xs text-gray-300">
            © 2026 Seisei AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
