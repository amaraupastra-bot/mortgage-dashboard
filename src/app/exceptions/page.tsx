'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Exception, ExceptionSeverity, ExceptionStatus, ExceptionCategory } from '@/types';
import { SeverityBadge, ExceptionStatusBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import {
  AlertOctagon,
  Search,
  Filter,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  User,
  Sparkles,
  Info,
  X,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export default function ExceptionsRadarPage() {
  const { workspace, currentUser, availableUsers } = useAuth();
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [resolvingException, setResolvingException] = useState<Exception | null>(null);
  const [assigningException, setAssigningException] = useState<Exception | null>(null);

  const fetchExceptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ workspaceId: workspace.id });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (severityFilter !== 'all') params.set('severity', severityFilter);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (ownerFilter !== 'all') params.set('ownerId', ownerFilter);

      const res = await fetch(`/api/exceptions?${params.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to fetch exceptions');
      setExceptions(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [workspace.id, statusFilter, severityFilter, categoryFilter, ownerFilter]);

  useEffect(() => {
    fetchExceptions();
  }, [fetchExceptions]);

  const filteredExceptions = exceptions.filter((exc) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      exc.loanNumber.toLowerCase().includes(term) ||
      exc.borrowerDisplayName.toLowerCase().includes(term) ||
      exc.issue.toLowerCase().includes(term) ||
      exc.evidence.toLowerCase().includes(term) ||
      exc.category.toLowerCase().includes(term)
    );
  });

  const handleDismissException = async (exc: Exception) => {
    if (!confirm(`Dismiss exception "${exc.issue}"? This records the dismiss action in the audit log.`)) return;
    try {
      await fetch('/api/exceptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: workspace.id,
          id: exc.id,
          status: 'Dismissed',
          reviewerNotes: `Dismissed by ${currentUser.name} (${currentUser.role})`,
          actorId: currentUser.id,
          actorName: currentUser.name,
          actorRole: currentUser.role,
        }),
      });
      fetchExceptions();
    } catch {
      alert('Failed to dismiss exception');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <AlertOctagon className="w-6 h-6 text-red-600" />
            Exception Radar & Blocker Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-loan defect tracking with transparent prioritization rules. Review findings, assign ownership, and resolve blockers.
          </p>
        </div>
        <button
          onClick={fetchExceptions}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Priority Logic Banner */}
      <div className="p-4 bg-slate-900 text-white rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-blue-400">
            <Info className="w-4 h-4" /> Transparent Priority Rules
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Items are ranked by verified risk factors: overdue deadlines, target closing date proximity (&lt; 14 days), missing multi-page statement pages, and unfulfilled lender conditions. No unvalidated black-box AI claims.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded font-bold border border-red-500/30">
            Urgent: Closing risk
          </span>
          <span className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded font-bold border border-orange-500/30">
            High: Missing requirement
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search exceptions, loan #, or evidence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Dismissed">Dismissed</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
            >
              <option value="all">All Severities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Owner Filter */}
          <div>
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
            >
              <option value="all">All Owners</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Exception Radar List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredExceptions.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="font-bold text-sm text-slate-800">No exceptions match your filter</h3>
            <p className="text-xs text-slate-400 mt-1">All loan files are currently clear of matching exceptions.</p>
          </div>
        ) : (
          filteredExceptions.map((exc) => (
            <div key={exc.id} className="p-5 hover:bg-slate-50/70 transition space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/loans/${exc.loanId}`}
                      className="font-mono font-bold text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                    >
                      {exc.loanNumber}
                    </Link>
                    <span className="font-bold text-xs text-slate-800">{exc.borrowerDisplayName}</span>
                    <SeverityBadge severity={exc.severity} isAiSuggested={exc.isAiSuggested} />
                    <ExceptionStatusBadge status={exc.status} />
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      • {exc.category}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900">{exc.issue}</h3>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
                    <strong className="text-slate-900 block font-semibold mb-0.5">Defect Evidence:</strong>
                    {exc.evidence}
                  </div>

                  <div className="text-[11px] text-slate-500">
                    <strong>Impact Reason:</strong> {exc.severityReason}
                  </div>
                </div>

                {/* Actions & Responsible Party */}
                <div className="shrink-0 flex flex-col items-end gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAssigningException(exc)}
                      className="px-2.5 py-1 text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded font-medium"
                    >
                      Assign
                    </button>

                    {exc.status !== 'Resolved' && exc.status !== 'Dismissed' && (
                      <>
                        <button
                          onClick={() => setResolvingException(exc)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold shadow-xs"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => handleDismissException(exc)}
                          className="px-2.5 py-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                          title="Dismiss exception"
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                  </div>

                  <Link
                    href={`/loans/${exc.loanId}`}
                    className="text-[11px] text-blue-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    Open Loan Workspace <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Bottom metadata strip */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50/80 p-2.5 rounded-lg border border-slate-200 text-slate-600">
                <div className="flex items-center gap-4 text-[11px]">
                  <span>
                    <strong>Owner:</strong> {exc.responsibleUserName || 'Unassigned'}
                  </span>
                  {exc.dueDate && (
                    <span>
                      <strong>Due Date:</strong> {formatDate(exc.dueDate)}
                    </span>
                  )}
                  {exc.resolutionReason && (
                    <span className="text-emerald-700 font-medium">
                      <strong>Resolution:</strong> {exc.resolutionReason}
                    </span>
                  )}
                </div>

                <div className="text-blue-700 font-semibold text-[11px]">
                  Recommended Next Action: {exc.recommendedAction}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Resolve Exception */}
      {resolvingException && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Resolve Exception & Record Justification</h3>
              <button onClick={() => setResolvingException(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div className="font-bold text-slate-900">{resolvingException.issue}</div>
              <div className="text-slate-500 text-[11px]">{resolvingException.evidence}</div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as any;
                try {
                  await fetch('/api/exceptions', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      workspaceId: workspace.id,
                      id: resolvingException.id,
                      status: 'Resolved',
                      resolutionReason: form.reason.value,
                      actorId: currentUser.id,
                      actorName: currentUser.name,
                      actorRole: currentUser.role,
                    }),
                  });
                  setResolvingException(null);
                  fetchExceptions();
                } catch {
                  alert('Failed to resolve exception');
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Resolution Reason / Verified Supporting Document *
                </label>
                <textarea
                  name="reason"
                  required
                  rows={3}
                  placeholder="State how the requirement defect was cleared (e.g. Received updated declaration page naming UWM ISAOA/ATIMA, verified coverage meets $540,000)."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResolvingException(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 shadow-xs"
                >
                  Confirm & Clear Exception
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Exception */}
      {assigningException && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Assign Exception Owner</h3>
              <button onClick={() => setAssigningException(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as any;
                const selectedUser = availableUsers.find((u) => u.id === form.userId.value);
                try {
                  await fetch('/api/exceptions', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      workspaceId: workspace.id,
                      id: assigningException.id,
                      status: 'Assigned',
                      responsibleUserId: form.userId.value,
                      responsibleUserName: selectedUser?.name,
                      actorId: currentUser.id,
                      actorName: currentUser.name,
                      actorRole: currentUser.role,
                    }),
                  });
                  setAssigningException(null);
                  fetchExceptions();
                } catch {
                  alert('Failed to assign exception');
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Team Member</label>
                <select name="userId" defaultValue={currentUser.id} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssigningException(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 shadow-xs"
                >
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
