'use client';

import React, { useState } from 'react';
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
            <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
            <div className="flex-1 flex flex-col min-w-0">
              <Header
                onOpenMobileNav={() => setMobileNavOpen(true)}
                onOpenNewLoanModal={() => setNewLoanModalOpen(true)}
              />
              <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
                {children}
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
