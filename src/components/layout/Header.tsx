'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

export function Header({
  onOpenMobileNav,
  onOpenNewLoanModal,
}: {
  onOpenMobileNav: () => void;
  onOpenNewLoanModal: () => void;
}) {
  const { workspace, currentUser, availableWorkspaces, availableUsers, switchWorkspace, switchUser } = useAuth();
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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
            placeholder="Search loan #, borrower, or condition..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
          />
        </div>
      </div>

      {/* Right Controls: Workspace switcher, User Role Switcher, New Loan CTA */}
      <div className="flex items-center gap-3">
        {/* Workspace Switcher */}
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
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 text-xs">
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

        {/* User Role Switcher (Simulating session / auth role) */}
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
              <span className="text-[10px] text-slate-500">{currentUser.role}</span>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-500 hidden sm:inline" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 text-xs">
              <div className="px-3 py-2 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Switch Role / Team Persona
              </div>
              {availableUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    switchUser(u.id);
                    setShowUserMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition ${
                    u.id === currentUser.id ? 'bg-blue-50/70 font-semibold' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-[10px]">
                      {u.name[0]}
                    </div>
                    <div>
                      <div className="text-slate-900">{u.name}</div>
                      <div className="text-[10px] text-slate-500">{u.email}</div>
                    </div>
                  </div>
                  <RoleBadge role={u.role} />
                </button>
              ))}
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
