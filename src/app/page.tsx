import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter">生成</h1>
          <p className="text-sm text-gray-500 tracking-widest uppercase">SEISEI AI</p>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-medium text-gray-900">次世代のファッションAIソリューション</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            プロフェッショナルな品質で、ブランドの世界観をAIが再現します。<br/>
            まずは、貴社のスタイルをお聞かせください。
          </p>
        </div>

        <div className="pt-8">
          <Link 
            href="/onboarding" 
            className="inline-flex items-center justify-center w-full bg-black text-white h-12 px-6 rounded-none hover:bg-gray-800 transition-colors duration-200 group"
          >
            <span className="text-sm font-medium">始める</span>
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="mt-4 text-xs text-gray-400">
            登録することで、利用規約とプライバシーポリシーに同意したものとみなされます。
          </p>
        </div>
      </div>
    </div>
  );
}
