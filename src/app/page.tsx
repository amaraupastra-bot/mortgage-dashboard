'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { SeverityBadge, StageBadge } from '@/components/ui/Badge';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  FolderKanban,
  AlertOctagon,
  FileClock,
  ClockAlert,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  User,
  Activity,
  Sparkles,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Building2,
  Check,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { workspace, currentUser } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isLoanOfficer = currentUser.role === 'LOAN_OFFICER';
  const isAdmin = currentUser.role === 'ADMIN';

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/dashboard?workspaceId=${workspace.id}&userId=${currentUser.id}&userRole=${currentUser.role}`
      );
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch dashboard metrics');
      }
      setData(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [workspace.id, currentUser.id, currentUser.role]);

  useEffect(() => {
    fetchDashboardData();

    const handleLoanCreated = () => fetchDashboardData();
    window.addEventListener('loan-created', handleLoanCreated);
    return () => window.removeEventListener('loan-created', handleLoanCreated);
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-slate-200 rounded-xl"></div>
          <div className="h-72 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-800">
        <h3 className="font-bold text-base flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" /> Failed to load dashboard
        </h3>
        <p className="text-xs mt-1">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  const m = data?.metrics || {};

  return (
    <div className="space-y-6">
      {/* Page Title & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {isLoanOfficer
              ? 'Loan Officer Production Dashboard'
              : currentUser.role === 'PROCESSOR'
              ? 'Loan Processing Operations Dashboard'
              : 'Pipeline Readiness Dashboard'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isLoanOfficer
              ? `Personal origination metrics, borrower applications, and file status for ${currentUser.name}.`
              : 'Real-time mortgage file compliance, document exception tracking, and broker review queue.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Tenant Isolated: {workspace.name}
          </div>
        </div>
      </div>

      {/* Role-Specific Perspective Banner */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
            {isAdmin ? (
              <Building2 className="w-5 h-5 text-amber-300" />
            ) : isLoanOfficer ? (
              <User className="w-5 h-5 text-emerald-300" />
            ) : (
              <Activity className="w-5 h-5 text-purple-300" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm tracking-tight text-white">
                {isAdmin
                  ? `Brokerage Owner & Admin: ${currentUser.name}`
                  : isLoanOfficer
                  ? `Loan Officer Working Space: ${currentUser.name}`
                  : `Loan Processor Operations Hub: ${currentUser.name}`}
              </h2>
              <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded text-white uppercase tracking-wider">
                {currentUser.role}
              </span>
            </div>
            <p className="text-xs text-blue-200 mt-0.5">
              {isAdmin
                ? 'Full company oversight across all originators, team permissions, custom form controls, and enterprise settings.'
                : isLoanOfficer
                ? 'Showing only your assigned borrower files, Form 1003 applications, and personal file compliance items.'
                : 'Prioritizing document review inbox, lender underwriting condition sign-offs, and file clearance.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isLoanOfficer && (
            <Link
              href={`/loans?ownerId=${currentUser.id}`}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              My Assigned Files Only &rarr;
            </Link>
          )}
          {currentUser.role === 'PROCESSOR' && (
            <Link
              href="/documents?status=Review Required"
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              Document Review Inbox &rarr;
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/team"
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold rounded-lg transition"
            >
              Manage Team & Invites
            </Link>
          )}
        </div>
      </div>

      {/* Primary KPI Metrics (Filtered dynamically to user's assigned scope) */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Active Loans */}
        <Link
          href={isLoanOfficer ? `/loans?ownerId=${currentUser.id}` : '/loans'}
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">{isLoanOfficer ? 'My Active Loans' : 'Active Loans'}</span>
            <FolderKanban className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{m.activeLoansCount || 0}</div>
          <div className="text-[11px] text-blue-600 flex items-center gap-1 mt-1 font-medium">
            View pipeline <ChevronRight className="w-3 h-3" />
          </div>
        </Link>

        {/* Blocked Loans */}
        <Link
          href={isLoanOfficer ? `/loans?ownerId=${currentUser.id}&hasBlockers=true` : '/loans?hasBlockers=true'}
          className="p-4 bg-white rounded-xl border border-red-200 bg-red-50/20 hover:border-red-400 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between text-red-600 mb-2">
            <span className="text-xs font-medium">{isLoanOfficer ? 'My Blocked Files' : 'Blocked Files'}</span>
            <ShieldAlert className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-red-700">{m.blockedLoansCount || 0}</div>
          <div className="text-[11px] text-red-600 flex items-center gap-1 mt-1 font-medium">
            Confirmed blockers <ChevronRight className="w-3 h-3" />
          </div>
        </Link>

        {/* Ready for Broker Review */}
        <Link
          href={isLoanOfficer ? `/loans?ownerId=${currentUser.id}&stage=Ready for Broker Review` : '/loans?stage=Ready for Broker Review'}
          className="p-4 bg-white rounded-xl border border-emerald-200 bg-emerald-50/20 hover:border-emerald-400 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-medium">{isLoanOfficer ? 'My Ready Files' : 'Ready for Review'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-emerald-800">{m.readyForReviewCount || 0}</div>
          <div className="text-[11px] text-emerald-700 flex items-center gap-1 mt-1 font-medium">
            Pending sign-off <ChevronRight className="w-3 h-3" />
          </div>
        </Link>

        {/* Documents Awaiting Review */}
        <Link
          href="/documents?status=Review Required"
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-medium">Doc Review Queue</span>
            <FileClock className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{m.docsAwaitingReviewCount || 0}</div>
          <div className="text-[11px] text-amber-700 flex items-center gap-1 mt-1 font-medium">
            Doc inbox <ChevronRight className="w-3 h-3" />
          </div>
        </Link>

        {/* Overdue Tasks */}
        <Link
          href="/tasks?status=To Do"
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-orange-400 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">{isLoanOfficer ? 'My Tasks' : 'Overdue Tasks'}</span>
            <ClockAlert className="w-4 h-4 text-orange-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{m.overdueTasksCount || 0}</div>
          <div className="text-[11px] text-orange-600 flex items-center gap-1 mt-1 font-medium">
            Action required <ChevronRight className="w-3 h-3" />
          </div>
        </Link>

        {/* Open Exceptions */}
        <Link
          href="/exceptions"
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-purple-400 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">{isLoanOfficer ? 'My Exceptions' : 'Exception Radar'}</span>
            <AlertOctagon className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{m.openExceptionsCount || 0}</div>
          <div className="text-[11px] text-purple-600 flex items-center gap-1 mt-1 font-medium">
            Priority radar <ChevronRight className="w-3 h-3" />
          </div>
        </Link>
      </div>

      {/* Main Grid: Priority Exceptions & Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Priority Exception Radar */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                <AlertOctagon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  {isLoanOfficer ? 'My Priority Exceptions Radar' : 'Priority Exception Radar'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {isLoanOfficer
                    ? 'Urgent blockers on your assigned files requiring borrower action'
                    : 'Urgent blockers sorted by closing proximity and severity rules'}
                </p>
              </div>
            </div>
            <Link
              href="/exceptions"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              All Exceptions ({m.openExceptionsCount || 0}) <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {(!data?.priorityIssues || data.priorityIssues.length === 0) ? (
              <div className="p-12 text-center text-slate-400">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-800">
                  {isLoanOfficer
                    ? 'No blocking exceptions on your files'
                    : 'No urgent blocking exceptions in branch pipeline'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                  {isLoanOfficer
                    ? 'Your assigned loan pipeline is clean. Any new file anomalies or missing borrower documents will appear here automatically.'
                    : 'All borrower applications and conditions are progressing normally.'}
                </p>
              </div>
            ) : (
              data.priorityIssues.map((exc: any) => (
                <div key={exc.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/loans/${exc.loanId}`}
                          className="font-bold text-xs text-blue-600 hover:underline font-mono"
                        >
                          {exc.loanNumber}
                        </Link>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-semibold text-slate-800">{exc.borrowerDisplayName}</span>
                        <SeverityBadge severity={exc.severity} isAiSuggested={exc.isAiSuggested} />
                      </div>

                      <h4 className="text-xs font-semibold text-slate-900">{exc.issue}</h4>

                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                        <strong className="text-slate-800">Evidence:</strong> {exc.evidence}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                        <span>
                          <strong className="text-slate-700">Owner:</strong> {exc.responsibleUserName || 'Unassigned'}
                        </span>
                        {exc.dueDate && (
                          <span>
                            <strong className="text-slate-700">Target Date:</strong> {formatDate(exc.dueDate)}
                          </span>
                        )}
                        <span className="text-amber-700 font-medium">
                          Next: {exc.recommendedAction}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/loans/${exc.loanId}?tab=exceptions`}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition shrink-0"
                    >
                      Resolve
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col: Personal / Team Workload & Activity */}
        <div className="space-y-6">
          {/* Workload Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600" />
                {isLoanOfficer ? 'My Production Status' : 'Team Workload'}
              </h3>
              {isAdmin && (
                <Link href="/team" className="text-xs text-blue-600 font-semibold hover:underline">
                  Manage
                </Link>
              )}
            </div>

            <div className="space-y-3">
              {data?.teamWorkload?.map((member: any) => (
                <div key={member.userId} className="p-3 rounded-lg border border-slate-100 bg-slate-50/70">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{member.name}</div>
                      <div className="text-[10px] text-slate-500">{member.role}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-blue-600">{member.assignedLoans} Loans</div>
                      <div className="text-[10px] text-slate-500">
                        {member.assignedTasks} Tasks • {member.assignedExceptions} Issues
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chronological Audit Activity */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5 mb-3">
              <Activity className="w-4 h-4 text-emerald-600" />
              {isLoanOfficer ? 'My Pipeline Activity' : 'Recent Activity Log'}
            </h3>
            <div className="space-y-3">
              {(!data?.recentActivity || data.recentActivity.length === 0) ? (
                <p className="text-xs text-slate-400">No activity recorded on your files yet.</p>
              ) : (
                data.recentActivity.slice(0, 5).map((act: any) => (
                  <div key={act.id} className="text-xs border-l-2 border-blue-500 pl-3 py-0.5 space-y-0.5">
                    <p className="text-slate-800 font-medium leading-snug">{act.details}</p>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                      <span>{act.actorName}</span>
                      <span>•</span>
                      <span>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
