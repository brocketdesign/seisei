"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Image as ImageIcon,
  Users,
  Megaphone,
  Share2,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'ダッシュボード' },
  { href: '/dashboard/generate', icon: ImageIcon, label: '画像生成' },
  { href: '/dashboard/models', icon: Users, label: 'モデル管理' },
  { href: '/dashboard/campaigns', icon: Megaphone, label: 'キャンペーン' },
  { href: '/dashboard/social', icon: Share2, label: 'ソーシャル' },
  { href: '/dashboard/settings', icon: Settings, label: '設定' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

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
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
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
