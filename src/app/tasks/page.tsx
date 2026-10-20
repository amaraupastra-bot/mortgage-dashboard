'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Task, TaskStatus, TaskPriority } from '@/types';
import { TaskStatusBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import {
  CheckSquare,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  User,
  ArrowRight,
  X,
  RefreshCw,
} from 'lucide-react';

export default function TasksPage() {
  const { workspace, currentUser, availableUsers } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // New task modal
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ workspaceId: workspace.id });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (assigneeFilter !== 'all') params.set('assigneeId', assigneeFilter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);

      const res = await fetch(`/api/tasks?${params.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load tasks');
      setTasks(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [workspace.id, statusFilter, assigneeFilter, priorityFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = tasks.filter((t) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      t.title.toLowerCase().includes(term) ||
      t.loanNumber.toLowerCase().includes(term) ||
      t.borrowerDisplayName.toLowerCase().includes(term) ||
      (t.description && t.description.toLowerCase().includes(term))
    );
  });

  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: workspace.id,
          id: taskId,
          status: newStatus,
          actorId: currentUser.id,
          actorName: currentUser.name,
          actorRole: currentUser.role,
        }),
      });
      fetchTasks();
    } catch {
      alert('Failed to update task');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-blue-600" />
            Workflow Tasks & Action Items
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational to-do items linked to loan requirements, document corrections, and closing milestones.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
          <button
            onClick={fetchTasks}
            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200"
            title="Refresh tasks"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tasks, loan #, or assignee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Waiting">Waiting</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
            >
              <option value="all">All Assignees</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Task List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="font-bold text-sm text-slate-800">No tasks match your criteria</h3>
            <p className="text-xs text-slate-400 mt-1">All action items are clear or completed.</p>
          </div>
        ) : (
          filteredTasks.map((t) => (
            <div key={t.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/loans/${t.loanId}`}
                    className="font-mono font-bold text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                  >
                    {t.loanNumber}
                  </Link>
                  <span className="font-semibold text-xs text-slate-700">{t.borrowerDisplayName}</span>
                  <TaskStatusBadge status={t.status} />
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      t.priority === 'Urgent'
                        ? 'bg-red-100 text-red-800'
                        : t.priority === 'High'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {t.priority}
                  </span>
                </div>

                <h3 className="font-bold text-xs sm:text-sm text-slate-900">{t.title}</h3>
                {t.description && <p className="text-xs text-slate-500">{t.description}</p>}

                <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-0.5">
                  <span>Assignee: <strong className="text-slate-600">{t.assigneeName || 'Unassigned'}</strong></span>
                  <span>•</span>
                  <span>Due: <strong className="text-slate-600">{formatDate(t.dueDate)}</strong></span>
                </div>
              </div>

              {/* Status Selector */}
              <div className="shrink-0 flex items-center gap-2">
                <select
                  value={t.status}
                  onChange={(e) => handleUpdateStatus(t.id, e.target.value as TaskStatus)}
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-medium text-slate-700 outline-none"
                >
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Waiting">Waiting</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                <Link
                  href={`/loans/${t.loanId}?tab=tasks`}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition"
                  title="Open in Loan Workspace"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Add Task */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Create Workflow Task</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
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
                      loanId: form.loanId.value,
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
                  setShowAddModal(false);
                  fetchTasks();
                } catch {
                  alert('Failed to create task');
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Loan File *</label>
                <select name="loanId" required className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                  <option value="loan-1">ML-2026-881 — R. Davis & M. Davis</option>
                  <option value="loan-2">ML-2026-882 — Carlos & Sofia Martinez</option>
                  <option value="loan-3">ML-2026-883 — Aarav & Priya Patel</option>
                  <option value="loan-4">ML-2026-884 — Major James Taylor</option>
                  <option value="loan-5">ML-2026-885 — Evelyn Sterling</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Task Title *</label>
                <input
                  name="title"
                  required
                  placeholder="e.g. Order appraisal re-inspection from Mercury Network"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Specific follow-up notes..."
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
                    defaultValue={new Date().toISOString().split('T')[0]}
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
                  onClick={() => setShowAddModal(false)}
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
