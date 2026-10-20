'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, Building2, AlertCircle } from 'lucide-react';

interface CreateLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoanCreated: () => void;
}

export function CreateLoanModal({ isOpen, onClose, onLoanCreated }: CreateLoanModalProps) {
  const { workspace, currentUser, availableUsers } = useAuth();
  const [loanNumber, setLoanNumber] = useState('');
  const [borrowerDisplayName, setBorrowerDisplayName] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [targetClosingDate, setTargetClosingDate] = useState('');
  const [lenderName, setLenderName] = useState('United Wholesale Mortgage (UWM)');
  const [loanProgram, setLoanProgram] = useState('Conventional 30-Year Fixed');
  const [loanOfficerId, setLoanOfficerId] = useState(currentUser.id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!loanNumber.trim() || !borrowerDisplayName.trim() || !loanAmount || !targetClosingDate) {
      setError('Please fill in all required fields (Loan #, Borrower, Amount, Target Closing).');
      return;
    }

    setLoading(true);
    try {
      const selectedLo = availableUsers.find((u) => u.id === loanOfficerId);
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: workspace.id,
          loanNumber: loanNumber.trim(),
          borrowerDisplayName: borrowerDisplayName.trim(),
          loanAmount: Number(loanAmount),
          propertyAddress: propertyAddress.trim() || 'TBD Primary Residence',
          targetClosingDate,
          lenderName,
          loanProgram,
          loanOfficerId,
          loanOfficerName: selectedLo?.name || currentUser.name,
          stage: 'Setup',
          actorId: currentUser.id,
          actorName: currentUser.name,
          actorRole: currentUser.role,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to create loan');
      }

      // Reset & notify
      setLoanNumber('');
      setBorrowerDisplayName('');
      setLoanAmount('');
      setPropertyAddress('');
      setTargetClosingDate('');
      onLoanCreated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-base text-slate-900">Initiate New Loan File</h3>
            <p className="text-xs text-slate-500">Record loan details to establish requirements and readiness tracking.</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Loan Reference # <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. ML-2026-890"
                value={loanNumber}
                onChange={(e) => setLoanNumber(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Loan Officer <span className="text-red-500">*</span>
              </label>
              <select
                value={loanOfficerId}
                onChange={(e) => setLoanOfficerId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none bg-white"
              >
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Borrower Display Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Robert Davis & Megan Davis"
              value={borrowerDisplayName}
              onChange={(e) => setBorrowerDisplayName(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-0.5">Use authorized borrower names without sensitive personal identification numbers.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Loan Amount ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="e.g. 520000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Closing Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={targetClosingDate}
                onChange={(e) => setTargetClosingDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Property Address</label>
            <input
              type="text"
              placeholder="e.g. 1042 Westlake Dr, Austin, TX 78746"
              value={propertyAddress}
              onChange={(e) => setPropertyAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lender / Wholesale Source</label>
              <input
                type="text"
                value={lenderName}
                onChange={(e) => setLenderName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Loan Program</label>
              <input
                type="text"
                value={loanProgram}
                onChange={(e) => setLoanProgram(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {loading ? 'Creating Loan...' : 'Create Loan Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
