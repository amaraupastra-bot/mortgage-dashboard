'use client';

import React, { useState, Suspense } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { CreateLoanModal } from '@/components/modals/CreateLoanModal';
import './globals.css';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [newLoanModalOpen, setNewLoanModalOpen] = useState(false);

  return (
    <html lang="en">
      <head>
        <title>MortgageLevels — Mortgage File Readiness & Workflow Exception Management</title>
        <meta
          name="description"
          content="AI-assisted mortgage file readiness and workflow exception management platform for independent US mortgage brokerages."
        />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen">
        <AuthProvider>
          <div className="flex min-h-screen">
            <Suspense fallback={<aside className="hidden lg:block w-64 bg-[#0a1424] h-screen shrink-0" />}>
              <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
            </Suspense>

            <div className="flex-1 flex flex-col min-w-0">
              <Suspense fallback={<header className="h-16 bg-white border-b border-slate-200" />}>
                <Header
                  onOpenMobileNav={() => setMobileNavOpen(true)}
                  onOpenNewLoanModal={() => setNewLoanModalOpen(true)}
                />
              </Suspense>

              <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
                <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading mortgage workspace...</div>}>
                  {children}
                </Suspense>
              </main>
            </div>
          </div>

          <CreateLoanModal
            isOpen={newLoanModalOpen}
            onClose={() => setNewLoanModalOpen(false)}
            onLoanCreated={() => {
              window.dispatchEvent(new CustomEvent('loan-created'));
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
