'use client';

import React, { useEffect, useState, useCallback, useTransition, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loan, LoanStage } from '@/types';
import { StageBadge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  FolderKanban,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  ChevronRight,
  AlertCircle,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Building,
  User,
  Archive,
  RefreshCw,
} from 'lucide-react';

function LoansContent() {
  const searchParams = useSearchParams();
  const initialStage = searchParams.get('stage') || 'all';
  const initialBlockers = searchParams.get('hasBlockers') === 'true';

  const { workspace, currentUser, availableUsers } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>(initialStage);
  const [selectedOwner, setSelectedOwner] = useState<string>('all');
  const [onlyBlockers, setOnlyBlockers] = useState<boolean>(initialBlockers);
  const [sortField, setSortField] = useState<'closingDate' | 'amount' | 'readiness'>('closingDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ workspaceId: workspace.id });
      if (selectedStage !== 'all') params.set('stage', selectedStage);
      if (selectedOwner !== 'all') params.set('ownerId', selectedOwner);
      if (onlyBlockers) params.set('hasBlockers', 'true');

      const res = await fetch(`/api/loans?${params.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load loans');
      setLoans(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [workspace.id, selectedStage, selectedOwner, onlyBlockers]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  // Client-side search & sort
  const filteredLoans = loans.filter((l) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      l.loanNumber.toLowerCase().includes(term) ||
      l.borrowerDisplayName.toLowerCase().includes(term) ||
      l.propertyAddress.toLowerCase().includes(term) ||
      l.lenderName.toLowerCase().includes(term)
    );
  });

  filteredLoans.sort((a, b) => {
    if (sortField === 'closingDate') {
      const diff = new Date(a.targetClosingDate).getTime() - new Date(b.targetClosingDate).getTime();
      return sortOrder === 'asc' ? diff : -diff;
    }
    if (sortField === 'amount') {
      return sortOrder === 'asc' ? a.loanAmount - b.loanAmount : b.loanAmount - a.loanAmount;
    }
    if (sortField === 'readiness') {
      return sortOrder === 'asc' ? a.readinessScore - b.readinessScore : b.readinessScore - a.readinessScore;
    }
    return 0;
  });

  const totalPages = Math.ceil(filteredLoans.length / itemsPerPage) || 1;
  const paginatedLoans = filteredLoans.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleArchiveLoan = async (loanId: string, currentStage: LoanStage) => {
    if (!confirm('Are you sure you want to archive this loan file?')) return;
    try {
      const res = await fetch(`/api/loans/${loanId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: workspace.id,
          stage: 'Archived',
          actorId: currentUser.id,
          actorName: currentUser.name,
          actorRole: currentUser.role,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchLoans();
      }
    } catch (err) {
      alert('Failed to archive loan');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-blue-600" />
            Loan Files & Pipeline Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage active mortgage applications, review readiness metrics, track conditions, and inspect blockers.
          </p>
        </div>
        <button
          onClick={fetchLoans}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by loan #, borrower name, address, or lender..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Stage Filter */}
          <div>
            <select
              value={selectedStage}
              onChange={(e) => {
                setSelectedStage(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
            >
              <option value="all">All Loan Stages</option>
              <option value="Setup">Setup</option>
              <option value="In Progress">In Progress</option>
              <option value="Blocked">Blocked</option>
              <option value="Ready for Broker Review">Ready for Broker Review</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          {/* Loan Officer Filter */}
          <div>
            <select
              value={selectedOwner}
              onChange={(e) => {
                setSelectedOwner(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
            >
              <option value="all">All Loan Officers</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Toggles & Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
            <input
              type="checkbox"
              checked={onlyBlockers}
              onChange={(e) => {
                setOnlyBlockers(e.target.checked);
                setCurrentPage(1);
              }}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-red-500" /> Only show files with confirmed blocking exceptions
            </span>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Sort By:</span>
            <button
              onClick={() => {
                if (sortField === 'closingDate') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                else { setSortField('closingDate'); setSortOrder('asc'); }
              }}
              className={`px-2 py-1 rounded text-xs font-medium border ${
                sortField === 'closingDate' ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold' : 'border-slate-200 text-slate-600'
              }`}
            >
              Closing Date {sortField === 'closingDate' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => {
                if (sortField === 'readiness') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                else { setSortField('readiness'); setSortOrder('desc'); }
              }}
              className={`px-2 py-1 rounded text-xs font-medium border ${
                sortField === 'readiness' ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold' : 'border-slate-200 text-slate-600'
              }`}
            >
              Readiness % {sortField === 'readiness' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
      </div>

      {/* Loan List / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredLoans.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="font-bold text-sm text-slate-800">No loan files match your criteria</h3>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your stage, officer, or search filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Loan Reference</th>
                  <th className="py-3 px-4">Borrower & Property</th>
                  <th className="py-3 px-4">Amount & Program</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Readiness</th>
                  <th className="py-3 px-4">Target Closing</th>
                  <th className="py-3 px-4">Assigned Team</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      <Link href={`/loans/${loan.id}`} className="hover:underline flex items-center gap-1.5">
                        {loan.loanNumber}
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                      </Link>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{loan.borrowerDisplayName}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{loan.propertyAddress}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{formatCurrency(loan.loanAmount)}</div>
                      <div className="text-[11px] text-slate-500">{loan.loanProgram}</div>
                    </td>

                    <td className="py-3 px-4">
                      <StageBadge stage={loan.stage} />
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              loan.readinessScore >= 90
                                ? 'bg-emerald-500'
                                : loan.readinessScore >= 60
                                ? 'bg-blue-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${loan.readinessScore}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-800 text-[11px]">{loan.readinessScore}%</span>
                      </div>
                      {loan.hasBlockingExceptions && (
                        <span className="text-[10px] text-red-600 font-medium flex items-center gap-0.5 mt-0.5">
                          <ShieldAlert className="w-2.5 h-2.5" /> Blocker Active
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{formatDate(loan.targetClosingDate)}</div>
                      <div className="text-[10px] text-slate-400">{loan.lenderName}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-medium">{loan.loanOfficerName || 'LO Unassigned'}</div>
                      <div className="text-[10px] text-slate-500">{loan.processorName || 'Processor Unassigned'}</div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/loans/${loan.id}`}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition"
                        >
                          Workspace
                        </Link>
                        {loan.stage !== 'Archived' && (
                          <button
                            onClick={() => handleArchiveLoan(loan.id, loan.stage)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                            title="Archive loan"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing page {currentPage} of {totalPages} ({filteredLoans.length} total loans)
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-slate-200 disabled:opacity-50 hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded border border-slate-200 disabled:opacity-50 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoansPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading loan pipeline...</div>}>
      <LoansContent />
    </Suspense>
  );
}
