import React from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '利用規約 | 生成 (Seisei)',
  description: 'Seisei AI プラットフォームの利用規約',
};

export default function TermsPage() {
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
      <main className="pt-28 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 mb-2">
            利用規約
          </h1>
          <p className="text-sm text-gray-400 mb-12">
            最終更新日: 2026年2月8日
          </p>

          <div className="space-y-10 text-gray-600 text-sm sm:text-base leading-relaxed">
            {/* 1 */}
            <section>
              <h2 className="text-lg font-extrabold text-gray-900 mb-3 tracking-tight">1. サービスの概要</h2>
              <p>
                生成（Seisei、以下「本サービス」）は、AIを活用してファッション関連の画像を生成するB2B向けプラットフォームです。本規約は、本サービスをご利用いただくすべてのユーザー（以下「ユーザー」）に適用されます。本サービスの利用を開始した時点で、本規約に同意したものとみなされます。
              </p>
            </section>

            {/* 2 */}
            <section>
              <h2 className="text-lg font-extrabold text-gray-900 mb-3 tracking-tight">2. アカウント</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>ユーザーはアカウント登録にあたり、正確かつ最新の情報を提供する必要があります。</li>
                <li>アカウントの認証情報は厳重に管理し、第三者に共有しないでください。</li>
                <li>アカウントを通じて行われたすべての活動に対し、ユーザーが責任を負います。</li>
                <li>不正なアクセスが疑われる場合は、速やかに当社までご連絡ください。</li>
              </ul>
            </section>

            {/* 3 */}
            <section>
              <h2 className="text-lg font-extrabold text-gray-900 mb-3 tracking-tight">3. 利用条件</h2>
              <p className="mb-3">本サービスを利用するにあたり、ユーザーは以下の行為を行わないことに同意するものとします。</p>
              <ul className="list-disc list-inside space-y-2">
                <li>法律、規制に違反する目的での使用</li>
                <li>第三者の知的財産権、肖像権、プライバシーを侵害するコンテンツの生成</li>
                <li>差別的、暴力的、わいせつ、または不快なコンテンツの生成</li>
                <li>本サービスのリバースエンジニアリング、スクレイピング、または不正な自動アクセス</li>
                <li>当社のインフラストラクチャに過度な負荷をかける行為</li>
              </ul>
            </section>

            {/* 4 */}
            <section>
              <h2 className="text-lg font-extrabold text-gray-900 mb-3 tracking-tight">4. 知的財産権</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>本サービスのプラットフォーム、デザイン、ソースコード、AIモデルに関するすべての知的財産権は当社に帰属します。</li>
                <li>ユーザーがアップロードした素材（商品画像、モデル写真等）の権利はユーザーに帰属します。</li>
                <li>本サービスを通じて生成された画像は、有効なサブスクリプション期間中、ユーザーが商業目的で利用できます。</li>
                <li>ユーザーは、アップロードする素材について、必要な権利・許諾を取得していることを保証するものとします。</li>
              </ul>
            </section>

            {/* 5 */}
            <section>
              <h2 className="text-lg font-extrabold text-gray-900 mb-3 tracking-tight">5. 料金および支払い</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>本サービスの料金プランおよび価格は、サービス内の料金ページに記載されています。</li>
                <li>支払いは Stripe を通じて安全に処理されます。</li>
                <li>サブスクリプションは自動的に更新されます。更新日前にキャンセルしない限り、次の請求期間の料金が請求されます。</li>
                <li>返金は、当社の返金ポリシーに基づき個別に対応いたします。</li>
                <li>当社は、事前通知のうえ料金を変更する権利を有します。</li>
              </ul>
            </section>

            {/* 6 */}
            <section>
              <h2 className="text-lg font-extrabold text-gray-900 mb-3 tracking-tight">6. サービスの可用性</h2>
              <p>
                当社は、本サービスを可能な限り安定して提供するよう努めますが、以下の理由によりサービスが一時的に中断される場合があります。
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3">
                <li>定期的なメンテナンスおよびシステムの更新</li>
                <li>技術的障害、セキュリティ上の問題、または不可抗力</li>
                <li>第三者のインフラストラクチャ（クラウドサービス、AI API等）の障害</li>
              </ul>
              <p className="mt-3">
                サービス中断に起因する損害について、当社は法律で許容される範囲で責任を負いません。
              </p>
            </section>

            {/* 7 */}
            <section>
              <h2 className="text-lg font-extrabold text-gray-900 mb-3 tracking-tight">7. プライバシーとデータ</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>当社のデータの取り扱いについては、別途定めるプライバシーポリシーをご参照ください。</li>
                <li>ユーザーがアップロードしたデータは、サービス提供の目的にのみ使用されます。</li>
                <li>当社はユーザーのデータをAIモデルのトレーニングに使用しません。</li>
                <li>アカウントを削除した場合、関連するデータは合理的な期間内に削除されます。</li>
              </ul>
            </section>

            {/* 8 */}
            <section>
              <h2 className="text-lg font-extrabold text-gray-900 mb-3 tracking-tight">8. 免責事項</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>本サービスは「現状有姿」で提供され、特定目的への適合性、商品性、正確性に関する明示または黙示の保証はいたしません。</li>
                <li>AI生成画像の品質、正確性、適合性について、当社は保証いたしません。</li>
                <li>ユーザーが生成した画像の使用から生じるいかなる損害についても、当社は責任を負いません。</li>
              </ul>
            </section>

            {/* 9 */}
            <section>
              <h2 className="text-lg font-extrabold text-gray-900 mb-3 tracking-tight">9. 責任の制限</h2>
              <p>
                適用法令で許容される最大限の範囲において、当社の責任は、当該損害が発生した月にユーザーが当社に支払った金額を上限とします。間接的損害、偶発的損害、特別損害、結果的損害、または懲罰的損害について、当社は一切の責任を負いません。
              </p>
            </section>

            {/* 10 */}
            <section>
              <h2 className="text-lg font-extrabold text-gray-900 mb-3 tracking-tight">10. 契約の終了</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>ユーザーは、いつでもアカウントを削除し、本サービスの利用を終了できます。</li>
                <li>当社は、本規約に違反したユーザーのアカウントを事前通知なく停止または終了する権利を有します。</li>
                <li>契約終了後も、知的財産権、免責事項、責任の制限に関する条項は引き続き有効です。</li>
              </ul>
            </section>

            {/* 11 */}
            <section>
              <h2 className="text-lg font-extrabold text-gray-900 mb-3 tracking-tight">11. 規約の変更</h2>
              <p>
                当社は、本規約を随時変更する権利を有します。重要な変更がある場合は、サービス内通知またはメールにてユーザーにお知らせいたします。変更後も本サービスを継続して利用された場合、変更後の規約に同意したものとみなされます。
              </p>
            </section>

            {/* 12 */}
            <section>
              <h2 className="text-lg font-extrabold text-gray-900 mb-3 tracking-tight">12. 準拠法および管轄裁判所</h2>
              <p>
                本規約は日本法に準拠し、解釈されるものとします。本規約に関連する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
              </p>
            </section>

            {/* 13 */}
            <section>
              <h2 className="text-lg font-extrabold text-gray-900 mb-3 tracking-tight">13. お問い合わせ</h2>
              <p>
                本規約に関するご質問やお問い合わせは、以下の連絡先までご連絡ください。
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-xl text-sm">
                <p className="font-bold text-gray-900">Seisei AI</p>
                <p className="mt-1">メール: support@seisei.ai</p>
              </div>
            </section>
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
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-400">
            <Link href="/terms" className="hover:text-gray-900 transition-colors font-medium text-gray-600">利用規約</Link>
            <Link href="/privacy" className="hover:text-gray-900 transition-colors">プライバシーポリシー</Link>
          </div>
          <p className="text-xs text-gray-300">
            © 2026 Seisei AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
