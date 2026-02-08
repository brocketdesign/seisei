"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Image as ImageIcon,
  Video,
  Users,
  Megaphone,
  Share2,
  Settings,
  LogOut,
  Sparkles,
  Building2,
  Package,
  FileText,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'ダッシュボード' },
  { href: '/dashboard/generate', icon: ImageIcon, label: '画像生成' },
  { href: '/dashboard/video', icon: Video, label: '動画生成' },
  { href: '/dashboard/models', icon: Users, label: 'モデル管理' },
  { href: '/dashboard/products', icon: Package, label: '商品管理' },
  { href: '/dashboard/campaigns', icon: Megaphone, label: 'キャンペーン' },
  { href: '/dashboard/social', icon: Share2, label: 'ソーシャル' },
  { href: '/dashboard/settings', icon: Settings, label: '設定' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [brandName, setBrandName] = useState<string | null>(null);

  useEffect(() => {
    const fetchBrandName = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('brand_name')
        .eq('id', user.id)
        .single();

      if (data?.brand_name) {
        setBrandName(data.brand_name);
      }
    };

    fetchBrandName();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col fixed h-full z-30">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tighter">生成</h1>
            <p className="text-[10px] text-gray-400 tracking-widest">SEISEI AI</p>
          </div>
        </Link>
      </div>

      {brandName && (
        <div className="mx-4 mb-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-black/5 rounded-md flex items-center justify-center flex-shrink-0">
              <Building2 className="w-3.5 h-3.5 text-gray-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 leading-none mb-0.5">ブランド</p>
              <p className="text-sm font-semibold text-gray-900 truncate">{brandName}</p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-colors relative ${isActive
                  ? 'bg-gray-100 text-black font-bold before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:bg-black before:rounded-full'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
              {item.href === '/dashboard/social' && (
                <span className="ml-auto text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full leading-none">
                  Coming soon
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100 space-y-1">
        <Link
          href="/tokushoho"
          target="_blank"
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-500 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-50"
        >
          <FileText className="w-4 h-4" />
          <span>特定商取引法に基づく表記</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:text-black cursor-pointer transition-colors rounded-lg hover:bg-gray-50"
        >
          <LogOut className="w-4 h-4" />
          <span>ログアウト</span>
        </button>
      </div>
    </aside>
  );
}
