'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  AlertOctagon,
  CheckSquare,
  FileText,
  BarChart3,
  Users,
  Settings,
  ShieldCheck,
  Building2,
  ChevronRight,
  ExternalLink,
  FormInput,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Loans', href: '/loans', icon: FolderKanban },
  { name: 'Exceptions', href: '/exceptions', icon: AlertOctagon, badge: 'Radar', badgeColor: 'bg-red-500 text-white' },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Forms', href: '/forms', icon: FormInput, badge: 'Builder', badgeColor: 'bg-indigo-600 text-white' },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Team', href: '/team', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ mobileOpen, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { workspace } = useAuth();

  const isCurrent = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const content = (
    <div className="flex flex-col h-full bg-[#0a1424] text-slate-300 w-64 border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-900/30">
            <ShieldCheck className="w-5 h-5 text-blue-100" />
          </div>
          <div>
            <div className="font-bold text-base text-white tracking-tight flex items-center gap-1.5">
              MortgageLevels
              <span className="text-[10px] bg-blue-500/20 text-blue-400 font-semibold px-1.5 py-0.2 rounded border border-blue-400/30">PRO</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Readiness & Exceptions</div>
          </div>
        </Link>

        {/* Current Active Workspace Indicator */}
        <div className="mt-4 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-semibold text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              {workspace.name}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>NMLS #{workspace.nmlsId}</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Active Connection" />
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Core Workflows
        </div>
        {navItems.map((item) => {
          const active = isCurrent(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                'group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-700/40 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn('w-4 h-4 transition-colors', active ? 'text-white' : 'text-slate-400 group-hover:text-blue-400')} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide', item.badgeColor || 'bg-slate-700 text-slate-200')}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Compliance Notice Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400 leading-relaxed">
        <p className="font-semibold text-slate-400 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Human-in-the-Loop
        </p>
        <p className="mt-1 text-[10px] text-slate-400">
          Broker-facing file readiness checks. Not an underwriting guarantee or automated lender approval.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (persistent) */}
      <aside className="hidden lg:block h-screen sticky top-0 shrink-0 z-30">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#0a1424]">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
