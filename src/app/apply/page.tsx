'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Building2,
  CheckCircle2,
  ArrowRight,
  Home,
  DollarSign,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  ChevronLeft,
} from 'lucide-react';

function ApplyContent() {
  const [submitted, setSubmitted] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    borrowerName: '',
    email: '',
    phone: '',
    loanProgram: 'Conventional 30-Year Fixed (Purchase)',
    loanAmount: '450000',
    propertyAddress: '',
    propertyType: 'Single Family Residence',
    targetClosingDate: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const loanNumber = `ML-2026-${Math.floor(100 + Math.random() * 900)}`;

      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: 'ws-apex-101', // Default Brokerage Workspace
          loanNumber,
          borrowerDisplayName: formData.borrowerName.trim(),
          loanAmount: Number(formData.loanAmount),
          propertyAddress: formData.propertyAddress.trim() || 'Address to be verified',
          propertyType: formData.propertyType,
          targetClosingDate: formData.targetClosingDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          lenderName: 'TBD Wholesale Underwriting',
          loanProgram: formData.loanProgram,
          stage: 'Setup',
          actorId: 'usr-public',
          actorName: `${formData.borrowerName} (Borrower)`,
          actorRole: 'PROCESSOR',
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to submit loan request');

      setSubmitted({
        loanNumber,
        borrowerName: formData.borrowerName,
        amount: formData.loanAmount,
        loanId: json.data.id,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Application Received
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-2">File Initiated Successfully</h2>
            <p className="text-xs text-slate-500 mt-1">
              Your mortgage application request has been received by our processing desk.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-slate-500">Loan Reference #</span>
              <span className="font-mono font-bold text-blue-700">{submitted.loanNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Applicant</span>
              <span className="font-bold text-slate-800">{submitted.borrowerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Requested Amount</span>
              <span className="font-bold text-slate-800">${Number(submitted.amount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Assigned Brokerage</span>
              <span className="font-medium text-slate-700">Apex Lending Partners</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            A loan processor will review your initial file requirements and reach out regarding documentation (W-2s, bank statements, and ID verification).
          </p>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              href={`/loans/${submitted.loanId}`}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
            >
              Open in Broker Workspace <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => {
                setSubmitted(null);
                setFormData({
                  borrowerName: '',
                  email: '',
                  phone: '',
                  loanProgram: 'Conventional 30-Year Fixed (Purchase)',
                  loanAmount: '450000',
                  propertyAddress: '',
                  propertyType: 'Single Family Residence',
                  targetClosingDate: '',
                  notes: '',
                });
              }}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium py-1"
            >
              Submit Another Application
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Brand Banner */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5 text-blue-100" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-1">
                Apex Lending Partners
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono border">
                  NMLS #1948201
                </span>
              </div>
              <div className="text-[11px] text-slate-500">Secure Borrower Intake Portal</div>
            </div>
          </Link>

          <Link
            href="/"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>

        {/* Header Intro */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Start Your Mortgage File Pre-Check
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Provide your initial financing requirements. Your details will be routed directly to our loan processing desk for readiness review.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Borrower Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Legal Name(s) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Michael & Emily Vance"
                    value={formData.borrowerName}
                    onChange={(e) => setFormData({ ...formData, borrowerName: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="m.vance@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="(555) 012-3456"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Loan Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Loan Purpose & Program *</label>
                <select
                  value={formData.loanProgram}
                  onChange={(e) => setFormData({ ...formData, loanProgram: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white outline-none focus:border-blue-600"
                >
                  <option value="Conventional 30-Year Fixed (Purchase)">Conventional 30-Year Fixed (Purchase)</option>
                  <option value="FHA 30-Year Fixed (Purchase/Refinance)">FHA 30-Year Fixed (Purchase/Refinance)</option>
                  <option value="VA 30-Year Fixed (Veteran Benefit)">VA 30-Year Fixed (Veteran Benefit)</option>
                  <option value="Jumbo Loan (High Balance)">Jumbo Loan (High Balance)</option>
                  <option value="Rate-and-Term Refinance">Rate-and-Term Refinance</option>
                  <option value="Cash-Out Refinance">Cash-Out Refinance</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estimated Loan Amount ($) *</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    required
                    placeholder="450000"
                    value={formData.loanAmount}
                    onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Property Type</label>
                <select
                  value={formData.propertyType}
                  onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white outline-none focus:border-blue-600"
                >
                  <option value="Single Family Residence">Single Family Residence</option>
                  <option value="Condominium">Condominium</option>
                  <option value="Townhouse">Townhouse</option>
                  <option value="2-4 Unit Multi-Family">2-4 Unit Multi-Family</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Closing / Move-In Date</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={formData.targetClosingDate}
                    onChange={(e) => setFormData({ ...formData, targetClosingDate: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Property Address */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block font-semibold text-slate-700 mb-1">Subject Property Address</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. 512 Oakwood Lane, Austin, TX 78704 (or 'Under Contract TBD')"
                  value={formData.propertyAddress}
                  onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-[11px] flex items-start gap-2">
              <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>Privacy & Security Commitment:</strong> Your information is transmitted over encrypted channels directly to authorized brokerage processors. We never sell your personal information or request unencrypted SSNs online.
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Submitting File...' : 'Submit Financing Request'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading application...</div>}>
      <ApplyContent />
    </Suspense>
  );
}
