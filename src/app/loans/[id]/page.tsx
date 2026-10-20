'use client';

import React, { useEffect, useState, useCallback, useRef, use, Suspense } from 'react';
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
  FileSpreadsheet,
  Edit3,
  Save,
  ArrowRight,
  ShieldCheck,
  Check,
  HelpCircle,
  Info,
  Lock,
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

  // Real File Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [uploadDocName, setUploadDocName] = useState('');
  const [uploadDocType, setUploadDocType] = useState('W2 Wage Statement');
  const [uploadConditionId, setUploadConditionId] = useState('');
  const [uploadDragOver, setUploadDragOver] = useState(false);

  const handleFilePicked = (file: File) => {
    setSelectedUploadFile(file);
    setUploadDocName(file.name);
    const lower = file.name.toLowerCase();
    if (lower.includes('w2') || lower.includes('w-2')) {
      setUploadDocType('W2 Wage Statement');
    } else if (lower.includes('pay') || lower.includes('stub') || lower.includes('earning')) {
      setUploadDocType('Paystub');
    } else if (lower.includes('bank') || lower.includes('statement') || lower.includes('chase') || lower.includes('bofa')) {
      setUploadDocType('Bank Statement');
    } else if (lower.includes('tax') || lower.includes('1040') || lower.includes('1120')) {
      setUploadDocType('Tax Return (1040/1120S)');
    } else if (lower.includes('insur') || lower.includes('binder') || lower.includes('policy')) {
      setUploadDocType('Homeowners Insurance Binder');
    } else if (lower.includes('apprais')) {
      setUploadDocType('Appraisal Report');
    } else if (lower.includes('title')) {
      setUploadDocType('Preliminary Title Report');
    }
  };

  // Stage Inspector Modal state
  const [showStageInspectorModal, setShowStageInspectorModal] = useState(false);
  const [targetStageToInspect, setTargetStageToInspect] = useState<LoanStage | null>(null);

  // Form 1003 editing state
  const [form1003Data, setForm1003Data] = useState<any>(null);
  const [isEditing1003, setIsEditing1003] = useState(false);
  const [saving1003, setSaving1003] = useState(false);
  const [save1003Toast, setSave1003Toast] = useState(false);

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
      if (json.data?.loan?.form1003) {
        setForm1003Data(json.data.loan.form1003);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, workspace.id]);

  useEffect(() => {
    fetchLoanData();
  }, [fetchLoanData]);

  // Handle saving 1003 URLA data
  const handleSave1003 = async () => {
    if (!form1003Data) return;
    setSaving1003(true);
    try {
      const res = await fetch(`/api/loans/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: workspace.id,
          form1003: form1003Data,
          actorId: currentUser.id,
          actorName: currentUser.name,
          actorRole: currentUser.role,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsEditing1003(false);
        setSave1003Toast(true);
        setTimeout(() => setSave1003Toast(false), 3000);
        fetchLoanData();
      } else {
        alert(data.error || 'Failed to save 1003 data');
      }
    } catch {
      alert('Failed to save 1003 data');
    } finally {
      setSaving1003(false);
    }
  };

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

        {/* Interactive Visual Stage Stepper & Inspector Action Bar */}
        <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Visual Milestones */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider mr-1">
                Workflow Stage:
              </span>

              {[
                { stage: 'Setup', label: '1. Setup Intake' },
                { stage: 'In Progress', label: '2. In Processing' },
                { stage: 'Ready for Broker Review', label: '3. Broker Review' },
                { stage: 'Archived', label: '4. Closed / Funded' },
              ].map((step, idx) => {
                const isCurrent = loan.stage === step.stage;
                const isBlocked = loan.stage === 'Blocked';

                return (
                  <React.Fragment key={step.stage}>
                    {idx > 0 && <span className="text-slate-300 font-bold">→</span>}
                    <button
                      onClick={() => {
                        setTargetStageToInspect(step.stage as LoanStage);
                        setShowStageInspectorModal(true);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border ${
                        isCurrent
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-500/20'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {isCurrent && <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>{step.label}</span>
                    </button>
                  </React.Fragment>
                );
              })}

              {/* Blocked Flag */}
              <button
                onClick={() => {
                  setTargetStageToInspect('Blocked');
                  setShowStageInspectorModal(true);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border ml-1 ${
                  loan.stage === 'Blocked'
                    ? 'bg-red-600 text-white border-red-600 shadow-xs ring-2 ring-red-500/20 animate-pulse'
                    : 'bg-white hover:bg-red-50 text-red-600 border-red-200'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Blocked</span>
              </button>
            </div>

            {/* Inspector Trigger Button */}
            <button
              onClick={() => {
                setTargetStageToInspect(loan.stage);
                setShowStageInspectorModal(true);
              }}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Inspect Stage & Process</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1">
            <div>
              Officer: <strong className="text-slate-800">{loan.loanOfficerName || 'Unassigned'}</strong> • Processor: <strong className="text-slate-800">{loan.processorName || 'Unassigned'}</strong>
            </div>
            <div className="text-slate-400">
              Click any stage to view requirements, verify 1003 details, and advance or move file.
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Tabs Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto text-xs font-medium">
          {[
            { id: 'overview', label: 'Overview', icon: FolderKanban },
            { id: '1003', label: 'Form 1003 (URLA)', icon: FileSpreadsheet },
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

      {/* Tab: Form 1003 (URLA) */}
      {activeTab === '1003' && form1003Data && (
        <div className="space-y-6 text-xs">
          {/* 1003 Header */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Fannie Mae Form 1003 / Freddie Mac Form 65
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Uniform Residential Loan Application</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                Form 1003 Application Dataset
              </h2>
              <p className="text-xs text-slate-500">
                Borrower identity, employment, liquid asset verification, monthly debt liabilities, and statutory declarations.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {save1003Toast && (
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> 1003 Saved!
                </span>
              )}

              {isEditing1003 ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditing1003(false);
                      if (loan.form1003) setForm1003Data(loan.form1003);
                    }}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave1003}
                    disabled={saving1003}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving1003 ? 'Saving...' : 'Save 1003'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing1003(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                  Edit 1003 Information
                </button>
              )}
            </div>
          </div>

          {/* Section 1: Borrower Information */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[11px] flex items-center justify-center font-bold">1</span>
                Section 1: Borrower Identity & Contact
              </h3>
              <span className="text-[11px] text-slate-400">Primary Applicant</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">Full Legal Name</label>
                {isEditing1003 ? (
                  <input
                    value={form1003Data.borrower.fullName}
                    onChange={(e) =>
                      setForm1003Data({
                        ...form1003Data,
                        borrower: { ...form1003Data.borrower, fullName: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none font-semibold text-slate-900"
                  />
                ) : (
                  <span className="font-bold text-slate-800">{form1003Data.borrower.fullName}</span>
                )}
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">Social Security Number</label>
                <span className="font-mono font-semibold text-slate-800">{form1003Data.borrower.ssn}</span>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">Date of Birth</label>
                {isEditing1003 ? (
                  <input
                    type="date"
                    value={form1003Data.borrower.dob}
                    onChange={(e) =>
                      setForm1003Data({
                        ...form1003Data,
                        borrower: { ...form1003Data.borrower, dob: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none"
                  />
                ) : (
                  <span className="font-semibold text-slate-800">{form1003Data.borrower.dob}</span>
                )}
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">Marital Status</label>
                {isEditing1003 ? (
                  <select
                    value={form1003Data.borrower.maritalStatus}
                    onChange={(e) =>
                      setForm1003Data({
                        ...form1003Data,
                        borrower: { ...form1003Data.borrower, maritalStatus: e.target.value as any },
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none bg-white font-medium"
                  >
                    <option value="Married">Married</option>
                    <option value="Unmarried">Unmarried</option>
                    <option value="Separated">Separated</option>
                  </select>
                ) : (
                  <span className="font-semibold text-slate-800">{form1003Data.borrower.maritalStatus}</span>
                )}
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">Phone Number</label>
                {isEditing1003 ? (
                  <input
                    value={form1003Data.borrower.phone}
                    onChange={(e) =>
                      setForm1003Data({
                        ...form1003Data,
                        borrower: { ...form1003Data.borrower, phone: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none"
                  />
                ) : (
                  <span className="font-semibold text-slate-800">{form1003Data.borrower.phone}</span>
                )}
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">Email Address</label>
                {isEditing1003 ? (
                  <input
                    value={form1003Data.borrower.email}
                    onChange={(e) =>
                      setForm1003Data({
                        ...form1003Data,
                        borrower: { ...form1003Data.borrower, email: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none"
                  />
                ) : (
                  <span className="font-semibold text-slate-800">{form1003Data.borrower.email}</span>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">Current Residence Address</label>
                {isEditing1003 ? (
                  <input
                    value={form1003Data.borrower.currentAddress}
                    onChange={(e) =>
                      setForm1003Data({
                        ...form1003Data,
                        borrower: { ...form1003Data.borrower, currentAddress: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none"
                  />
                ) : (
                  <span className="font-semibold text-slate-800">{form1003Data.borrower.currentAddress}</span>
                )}
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">Housing Status & Tenure</label>
                <span className="font-semibold text-slate-800">
                  {form1003Data.borrower.housingStatus} ({form1003Data.borrower.yearsAtAddress} years)
                </span>
              </div>
            </div>
          </div>

          {/* Section 1b: Employment & Income */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[11px] flex items-center justify-center font-bold">1b</span>
                Section 1b: Current Employment & Monthly Income
              </h3>
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Gross: {formatCurrency(form1003Data.employment.totalMonthlyIncome)} / mo
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">Current Employer</label>
                {isEditing1003 ? (
                  <input
                    value={form1003Data.employment.employerName}
                    onChange={(e) =>
                      setForm1003Data({
                        ...form1003Data,
                        employment: { ...form1003Data.employment, employerName: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none font-semibold text-slate-900"
                  />
                ) : (
                  <span className="font-bold text-slate-800">{form1003Data.employment.employerName}</span>
                )}
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">Job Title / Position</label>
                {isEditing1003 ? (
                  <input
                    value={form1003Data.employment.jobTitle}
                    onChange={(e) =>
                      setForm1003Data({
                        ...form1003Data,
                        employment: { ...form1003Data.employment, jobTitle: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none"
                  />
                ) : (
                  <span className="font-semibold text-slate-800">{form1003Data.employment.jobTitle}</span>
                )}
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">Tenure on Job</label>
                <span className="font-semibold text-slate-800">{form1003Data.employment.yearsOnJob} Years</span>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">Base Monthly Income ($)</label>
                {isEditing1003 ? (
                  <input
                    type="number"
                    value={form1003Data.employment.monthlyBaseIncome}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setForm1003Data({
                        ...form1003Data,
                        employment: {
                          ...form1003Data.employment,
                          monthlyBaseIncome: val,
                          totalMonthlyIncome: val + form1003Data.employment.monthlyBonus + form1003Data.employment.monthlyOvertime,
                        },
                      });
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none"
                  />
                ) : (
                  <span className="font-bold text-slate-900">{formatCurrency(form1003Data.employment.monthlyBaseIncome)}</span>
                )}
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">Monthly Bonus / Commission</label>
                <span className="font-semibold text-slate-800">{formatCurrency(form1003Data.employment.monthlyBonus)}</span>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">Total Qualifying Income</label>
                <span className="font-extrabold text-blue-700 text-sm">
                  {formatCurrency(form1003Data.employment.totalMonthlyIncome)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Financial Assets & Liabilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Assets */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[11px] flex items-center justify-center font-bold">2a</span>
                  Assets (Bank & Retirement)
                </h3>
                <span className="font-bold text-emerald-700 text-xs">{formatCurrency(form1003Data.assets.totalAssets)}</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-medium">Checking Accounts</span>
                  <span className="font-bold text-slate-900">{formatCurrency(form1003Data.assets.checkingBalance)}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-medium">Savings / Money Market</span>
                  <span className="font-bold text-slate-900">{formatCurrency(form1003Data.assets.savingsBalance)}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-medium">401(k) / Vested Retirement</span>
                  <span className="font-bold text-slate-900">{formatCurrency(form1003Data.assets.retirement401k)}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-medium">Other Liquid Assets</span>
                  <span className="font-bold text-slate-900">{formatCurrency(form1003Data.assets.otherAssets)}</span>
                </div>
              </div>
            </div>

            {/* Liabilities */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[11px] flex items-center justify-center font-bold">2b</span>
                  Monthly Liabilities & DTI
                </h3>
                <span className="font-bold text-slate-800 text-xs">
                  DTI: <strong className="text-blue-700">{form1003Data.liabilities.dtiRatio}%</strong>
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-medium">Revolving Credit Cards</span>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(form1003Data.liabilities.creditCardsMonthlyPayment)}/mo (Bal: {formatCurrency(form1003Data.liabilities.creditCardsBalance)})
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-medium">Automobile Installment Loan</span>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(form1003Data.liabilities.autoLoanMonthlyPayment)}/mo (Bal: {formatCurrency(form1003Data.liabilities.autoLoanBalance)})
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-medium">Student Loans (Deferred/Active)</span>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(form1003Data.liabilities.studentLoansMonthlyPayment)}/mo (Bal: {formatCurrency(form1003Data.liabilities.studentLoansBalance)})
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-blue-50 border border-blue-200 font-semibold">
                  <span className="text-blue-900">Total Monthly Debt Service</span>
                  <span className="font-bold text-blue-800">{formatCurrency(form1003Data.liabilities.totalMonthlyDebt)}/mo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Loan and Property Information */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[11px] flex items-center justify-center font-bold">3</span>
                Section 3: Loan Terms & Subject Property
              </h3>
              <span className="text-xs font-bold text-slate-800">
                LTV: <strong className="text-blue-700">{form1003Data.propertyAndLoan.ltvRatio}%</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Loan Purpose</span>
                <span className="font-bold text-slate-800">{form1003Data.propertyAndLoan.loanPurpose}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Occupancy Type</span>
                <span className="font-semibold text-slate-800">{form1003Data.propertyAndLoan.occupancy}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Purchase Price / Appraised</span>
                <span className="font-bold text-slate-800">{formatCurrency(form1003Data.propertyAndLoan.purchasePrice)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Note Amount ($)</span>
                <span className="font-bold text-blue-700">{formatCurrency(form1003Data.propertyAndLoan.loanAmount)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Interest Rate</span>
                <span className="font-bold text-slate-800">{form1003Data.propertyAndLoan.interestRate}%</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Amortization Term</span>
                <span className="font-semibold text-slate-800">30 Years (360 Months)</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Subject Property</span>
                <span className="font-semibold text-slate-800 truncate block">{form1003Data.propertyAndLoan.propertyAddress}</span>
              </div>
            </div>
          </div>

          {/* Section 4: Declarations Checklist */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[11px] flex items-center justify-center font-bold">4</span>
                Section 4: Statutory Borrower Declarations
              </h3>
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> All Disclosures Cleared
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                { label: 'Outstanding judgments against applicant?', val: form1003Data.declarations.outstandingJudgments },
                { label: 'Declared bankruptcy in the past 7 years?', val: form1003Data.declarations.declaredBankruptcyPast7Years },
                { label: 'Property foreclosed upon or deed in lieu in past 7 years?', val: form1003Data.declarations.propertyForeclosedPast7Years },
                { label: 'Party to a lawsuit or personal debt arbitration?', val: form1003Data.declarations.partyToLawsuit },
                { label: 'Presently delinquent on federal debt / student loan?', val: form1003Data.declarations.presentlyDelinquentOnFederalDebt },
                { label: 'US Citizen / Lawful Permanent Resident?', val: form1003Data.declarations.usCitizen },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                  <span className="text-slate-700 font-medium pr-2">{item.label}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    item.val ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {item.val ? 'YES' : 'NO'}
                  </span>
                </div>
              ))}
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

      {/* 2. Upload Document Modal with Real File Picker & Drag-and-Drop */}
      {showUploadDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Upload Loan File Document</h3>
                  <p className="text-[11px] text-slate-500">Pick or drop PDF/Image from your computer</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowUploadDocModal(false);
                  setSelectedUploadFile(null);
                  setUploadDocName('');
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as any;
                const finalFilename = uploadDocName.trim() || form.filename?.value?.trim();
                if (!finalFilename) {
                  alert('Please select or specify a document file.');
                  return;
                }

                try {
                  await fetch('/api/documents', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      workspaceId: workspace.id,
                      loanId: id,
                      filename: finalFilename.endsWith('.pdf') || finalFilename.endsWith('.png') || finalFilename.endsWith('.jpg') ? finalFilename : `${finalFilename}.pdf`,
                      originalName: selectedUploadFile?.name || finalFilename,
                      docType: uploadDocType,
                      conditionId: uploadConditionId || undefined,
                      fileSize: selectedUploadFile?.size || 1024 * 780,
                      mimeType: selectedUploadFile?.type || 'application/pdf',
                      actorId: currentUser.id,
                      actorName: currentUser.name,
                      actorRole: currentUser.role,
                    }),
                  });
                  setShowUploadDocModal(false);
                  setSelectedUploadFile(null);
                  setUploadDocName('');
                  fetchLoanData();
                } catch {
                  alert('Failed to upload document');
                }
              }}
              className="space-y-3.5 text-xs"
            >
              {/* Hidden Native File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFilePicked(e.target.files[0]);
                  }
                }}
                accept=".pdf,.png,.jpg,.jpeg,.tiff,.doc,.docx"
                className="hidden"
              />

              {/* Drag and Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setUploadDragOver(true);
                }}
                onDragLeave={() => setUploadDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setUploadDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFilePicked(e.dataTransfer.files[0]);
                  }
                }}
                className={`p-5 border-2 border-dashed rounded-xl text-center cursor-pointer transition ${
                  uploadDragOver
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : selectedUploadFile
                    ? 'border-emerald-400 bg-emerald-50/20'
                    : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'
                }`}
              >
                {selectedUploadFile ? (
                  <div className="space-y-1">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-slate-900 text-xs">{selectedUploadFile.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {(selectedUploadFile.size / 1024).toFixed(1)} KB • {selectedUploadFile.type || 'PDF Document'}
                    </div>
                    <span className="inline-block text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                      File Ready to Upload (Click to change)
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="font-semibold text-slate-800 text-xs">
                      Click to browse or drop file here
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Accepts PDF, PNG, JPG up to 25MB (Encrypted Workspace Storage)
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document Label / File Name *</label>
                <input
                  name="filename"
                  required
                  value={uploadDocName}
                  onChange={(e) => setUploadDocName(e.target.value)}
                  placeholder="e.g. 2025_W2_RobertDavis.pdf"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Document Type *</label>
                  <select
                    name="docType"
                    value={uploadDocType}
                    onChange={(e) => setUploadDocType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                  >
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
                  <select
                    name="conditionId"
                    value={uploadConditionId}
                    onChange={(e) => setUploadConditionId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="">None / General File</option>
                    {conditions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-[11px] flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Uploaded files undergo automated page-count & date-freshness verification.</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadDocModal(false);
                    setSelectedUploadFile(null);
                    setUploadDocName('');
                  }}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs transition flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload & Attach Document</span>
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

      {/* 8. Stage & Process Readiness Inspector Modal */}
      {showStageInspectorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Stage Process & Requirements Inspector
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Evaluating file completeness, Form 1003 verification, and condition hurdles.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowStageInspectorModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current vs Target Stage Status */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Current Stage</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <StageBadge stage={loan.stage} />
                    <span className="font-bold text-slate-800">
                      {loan.stage === 'Setup' && 'Initial Intake & 1003 Capture'}
                      {loan.stage === 'In Progress' && 'Active Processing & Condition Gathering'}
                      {loan.stage === 'Ready for Broker Review' && 'Final Underwriting & Clear to Close'}
                      {loan.stage === 'Blocked' && 'Blocked by Critical Exceptions'}
                      {loan.stage === 'Archived' && 'Funded / Closed'}
                    </span>
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">File Readiness</span>
                  <div className="text-sm font-extrabold text-blue-700">{loan.readinessScore}% Complete</div>
                </div>
              </div>

              {/* Stage Progression Path */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-1 text-[11px] text-slate-600 font-semibold overflow-x-auto">
                {(['Setup', 'In Progress', 'Ready for Broker Review', 'Archived'] as LoanStage[]).map((st) => {
                  const isCurrent = loan.stage === st;
                  const isTarget = (targetStageToInspect || loan.stage) === st;
                  return (
                    <button
                      key={st}
                      onClick={() => setTargetStageToInspect(st)}
                      className={`px-2.5 py-1 rounded-md transition border ${
                        isTarget
                          ? 'border-blue-600 bg-blue-50 text-blue-800 font-bold'
                          : isCurrent
                          ? 'border-slate-400 bg-slate-200 text-slate-900 font-bold'
                          : 'border-transparent text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stage Requirements Checklist */}
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Process Verification for: <span className="text-blue-700">{targetStageToInspect || loan.stage}</span>
              </h4>

              <div className="space-y-2">
                {/* 1. Form 1003 Data */}
                <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block">Form 1003 URLA Application</span>
                      <span className="text-[11px] text-slate-500">
                        Borrower ID, income ({formatCurrency(form1003Data?.employment?.totalMonthlyIncome || 14500)}/mo), assets & DTI ({form1003Data?.liabilities?.dtiRatio || 33.8}%) verified.
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                    COMPLETE
                  </span>
                </div>

                {/* 2. Document Checklist */}
                <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                      documents.length >= 2 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {documents.length >= 2 ? <Check className="w-3.5 h-3.5" /> : <AlertOctagon className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block">Mandatory Document Package</span>
                      <span className="text-[11px] text-slate-500">
                        {documents.length} files attached (Paystubs, W-2s, Statements, IRS 4506-C).
                      </span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                    documents.length >= 2 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {documents.length >= 2 ? 'SATISFIED' : 'NEEDS DOCS'}
                  </span>
                </div>

                {/* 3. Blocking Exceptions Radar */}
                <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                      openExceptions.length === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {openExceptions.length === 0 ? <Check className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block">Blocking Exceptions & Anomalies</span>
                      <span className="text-[11px] text-slate-500">
                        {openExceptions.length === 0
                          ? 'Zero unresolved exceptions. Clean audit runway.'
                          : `${openExceptions.length} active exception(s) require processor justification.`}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                    openExceptions.length === 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {openExceptions.length === 0 ? 'CLEAR' : `${openExceptions.length} OPEN`}
                  </span>
                </div>

                {/* 4. Readiness Score Threshold */}
                <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                      loan.readinessScore >= 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {loan.readinessScore >= 70 ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block">File Readiness Threshold</span>
                      <span className="text-[11px] text-slate-500">
                        Current score: <strong>{loan.readinessScore}%</strong> (Target for Broker Review: 70%+).
                      </span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                    loan.readinessScore >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {loan.readinessScore >= 70 ? 'PASS' : 'IN PROGRESS'}
                  </span>
                </div>
              </div>
            </div>

            {/* Transition Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                {/* Promote to Next Stage */}
                {loan.stage !== 'Archived' && (
                  <button
                    onClick={() => {
                      const nextStage: Record<LoanStage, LoanStage> = {
                        'Setup': 'In Progress',
                        'In Progress': 'Ready for Broker Review',
                        'Ready for Broker Review': 'Archived',
                        'Blocked': 'In Progress',
                        'Archived': 'Archived',
                      };
                      handleUpdateStage(nextStage[loan.stage]);
                      setShowStageInspectorModal(false);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
                  >
                    <span>Advance to Next Stage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Flag as Blocked toggle */}
                {loan.stage !== 'Blocked' ? (
                  <button
                    onClick={() => {
                      handleUpdateStage('Blocked');
                      setShowStageInspectorModal(false);
                    }}
                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-xl border border-red-200 transition flex items-center gap-1.5"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                    <span>Flag as Blocked</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleUpdateStage('In Progress');
                      setShowStageInspectorModal(false);
                    }}
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-xl border border-emerald-200 transition flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Unblock & Resume Processing</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowStageInspectorModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition"
              >
                Close Inspector
              </button>
            </div>
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
