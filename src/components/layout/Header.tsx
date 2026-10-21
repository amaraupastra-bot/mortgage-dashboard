'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { RoleBadge } from '@/components/ui/Badge';
import {
  Menu,
  Plus,
  Search,
  Bell,
  Building2,
  ChevronDown,
  UserCheck,
  ShieldAlert,
  ExternalLink,
  LogOut,
  Sparkles,
  User,
  ShieldCheck,
} from 'lucide-react';

export function Header({
  onOpenMobileNav,
  onOpenNewLoanModal,
}: {
  onOpenMobileNav: () => void;
  onOpenNewLoanModal: () => void;
}) {
  const { workspace, currentUser, availableWorkspaces, availableUsers, switchWorkspace, switchUser, logout } = useAuth();
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isAdmin = currentUser.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 lg:px-6 h-16 flex items-center justify-between">
      {/* Left: Mobile Nav Toggle & Breadcrumb / Search */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              currentUser.role === 'LOAN_OFFICER'
                ? 'Search your assigned loans or borrowers...'
                : 'Search loan #, borrower, or condition...'
            }
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
          />
        </div>
      </div>

      {/* Right Controls: Workspace switcher, Trial Badge, User Profile, New Loan CTA */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Free Trial Badge Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>14-Day Free Trial (11d left)</span>
        </div>

        {/* Workspace Switcher (Admin Only for multi-tenant switching) */}
        {isAdmin && (
          <div className="relative">
            <button
              onClick={() => {
                setShowWorkspaceMenu(!showWorkspaceMenu);
                setShowUserMenu(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden md:inline">{workspace.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {showWorkspaceMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Brokerage Workspace
                </div>
                {availableWorkspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      switchWorkspace(ws.id);
                      setShowWorkspaceMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition ${
                      ws.id === workspace.id ? 'bg-blue-50/70 text-blue-800 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div>{ws.name}</div>
                      <div className="text-[10px] text-slate-500">NMLS #{ws.nmlsId}</div>
                    </div>
                    {ws.id === workspace.id && <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded">Active</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowWorkspaceMenu(false);
            }}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs text-slate-700 transition"
          >
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
              {currentUser.name[0]}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="font-semibold text-slate-900 leading-tight">{currentUser.name}</span>
              <span className="text-[10px] text-slate-500">
                {currentUser.role === 'ADMIN' ? 'Broker of Record' : currentUser.role === 'LOAN_OFFICER' ? 'Loan Officer' : 'Processor'}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-500 hidden sm:inline" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
              {/* Profile Card Header */}
              <div className="p-3.5 border-b border-slate-100 bg-slate-50 rounded-t-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {currentUser.name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 leading-tight truncate">{currentUser.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
                    <div className="mt-1">
                      <RoleBadge role={currentUser.role} />
                    </div>
                  </div>
                </div>
              </div>

              {/* If ADMIN: show switcher option for testing */}
              {isAdmin && (
                <div className="p-2 border-b border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                    Admin Test Persona Switcher
                  </span>
                  <div className="space-y-0.5">
                    {availableUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          switchUser(u.id);
                          setShowUserMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-slate-50 transition ${
                          u.id === currentUser.id ? 'bg-blue-50/80 font-semibold text-blue-900' : 'text-slate-700'
                        }`}
                      >
                        <span className="truncate">{u.name}</span>
                        <span className="text-[9px] px-1 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                          {u.role}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Non-Admin Info Card */}
              {!isAdmin && (
                <div className="p-3 border-b border-slate-100 text-[11px] text-slate-500 leading-relaxed">
                  <div className="flex items-center gap-1.5 text-slate-700 font-semibold mb-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    {workspace.name}
                  </div>
                  <span>NMLS #{workspace.nmlsId} &bull; Individual Originator Access</span>
                </div>
              )}

              {/* Sign Out Button */}
              <div className="p-1.5">
                <Link
                  href="/login"
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-red-600 hover:bg-red-50 transition text-xs font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-500" />
                  <span>Sign Out of Portal</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* New Loan Action Button */}
        <button
          onClick={onOpenNewLoanModal}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Loan</span>
        </button>
      </div>
    </header>
  );
}
