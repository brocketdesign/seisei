"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Image as ImageIcon,
  Users,
  Megaphone,
  Settings,
  LogOut,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'ダッシュボード' },
  { href: '/dashboard/generate', icon: ImageIcon, label: '画像生成' },
  { href: '/dashboard/models', icon: Users, label: 'モデル管理' },
  { href: '/dashboard/campaigns', icon: Megaphone, label: 'キャンペーン' },
  { href: '/dashboard/settings', icon: Settings, label: '設定' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col fixed h-full z-30">
      <div className="p-6">
        <Link href="/dashboard" className="block">
          <h1 className="text-2xl font-bold tracking-tighter">生成</h1>
          <p className="text-xs text-gray-400 mt-1 tracking-widest">SEISEI AI</p>
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
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition-colors ${
                isActive
                  ? 'bg-black text-white font-medium shadow-md shadow-black/10'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-black'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:text-black cursor-pointer transition-colors rounded-lg hover:bg-gray-50">
          <LogOut className="w-4 h-4" />
          <span>ログアウト</span>
        </button>
      </div>
    </aside>
  );
}
