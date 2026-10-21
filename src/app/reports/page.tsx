'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  BarChart3,
  CheckCircle2,
  AlertOctagon,
  Clock,
  FileCheck,
  TrendingUp,
  Download,
  Printer,
  ShieldCheck,
  RefreshCw,
  Users,
  Lock,
} from 'lucide-react';

export default function ReportsPage() {
  const { workspace, currentUser } = useAuth();
  const isAdmin = currentUser.role === 'ADMIN';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports?workspaceId=${workspace.id}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to fetch reports');
      setData(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [workspace.id]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center max-w-lg mx-auto mt-12 space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Brokerage Reports Restricted</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Macro SLA reports, defect rates, and operational brokerage analytics are accessible to Brokerage Administrators.
        </p>
        <Link
          href="/"
          className="inline-flex px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
        >
          Return to My Working Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Operational Readiness & Exception Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Defect rate metrics, queue aging, and team productivity calculated strictly from persistent brokerage data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" /> Print Report
          </button>
          <button
            onClick={fetchReports}
            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200 bg-white"
            title="Refresh analytics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Task Completion */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1 text-xs font-semibold">
            <span>Task Completion Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{data?.taskCompletionRate || 0}%</div>
          <p className="text-[11px] text-slate-400 mt-1">Completed vs assigned tasks</p>
        </div>

        {/* Avg Review Queue Age */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1 text-xs font-semibold">
            <span>Avg Review Queue Age</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{data?.avgReviewQueueAgeDays || 0} Days</div>
          <p className="text-[11px] text-slate-400 mt-1">Time elapsed since doc upload</p>
        </div>

        {/* Document Flagged Rate */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1 text-xs font-semibold">
            <span>Document Issue Rate</span>
            <AlertOctagon className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{data?.documentIssueRate || 0}%</div>
          <p className="text-[11px] text-slate-400 mt-1">Files flagged or missing pages</p>
        </div>

        {/* Condition Clearance */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1 text-xs font-semibold">
            <span>Condition Clearance</span>
            <FileCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{data?.conditionClearanceRate || 0}%</div>
          <p className="text-[11px] text-slate-400 mt-1">Satisfied lender conditions</p>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exceptions by Severity */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-red-600" /> Open Exceptions by Severity
          </h3>
          <p className="text-xs text-slate-500">
            Categorization based on explicit risk rules: closing date proximity and required verification.
          </p>

          <div className="space-y-3 pt-2">
            {Object.entries(data?.severityBreakdown || {}).map(([sev, count]: [string, any]) => (
              <div key={sev} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>{sev}</span>
                  <span>{count} exception(s)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      sev === 'Urgent'
                        ? 'bg-red-500'
                        : sev === 'High'
                        ? 'bg-orange-500'
                        : sev === 'Normal'
                        ? 'bg-blue-500'
                        : 'bg-slate-400'
                    }`}
                    style={{ width: `${Math.min(100, count * 25)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Exceptions by Category */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" /> Open Exceptions by Category
          </h3>
          <p className="text-xs text-slate-500">
            Distribution of identified defects across loan documentation and lender requirements.
          </p>

          <div className="space-y-2.5 pt-2">
            {Object.entries(data?.categoryBreakdown || {}).length === 0 ? (
              <p className="text-xs text-slate-400">No open exceptions.</p>
            ) : (
              Object.entries(data?.categoryBreakdown || {}).map(([cat, count]: [string, any]) => (
                <div key={cat} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50 text-xs">
                  <span className="font-semibold text-slate-800">{cat}</span>
                  <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-[11px]">
                    {count}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Team Productivity & Workload Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-600" /> Team Workload & Distribution
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-4">Team Member</th>
                <th className="py-2.5 px-4">Role</th>
                <th className="py-2.5 px-4">Active Loan Files</th>
                <th className="py-2.5 px-4">Pending Tasks</th>
                <th className="py-2.5 px-4">Assigned Exceptions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.teamWorkload?.map((member: any) => (
                <tr key={member.userId} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-4 font-bold text-slate-900">{member.name}</td>
                  <td className="py-2.5 px-4 text-slate-600">{member.role}</td>
                  <td className="py-2.5 px-4 font-semibold text-blue-600">{member.activeLoans}</td>
                  <td className="py-2.5 px-4 text-slate-700">{member.openTasks}</td>
                  <td className="py-2.5 px-4 font-semibold text-red-600">{member.pendingExceptions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notice on Metrics Integrity */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-800">Operational Integrity Note:</strong> All reported metrics reflect live database counts from active loan workspaces. MortgageLevels does not fabricate time-saved statistics, simulated accuracy ratings, or synthetic performance guarantees.
        </div>
      </div>
    </div>
  );
}
