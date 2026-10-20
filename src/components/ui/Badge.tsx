import React from 'react';
import { cn } from '@/lib/utils';
import {
  LoanStage,
  ConditionStatus,
  DocumentStatus,
  ExceptionSeverity,
  ExceptionStatus,
  TaskStatus,
  UserRole,
} from '@/types';
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, FileCheck, ShieldAlert, Sparkles } from 'lucide-react';

export function StageBadge({ stage }: { stage: LoanStage }) {
  const styles: Record<LoanStage, string> = {
    Setup: 'bg-slate-100 text-slate-800 border-slate-200',
    'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
    Blocked: 'bg-red-50 text-red-700 border-red-200 font-semibold',
    'Ready for Broker Review': 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold',
    Archived: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  };

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', styles[stage])}>
      {stage === 'Blocked' && <ShieldAlert className="w-3 h-3 mr-1 text-red-600" />}
      {stage === 'Ready for Broker Review' && <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />}
      {stage}
    </span>
  );
}

export function ConditionStatusBadge({ status }: { status: ConditionStatus }) {
  const styles: Record<ConditionStatus, string> = {
    Open: 'bg-slate-100 text-slate-700 border-slate-200',
    Requested: 'bg-amber-50 text-amber-700 border-amber-200',
    Received: 'bg-blue-50 text-blue-700 border-blue-200',
    'In Review': 'bg-purple-50 text-purple-700 border-purple-200',
    'Needs Correction': 'bg-red-50 text-red-700 border-red-200 font-medium',
    Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-medium',
  };

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', styles[status])}>
      {status === 'Resolved' && <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />}
      {status === 'Needs Correction' && <AlertCircle className="w-3 h-3 mr-1 text-red-600" />}
      {status}
    </span>
  );
}

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  const styles: Record<DocumentStatus, string> = {
    Uploaded: 'bg-slate-100 text-slate-700 border-slate-200',
    Processing: 'bg-sky-50 text-sky-700 border-sky-200',
    'Review Required': 'bg-amber-50 text-amber-800 border-amber-200 font-medium',
    'Accepted for Requirement': 'bg-emerald-50 text-emerald-700 border-emerald-300 font-medium',
    Rejected: 'bg-red-50 text-red-700 border-red-200 font-medium',
    Superseded: 'bg-zinc-100 text-zinc-500 border-zinc-200 line-through',
  };

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', styles[status])}>
      {status === 'Accepted for Requirement' && <FileCheck className="w-3 h-3 mr-1 text-emerald-600" />}
      {status === 'Review Required' && <Clock className="w-3 h-3 mr-1 text-amber-600" />}
      {status === 'Rejected' && <AlertCircle className="w-3 h-3 mr-1 text-red-600" />}
      {status}
    </span>
  );
}

export function SeverityBadge({ severity, isAiSuggested = false }: { severity: ExceptionSeverity; isAiSuggested?: boolean }) {
  const styles: Record<ExceptionSeverity, string> = {
    Urgent: 'bg-red-100 text-red-800 border-red-300 font-semibold',
    High: 'bg-orange-100 text-orange-800 border-orange-300 font-semibold',
    Normal: 'bg-blue-50 text-blue-800 border-blue-200 font-medium',
    Low: 'bg-slate-100 text-slate-700 border-slate-200 font-medium',
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs border', styles[severity])}>
        {severity === 'Urgent' && <AlertCircle className="w-3 h-3 mr-1 text-red-700" />}
        {severity === 'High' && <AlertTriangle className="w-3 h-3 mr-1 text-orange-700" />}
        {severity}
      </span>
      {isAiSuggested && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-medium" title="AI Suggested - Requires Human Review">
          <Sparkles className="w-2.5 h-2.5 mr-0.5 text-purple-600" />
          AI Suggested
        </span>
      )}
    </div>
  );
}

export function ExceptionStatusBadge({ status }: { status: ExceptionStatus }) {
  const styles: Record<ExceptionStatus, string> = {
    Open: 'bg-red-50 text-red-700 border-red-200',
    Assigned: 'bg-amber-50 text-amber-700 border-amber-200',
    'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
    Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-medium',
    Dismissed: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  };

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', styles[status])}>
      {status === 'Resolved' && <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />}
      {status}
    </span>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const styles: Record<TaskStatus, string> = {
    'To Do': 'bg-slate-100 text-slate-700 border-slate-200',
    'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
    Waiting: 'bg-amber-50 text-amber-700 border-amber-200',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-medium',
    Cancelled: 'bg-zinc-100 text-zinc-500 border-zinc-200 line-through',
  };

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border', styles[status])}>
      {status === 'Completed' && <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />}
      {status}
    </span>
  );
}

export function RoleBadge({ role }: { role: UserRole }) {
  const styles: Record<UserRole, string> = {
    ADMIN: 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold',
    LOAN_OFFICER: 'bg-blue-50 text-blue-700 border-blue-200 font-medium',
    PROCESSOR: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium',
  };

  const labels: Record<UserRole, string> = {
    ADMIN: 'Brokerage Admin',
    LOAN_OFFICER: 'Loan Officer',
    PROCESSOR: 'Processor',
  };

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs whitespace-nowrap border shrink-0', styles[role])}>
      {labels[role]}
    </span>
  );
}
