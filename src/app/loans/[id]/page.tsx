'use client';

import React, { useEffect, useState, useCallback, use, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Loan,
  Condition,
  Document,
  Exception,
  Task,
  ActivityLog,
  ConditionSource,
  ConditionStatus,
  DocumentStatus,
  LoanStage,
} from '@/types';
import {
  StageBadge,
  ConditionStatusBadge,
  DocumentStatusBadge,
  SeverityBadge,
  ExceptionStatusBadge,
  TaskStatusBadge,
} from '@/components/ui/Badge';
import { formatCurrency, formatDate, formatDateTime, getDaysRemaining } from '@/lib/utils';
import {
  FolderKanban,
  CheckCircle2,
  AlertOctagon,
  FileText,
  CheckSquare,
  Activity,
  FileCheck,
  Upload,
  Plus,
  ShieldAlert,
  Calendar,
  Clock,
  Sparkles,
  Download,
  Eye,
  RefreshCw,
  Printer,
  ChevronRight,
  User,
  ArrowLeft,
  X,
} from 'lucide-react';

function LoanWorkspaceContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';

  const { workspace, currentUser, availableUsers } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [loanData, setLoanData] = useState<{
    loan: Loan;
    conditions: Condition[];
    documents: Document[];
    exceptions: Exception[];
    tasks: Task[];
    activityLogs: ActivityLog[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [showAddConditionModal, setShowAddConditionModal] = useState(false);
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showResolveConditionModal, setShowResolveConditionModal] = useState<Condition | null>(null);
  const [showReviewDocModal, setShowReviewDocModal] = useState<Document | null>(null);
  const [showResolveExceptionModal, setShowResolveExceptionModal] = useState<Exception | null>(null);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

  // Checking state
  const [runningCheck, setRunningCheck] = useState(false);
  const [checkReport, setCheckReport] = useState<any>(null);

  const fetchLoanData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/loans/${id}?workspaceId=${workspace.id}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to fetch loan');
      setLoanData(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, workspace.id]);

  useEffect(() => {
    fetchLoanData();
  }, [fetchLoanData]);

  // Handle stage change
  const handleUpdateStage = async (newStage: LoanStage) => {
    if (!loanData) return;
    try {
      const res = await fetch(`/api/loans/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: workspace.id,
          stage: newStage,
          actorId: currentUser.id,
          actorName: currentUser.name,
          actorRole: currentUser.role,
        }),
      });
      const data = await res.json();
      if (data.success) fetchLoanData();
    } catch {
      alert('Failed to update stage');
    }
  };

  // Run File Readiness Checker
  const handleRunReadinessCheck = async (syncExceptions = true) => {
    setRunningCheck(true);
    try {
      const res = await fetch('/api/readiness-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: workspace.id,
          loanId: id,
          syncExceptions,
          actorId: currentUser.id,
          actorName: currentUser.name,
          actorRole: currentUser.role,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCheckReport(json.data.report);
        fetchLoanData();
      }
    } catch (err) {
      alert('Error running readiness check');
    } finally {
      setRunningCheck(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-32" />
        <div className="h-28 bg-slate-200 rounded-xl" />
        <div className="h-96 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (error || !loanData) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-xl text-red-800 space-y-3">
        <h3 className="font-bold text-base flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" /> Unable to open loan workspace
        </h3>
        <p className="text-xs">{error || 'Loan record not found or belongs to another brokerage.'}</p>
        <Link href="/loans" className="inline-block px-3 py-1.5 bg-red-600 text-white rounded text-xs font-semibold">
          Return to Loans Pipeline
        </Link>
      </div>
    );
  }

  const { loan, conditions, documents, exceptions, tasks, activityLogs } = loanData;
  const daysLeft = getDaysRemaining(loan.targetClosingDate);
  const openExceptions = exceptions.filter((e) => e.status !== 'Resolved' && e.status !== 'Dismissed');
  const resolvedConditions = conditions.filter((c) => c.status === 'Resolved');

  return (
    <div className="space-y-6">
      {/* Back button & top crumbs */}
      <div className="flex items-center justify-between">
        <Link
          href="/loans"
          className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Loans Pipeline
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleRunReadinessCheck(true)}
            disabled={runningCheck}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {runningCheck ? 'Checking File...' : 'Run Readiness Check'}
          </button>
          <button
            onClick={fetchLoanData}
            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200"
            title="Refresh loan workspace"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Loan Workspace Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono font-bold text-base text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                {loan.loanNumber}
              </span>
              <h1 className="font-bold text-lg text-slate-900">{loan.borrowerDisplayName}</h1>
              <StageBadge stage={loan.stage} />
              {loan.hasBlockingExceptions && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
                  <ShieldAlert className="w-3 h-3 mr-1" /> Blocker Detected
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">{loan.propertyAddress}</p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-4 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Loan Amount</span>
              <span className="font-bold text-slate-900 text-sm">{formatCurrency(loan.loanAmount)}</span>
            </div>
            <div className="border-l border-slate-200 pl-4">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Target Closing</span>
              <span className="font-semibold text-slate-800">
                {formatDate(loan.targetClosingDate)} ({daysLeft !== null ? `${daysLeft} days` : '—'})
              </span>
            </div>
            <div className="border-l border-slate-200 pl-4">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Lender</span>
              <span className="font-semibold text-slate-800 truncate max-w-[140px] block">{loan.lenderName}</span>
            </div>
            <div className="border-l border-slate-200 pl-4">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Readiness</span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-sm">{loan.readinessScore}%</span>
                <span className="text-[10px] text-slate-500">
                  ({resolvedConditions.length}/{conditions.length} cleared)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stage Selector Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Update Workflow Stage:</span>
            {(['Setup', 'In Progress', 'Blocked', 'Ready for Broker Review', 'Archived'] as LoanStage[]).map((st) => (
              <button
                key={st}
                onClick={() => handleUpdateStage(st)}
                disabled={loan.stage === st}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                  loan.stage === st
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="text-slate-500 text-[11px]">
            Officer: <strong className="text-slate-800">{loan.loanOfficerName || 'Unassigned'}</strong> • Processor: <strong className="text-slate-800">{loan.processorName || 'Unassigned'}</strong>
          </div>
        </div>
      </div>

      {/* Workspace Tabs Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto text-xs font-medium">
          {[
            { id: 'overview', label: 'Overview', icon: FolderKanban },
            { id: 'conditions', label: `Conditions (${conditions.length})`, icon: FileCheck },
            { id: 'documents', label: `Documents (${documents.length})`, icon: FileText },
            { id: 'exceptions', label: `Exceptions (${openExceptions.length})`, icon: AlertOctagon, alert: openExceptions.length > 0 },
            { id: 'tasks', label: `Tasks (${tasks.length})`, icon: CheckSquare },
            { id: 'activity', label: 'Activity Timeline', icon: Activity },
            { id: 'readiness', label: 'Readiness Summary', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-2 border-b-2 font-semibold flex items-center gap-1.5 whitespace-nowrap transition ${
                  active
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${tab.alert ? 'text-red-600' : ''}`} />
                <span>{tab.label}</span>
                {tab.alert && (
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Blocker alert box if any */}
            {openExceptions.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-red-800 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <span>{openExceptions.length} Unresolved Exception(s) Require Attention</span>
                </div>
                <div className="divide-y divide-red-200/60">
                  {openExceptions.slice(0, 3).map((exc) => (
                    <div key={exc.id} className="py-2 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-red-900">{exc.issue}</span>
                        <div className="text-[11px] text-red-700">{exc.recommendedAction}</div>
                      </div>
                      <button
                        onClick={() => setActiveTab('exceptions')}
                        className="px-2 py-1 bg-red-600 text-white rounded font-medium text-[10px]"
                      >
                        Inspect
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loan Program & Terms Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <h3 className="font-bold text-sm text-slate-900 mb-4">Loan Terms & Program Specifics</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Program</span>
                  <span className="font-semibold text-slate-800">{loan.loanProgram}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Property Type</span>
                  <span className="font-semibold text-slate-800">{loan.propertyType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Wholesale Lender</span>
                  <span className="font-semibold text-slate-800">{loan.lenderName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Target Closing</span>
                  <span className="font-semibold text-slate-800">{formatDate(loan.targetClosingDate)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Lead Loan Officer</span>
                  <span className="font-semibold text-slate-800">{loan.loanOfficerName || 'None'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Senior Processor</span>
                  <span className="font-semibold text-slate-800">{loan.processorName || 'None'}</span>
                </div>
              </div>
            </div>

            {/* Recent Conditions Preview */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-slate-900">Lender Requirements Checklist</h3>
                <button onClick={() => setActiveTab('conditions')} className="text-xs font-semibold text-blue-600 hover:underline">
                  View all ({conditions.length})
                </button>
              </div>

              <div className="space-y-2">
                {conditions.map((c) => (
                  <div key={c.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-900">{c.title}</div>
                      <div className="text-[11px] text-slate-500">Source: {c.source} • Due: {formatDate(c.dueDate)}</div>
                    </div>
                    <ConditionStatusBadge status={c.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Col: Readiness & Action Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900">File Readiness Status</h3>
              <div className="text-center py-2">
                <div className="text-3xl font-extrabold text-slate-900">{loan.readinessScore}%</div>
                <div className="text-xs text-slate-500 mt-1">Calculated Internal Readiness Score</div>
              </div>

              <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Conditions</span>
                  <span className="font-bold text-slate-800">{conditions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Resolved Conditions</span>
                  <span className="font-bold text-emerald-600">{resolvedConditions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Unresolved Conditions</span>
                  <span className="font-bold text-amber-600">{conditions.length - resolvedConditions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Uploaded Documents</span>
                  <span className="font-bold text-slate-800">{documents.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Open Exceptions</span>
                  <span className="font-bold text-red-600">{openExceptions.length}</span>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('readiness')}
                className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
              >
                Inspect Readiness Summary
              </button>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Workspace Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setShowAddConditionModal(true)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 transition"
                >
                  <span className="flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-blue-600" /> Add Lender Condition
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => setShowUploadDocModal(true)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 transition"
                >
                  <span className="flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-emerald-600" /> Upload File Document
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => setShowAddTaskModal(true)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 transition"
                >
                  <span className="flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-purple-600" /> Create Next Action Task
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Conditions */}
      {activeTab === 'conditions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Lender & Broker Conditions</h3>
              <p className="text-xs text-slate-500">
                Track all requirements needed for Clear to Close. A document upload never automatically marks a condition resolved.
              </p>
            </div>
            <button
              onClick={() => setShowAddConditionModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Requirement
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100">
            {conditions.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <FileCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-medium text-slate-700">No conditions recorded on this file.</p>
                <button
                  onClick={() => setShowAddConditionModal(true)}
                  className="mt-3 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg"
                >
                  Add Initial Condition
                </button>
              </div>
            ) : (
              conditions.map((cond) => {
                const linkedDocs = documents.filter((d) => cond.linkedDocumentIds?.includes(d.id));
                return (
                  <div key={cond.id} className="p-4 sm:p-5 hover:bg-slate-50/60 transition space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900">{cond.title}</h4>
                          <ConditionStatusBadge status={cond.status} />
                        </div>
                        <p className="text-xs text-slate-600">{cond.description}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {cond.status !== 'Resolved' ? (
                          <button
                            onClick={() => setShowResolveConditionModal(cond)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
                          >
                            Mark Resolved
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Cleared
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metadata & Linked Docs */}
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div className="flex flex-wrap items-center gap-4 text-slate-600 text-[11px]">
                        <span>
                          <strong>Source:</strong> {cond.source}
                        </span>
                        <span>
                          <strong>Due:</strong> {formatDate(cond.dueDate)}
                        </span>
                        <span>
                          <strong>Owner:</strong> {cond.ownerName || 'Unassigned'}
                        </span>
                        {cond.resolutionNotes && (
                          <span className="text-emerald-700">
                            <strong>Resolution:</strong> {cond.resolutionNotes}
                          </span>
                        )}
                      </div>

                      {/* Linked docs badge */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-medium">Supporting Files:</span>
                        {linkedDocs.length === 0 ? (
                          <span className="text-[11px] text-red-600 font-semibold flex items-center gap-0.5">
                            <AlertOctagon className="w-3 h-3" /> 0 files attached
                          </span>
                        ) : (
                          linkedDocs.map((d) => (
                            <span
                              key={d.id}
                              className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-mono text-blue-700 font-medium"
                            >
                              {d.originalName}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Documents */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Private Document Inventory</h3>
              <p className="text-xs text-slate-500">
                Uploaded loan files with metadata, malware validation status, and processor review decisions.
              </p>
            </div>
            <button
              onClick={() => setShowUploadDocModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition"
            >
              <Upload className="w-3.5 h-3.5" /> Upload Document
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {documents.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-medium text-slate-700">No documents uploaded for this loan yet.</p>
                <button
                  onClick={() => setShowUploadDocModal(true)}
                  className="mt-3 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg"
                >
                  Upload First Document
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Document File</th>
                      <th className="py-3 px-4">Document Type</th>
                      <th className="py-3 px-4">Review Status</th>
                      <th className="py-3 px-4">Extracted Metadata</th>
                      <th className="py-3 px-4">Uploaded By</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 font-mono">{doc.originalName}</div>
                          <div className="text-[10px] text-slate-400">
                            {(doc.fileSize / 1024).toFixed(0)} KB • Version {doc.version}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800">{doc.docType}</span>
                        </td>

                        <td className="py-3 px-4">
                          <DocumentStatusBadge status={doc.status} />
                          {doc.reviewerNotes && (
                            <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-xs">{doc.reviewerNotes}</div>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {doc.extractedMetadata ? (
                            <div className="text-[11px] space-y-0.5">
                              {doc.extractedMetadata.documentDate && (
                                <div className="text-slate-700">
                                  Date: <strong>{doc.extractedMetadata.documentDate}</strong>
                                </div>
                              )}
                              {doc.extractedMetadata.pageCount && (
                                <div className="text-slate-500">Pages: {doc.extractedMetadata.pageCount}</div>
                              )}
                              {doc.extractedMetadata.missingFields && doc.extractedMetadata.missingFields.length > 0 && (
                                <div className="text-red-600 font-medium text-[10px]">
                                  Issue: {doc.extractedMetadata.missingFields[0]}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="text-slate-800 font-medium">{doc.uploadedByName}</div>
                          <div className="text-[10px] text-slate-400">{formatDate(doc.uploadedAt)}</div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setPreviewDoc(doc)}
                              className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition"
                              title="Preview document metadata & content"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setShowReviewDocModal(doc)}
                              className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded transition"
                            >
                              Review
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Exceptions */}
      {activeTab === 'exceptions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Loan Exceptions & Compliance Flags</h3>
              <p className="text-xs text-slate-500">
                Potential and confirmed defects blocking file progression. Resolving requires recorded justification.
              </p>
            </div>
            <button
              onClick={() => handleRunReadinessCheck(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
            >
              <Sparkles className="w-3.5 h-3.5" /> Re-scan Loan
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100">
            {exceptions.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-700">Clean file! No active exceptions on this loan.</p>
              </div>
            ) : (
              exceptions.map((exc) => (
                <div key={exc.id} className="p-4 sm:p-5 hover:bg-slate-50/60 transition space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <SeverityBadge severity={exc.severity} isAiSuggested={exc.isAiSuggested} />
                        <ExceptionStatusBadge status={exc.status} />
                        <span className="text-[11px] text-slate-400">• Category: {exc.category}</span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">{exc.issue}</h4>
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <strong className="text-slate-800">Evidence:</strong> {exc.evidence}
                      </p>
                      <div className="text-xs text-slate-500 pt-1">
                        <strong>Reason:</strong> {exc.severityReason}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {exc.status !== 'Resolved' && exc.status !== 'Dismissed' && (
                        <button
                          onClick={() => setShowResolveExceptionModal(exc)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
                        >
                          Resolve Issue
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-600">
                    <div className="flex items-center gap-3 text-[11px]">
                      <span>
                        <strong>Responsible:</strong> {exc.responsibleUserName || 'Unassigned'}
                      </span>
                      {exc.dueDate && (
                        <span>
                          <strong>Due:</strong> {formatDate(exc.dueDate)}
                        </span>
                      )}
                    </div>
                    <div className="text-blue-700 font-semibold text-[11px]">
                      Next Step: {exc.recommendedAction}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Tasks */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Assigned File Tasks</h3>
              <p className="text-xs text-slate-500">Track and assign specific processor and loan officer follow-ups.</p>
            </div>
            <button
              onClick={() => setShowAddTaskModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Task
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100">
            {tasks.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <CheckSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-medium text-slate-700">No tasks assigned to this loan file.</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <TaskStatusBadge status={task.status} />
                      <h4 className="font-bold text-xs text-slate-900">{task.title}</h4>
                    </div>
                    {task.description && <p className="text-xs text-slate-500">{task.description}</p>}
                    <div className="text-[11px] text-slate-400 flex items-center gap-3">
                      <span>Assignee: {task.assigneeName || 'Unassigned'}</span>
                      <span>•</span>
                      <span>Due: {formatDate(task.dueDate)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {task.status !== 'Completed' ? (
                      <button
                        onClick={async () => {
                          await fetch('/api/tasks', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              workspaceId: workspace.id,
                              id: task.id,
                              status: 'Completed',
                              actorId: currentUser.id,
                              actorName: currentUser.name,
                              actorRole: currentUser.role,
                            }),
                          });
                          fetchLoanData();
                        }}
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded text-xs font-semibold transition"
                      >
                        Complete
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Done
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 6: Activity */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" /> Loan File Audit Timeline
          </h3>
          <p className="text-xs text-slate-500">
            Chronological audit trail of all status updates, document uploads, review decisions, and condition clearance events.
          </p>

          <div className="relative pl-6 space-y-4 border-l-2 border-slate-200 ml-2 pt-2">
            {activityLogs.length === 0 ? (
              <p className="text-xs text-slate-400">No recorded audit events.</p>
            ) : (
              activityLogs.map((log) => (
                <div key={log.id} className="relative">
                  <div className="absolute -left-[31px] top-0.5 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-white" />
                  <div className="text-xs font-bold text-slate-900">{log.action.replace('_', ' ')}</div>
                  <div className="text-xs text-slate-700 mt-0.5">{log.details}</div>
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                    <span className="font-semibold text-slate-600">{log.actorName}</span>
                    <span>•</span>
                    <span>{log.actorRole}</span>
                    <span>•</span>
                    <span>{formatDateTime(log.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 7: Readiness Summary */}
      {activeTab === 'readiness' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Internal Readiness Certification
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-1">Loan File Readiness Summary</h2>
                <p className="text-xs text-slate-500">
                  Calculated against lender conditions, uploaded evidence, and verified processor review checkpoints.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Summary
                </button>
                <button
                  onClick={() => handleRunReadinessCheck(true)}
                  disabled={runningCheck}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${runningCheck ? 'animate-spin' : ''}`} /> Run Check
                </button>
              </div>
            </div>

            {/* Score Banner */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <span>Score: {loan.readinessScore}/100</span>
                  {loan.readinessScore >= 95 ? (
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold border border-emerald-300">
                      Clear for Broker Sign-Off
                    </span>
                  ) : (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold border border-amber-300">
                      Unresolved Conditions Pending
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Internal readiness metrics measure file completeness prior to underwriter or lender transmission.
                </p>
              </div>

              <div className="text-right">
                <div className="text-xs font-semibold text-slate-700">Brokerage Workspace</div>
                <div className="text-xs text-slate-500">{workspace.name} (NMLS #{workspace.nmlsId})</div>
              </div>
            </div>

            {/* Summary Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Resolved Items */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-2">
                <h4 className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Resolved Conditions ({resolvedConditions.length})
                </h4>
                {resolvedConditions.length === 0 ? (
                  <p className="text-xs text-slate-400">No conditions marked resolved yet.</p>
                ) : (
                  <ul className="text-xs space-y-1.5">
                    {resolvedConditions.map((c) => (
                      <li key={c.id} className="text-emerald-800 flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <div>
                          <span className="font-medium">{c.title}</span>
                          {c.resolutionNotes && (
                            <div className="text-[10px] text-emerald-600">{c.resolutionNotes}</div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Unresolved Blockers */}
              <div className="p-4 rounded-xl border border-red-200 bg-red-50/30 space-y-2">
                <h4 className="font-bold text-xs text-red-900 flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-red-600" /> Outstanding Blockers & Incomplete Conditions ({conditions.length - resolvedConditions.length})
                </h4>
                {conditions.filter((c) => c.status !== 'Resolved').length === 0 ? (
                  <p className="text-xs text-slate-400">All conditions satisfied!</p>
                ) : (
                  <ul className="text-xs space-y-1.5">
                    {conditions
                      .filter((c) => c.status !== 'Resolved')
                      .map((c) => (
                        <li key={c.id} className="text-red-800 flex items-start gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                          <div>
                            <span className="font-medium">{c.title}</span>
                            <span className="text-[10px] text-red-600 block">Status: {c.status} • Due: {formatDate(c.dueDate)}</span>
                          </div>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Mandatory Regulatory / Broker Disclaimer */}
            <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
              <strong className="text-slate-900 block font-semibold mb-1">Notice & Disclaimer:</strong>
              This Readiness Summary is generated exclusively for internal mortgage brokerage workflow and processor checklist tracking. MortgageLevels does not underwrite loan files, guarantee loan approval, or certify regulatory compliance. Final lending and funding decisions remain under the sole jurisdiction of the wholesale lender.
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {/* 1. Add Condition Modal */}
      {showAddConditionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Add Lender Requirement Condition</h3>
              <button onClick={() => setShowAddConditionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as any;
                try {
                  await fetch('/api/conditions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      workspaceId: workspace.id,
                      loanId: id,
                      title: form.title.value,
                      description: form.description.value,
                      source: form.source.value,
                      dueDate: form.dueDate.value,
                      ownerId: form.ownerId.value,
                      ownerName: availableUsers.find((u) => u.id === form.ownerId.value)?.name,
                      actorId: currentUser.id,
                      actorName: currentUser.name,
                      actorRole: currentUser.role,
                    }),
                  });
                  setShowAddConditionModal(false);
                  fetchLoanData();
                } catch {
                  alert('Failed to add condition');
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Requirement Title *</label>
                <input
                  name="title"
                  required
                  placeholder="e.g. 2 Months Bank Statements"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description & Verification Details</label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Provide all pages verifying earnest money deposit source..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Condition Source</label>
                  <select name="source" className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                    <option value="Lender Initial">Lender Initial</option>
                    <option value="Underwriting Prior to Doc">Underwriting Prior to Doc</option>
                    <option value="Closing Prior to Funding">Closing Prior to Funding</option>
                    <option value="Internal Broker">Internal Broker</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Due Date *</label>
                  <input
                    name="dueDate"
                    type="date"
                    required
                    defaultValue={loan.targetClosingDate}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Owner</label>
                <select name="ownerId" defaultValue={currentUser.id} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
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
                  onClick={() => setShowAddConditionModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 shadow-xs"
                >
                  Save Condition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Upload Document Modal */}
      {showUploadDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Upload Loan File Document</h3>
              <button onClick={() => setShowUploadDocModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as any;
                try {
                  await fetch('/api/documents', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      workspaceId: workspace.id,
                      loanId: id,
                      filename: form.filename.value,
                      originalName: form.filename.value,
                      docType: form.docType.value,
                      conditionId: form.conditionId.value || undefined,
                      fileSize: 1024 * 780,
                      mimeType: 'application/pdf',
                      actorId: currentUser.id,
                      actorName: currentUser.name,
                      actorRole: currentUser.role,
                    }),
                  });
                  setShowUploadDocModal(false);
                  fetchLoanData();
                } catch {
                  alert('Failed to upload document');
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document File Name *</label>
                <input
                  name="filename"
                  required
                  placeholder="e.g. 2025_W2_Davis_Robert.pdf"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Document Type *</label>
                  <select name="docType" className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                    <option value="W2 Wage Statement">W2 Wage Statement</option>
                    <option value="Paystub">Paystub</option>
                    <option value="Bank Statement">Bank Statement</option>
                    <option value="Tax Return (1040/1120S)">Tax Return (1040/1120S)</option>
                    <option value="Homeowners Insurance Binder">Homeowners Insurance Binder</option>
                    <option value="Appraisal Report">Appraisal Report</option>
                    <option value="Preliminary Title Report">Preliminary Title Report</option>
                    <option value="Other / Misc">Other / Misc</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Link to Condition (Optional)</label>
                  <select name="conditionId" className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                    <option value="">None / General File</option>
                    {conditions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-[11px]">
                <p>
                  <strong>Private Storage:</strong> File uploaded to private workspace storage with simulated malware scan. Note: Document upload does not automatically resolve conditions without processor verification.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadDocModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 shadow-xs"
                >
                  Upload & Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Resolve Condition Modal (Human review step enforced) */}
      {showResolveConditionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Resolve Requirement Condition</h3>
              <button onClick={() => setShowResolveConditionModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Condition: <strong className="text-slate-900">{showResolveConditionModal.title}</strong>
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as any;
                try {
                  await fetch('/api/conditions', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      workspaceId: workspace.id,
                      id: showResolveConditionModal.id,
                      status: 'Resolved',
                      resolutionNotes: form.notes.value,
                      actorId: currentUser.id,
                      actorName: currentUser.name,
                      actorRole: currentUser.role,
                    }),
                  });
                  setShowResolveConditionModal(null);
                  fetchLoanData();
                } catch {
                  alert('Failed to resolve condition');
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Human Verification / Review Sign-Off Notes *</label>
                <textarea
                  name="notes"
                  required
                  rows={3}
                  placeholder="e.g. Verified statement reflects required balance, all 6 pages present, verified source of earnest funds."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowResolveConditionModal(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 shadow-xs"
                >
                  Confirm & Resolve Condition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Review Document Decision Modal */}
      {showReviewDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Processor Document Review</h3>
              <button onClick={() => setShowReviewDocModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              File: <strong className="text-slate-900 font-mono">{showReviewDocModal.originalName}</strong>
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as any;
                try {
                  await fetch('/api/documents', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      workspaceId: workspace.id,
                      id: showReviewDocModal.id,
                      status: form.status.value,
                      reviewerNotes: form.reviewerNotes.value,
                      actorId: currentUser.id,
                      actorName: currentUser.name,
                      actorRole: currentUser.role,
                    }),
                  });
                  setShowReviewDocModal(null);
                  fetchLoanData();
                } catch {
                  alert('Failed to update document status');
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Review Decision *</label>
                <select name="status" defaultValue="Accepted for Requirement" className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                  <option value="Accepted for Requirement">Accepted for Requirement</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Review Required">Needs Further Review</option>
                  <option value="Superseded">Superseded by Newer Version</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reviewer Notes</label>
                <textarea
                  name="reviewerNotes"
                  rows={2}
                  placeholder="e.g. Cross-verified with tax schedule, satisfactory."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReviewDocModal(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 shadow-xs"
                >
                  Save Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Resolve Exception Modal */}
      {showResolveExceptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Resolve Exception / Clear Blocker</h3>
              <button onClick={() => setShowResolveExceptionModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div className="font-bold text-slate-900">{showResolveExceptionModal.issue}</div>
              <div className="text-slate-500 text-[11px]">{showResolveExceptionModal.evidence}</div>
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
                      id: showResolveExceptionModal.id,
                      status: 'Resolved',
                      resolutionReason: form.resolutionReason.value,
                      actorId: currentUser.id,
                      actorName: currentUser.name,
                      actorRole: currentUser.role,
                    }),
                  });
                  setShowResolveExceptionModal(null);
                  fetchLoanData();
                } catch {
                  alert('Failed to resolve exception');
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Resolution Reason & Evidence Reference *
                </label>
                <textarea
                  name="resolutionReason"
                  required
                  rows={3}
                  placeholder="Explain why this exception is resolved (e.g. Borrower uploaded full page 6; verified with bank)."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowResolveExceptionModal(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 shadow-xs"
                >
                  Confirm Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900 font-mono">{previewDoc.originalName}</h3>
                <p className="text-xs text-slate-500">Secure Document Inspector & Integrity Summary</p>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Document Type</span>
                <span className="font-bold text-slate-900">{previewDoc.docType}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Status</span>
                <DocumentStatusBadge status={previewDoc.status} />
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">File Size</span>
                <span className="font-semibold text-slate-800">{(previewDoc.fileSize / 1024).toFixed(0)} KB</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">MIME Type</span>
                <span className="font-semibold text-slate-800">{previewDoc.mimeType}</span>
              </div>
            </div>

            {/* Simulated PDF Preview Pane */}
            <div className="h-48 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center p-4 bg-slate-50">
              <FileText className="w-10 h-10 text-blue-600 mb-2" />
              <div className="text-xs font-bold text-slate-800">{previewDoc.filename}</div>
              <div className="text-[11px] text-slate-500 mt-1">
                Encrypted Private Storage Path: <code className="text-[10px] bg-slate-200 px-1 py-0.5 rounded">{previewDoc.storagePath}</code>
              </div>
            </div>

            {previewDoc.extractedMetadata && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs space-y-1">
                <span className="font-bold text-blue-900 block">Extracted Content & Integrity Check:</span>
                <div className="text-blue-800 text-[11px] space-y-0.5">
                  <div>Statement/Document Date: {previewDoc.extractedMetadata.documentDate || 'Not detected'}</div>
                  <div>Page Count: {previewDoc.extractedMetadata.pageCount || 1}</div>
                  <div>Borrower Match: {previewDoc.extractedMetadata.borrowerName || 'Verified'}</div>
                  {previewDoc.extractedMetadata.confidenceScore && (
                    <div>Extraction Confidence: {(previewDoc.extractedMetadata.confidenceScore * 100).toFixed(0)}%</div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Create Workflow Task</h3>
              <button onClick={() => setShowAddTaskModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as any;
                try {
                  await fetch('/api/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      workspaceId: workspace.id,
                      loanId: id,
                      title: form.title.value,
                      description: form.description.value,
                      dueDate: form.dueDate.value,
                      priority: form.priority.value,
                      assigneeId: form.assigneeId.value,
                      assigneeName: availableUsers.find((u) => u.id === form.assigneeId.value)?.name,
                      actorId: currentUser.id,
                      actorName: currentUser.name,
                      actorRole: currentUser.role,
                    }),
                  });
                  setShowAddTaskModal(false);
                  fetchLoanData();
                } catch {
                  alert('Failed to create task');
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Task Title *</label>
                <input
                  name="title"
                  required
                  placeholder="e.g. Call borrower to get missing page 6"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Specific follow-up details..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Due Date *</label>
                  <input
                    name="dueDate"
                    type="date"
                    required
                    defaultValue={loan.targetClosingDate}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select name="priority" className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Normal">Normal</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assignee</label>
                <select name="assigneeId" defaultValue={currentUser.id} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
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
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 shadow-xs"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoanWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading loan workspace...</div>}>
      <LoanWorkspaceContent params={params} />
    </Suspense>
  );
}
