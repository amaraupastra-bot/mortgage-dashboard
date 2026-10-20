'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, UserRole } from '@/types';
import { RoleBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import {
  Users,
  UserPlus,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  X,
  Mail,
  Building2,
  RefreshCw,
  Lock,
} from 'lucide-react';

export default function TeamPage() {
  const { workspace, currentUser, availableUsers, switchUser } = useAuth();
  const [team, setTeam] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const isAdmin = currentUser.role === 'ADMIN';

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/team?workspaceId=${workspace.id}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load team');
      setTeam(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [workspace.id]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const handleToggleStatus = async (user: User) => {
    if (!isAdmin) {
      alert('Only Brokerage Admins may modify team member status.');
      return;
    }

    try {
      await fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: workspace.id,
          id: user.id,
          active: !user.active,
          actorId: currentUser.id,
          actorName: currentUser.name,
          actorRole: currentUser.role,
        }),
      });
      fetchTeam();
    } catch {
      alert('Failed to update user status');
    }
  };

  const handleChangeRole = async (user: User, newRole: UserRole) => {
    if (!isAdmin) {
      alert('Only Brokerage Admins may change user roles.');
      return;
    }

    try {
      await fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: workspace.id,
          id: user.id,
          role: newRole,
          actorId: currentUser.id,
          actorName: currentUser.name,
          actorRole: currentUser.role,
        }),
      });
      fetchTeam();
    } catch {
      alert('Failed to update role');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Team Access & Role-Based Permissions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage brokerage operators, assign role-based permissions, and enforce tenant isolation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin ? (
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-xs transition"
            >
              <UserPlus className="w-4 h-4" /> Invite Team Member
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-medium border border-slate-200">
              <Lock className="w-3.5 h-3.5" /> Admin Only Actions Locked
            </div>
          )}

          <button
            onClick={fetchTeam}
            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200 bg-white"
            title="Refresh team"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* RBAC Notice */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="font-bold text-slate-900 block mb-0.5">Enforced Server-Side Access Control (RBAC):</span>
          <p className="text-slate-600 text-[11px]">
            <strong>Brokerage Admin:</strong> Full workspace configuration, user invitations, and pipeline controls.<br />
            <strong>Loan Officer:</strong> Manage assigned loans, upload documents, and review exception items.<br />
            <strong>Processor:</strong> Document review verification, condition sign-off, and operational task execution.
          </p>
        </div>

        {/* Quick Switch Test Banner */}
        <div className="bg-white p-3 rounded-lg border border-slate-200 shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Current Session Persona:
          </span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">{currentUser.name}</span>
            <RoleBadge role={currentUser.role} />
          </div>
        </div>
      </div>

      {/* Team Member Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : team.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="font-bold text-sm text-slate-800">No team members found</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Name & Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Workspace Added</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {team.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                          {u.name[0]}
                        </div>
                        <span>{u.name}</span>
                        {u.id === currentUser.id && (
                          <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-semibold">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 pl-8">{u.email}</div>
                    </td>

                    <td className="py-3 px-4">
                      {isAdmin ? (
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeRole(u, e.target.value as UserRole)}
                          className="px-2 py-1 text-xs border border-slate-200 rounded bg-white font-medium text-slate-800 outline-none"
                        >
                          <option value="ADMIN">Brokerage Admin</option>
                          <option value="LOAN_OFFICER">Loan Officer</option>
                          <option value="PROCESSOR">Processor</option>
                        </select>
                      ) : (
                        <RoleBadge role={u.role} />
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {u.active ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-zinc-100 text-zinc-500 border border-zinc-200">
                          Deactivated
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-500">
                      {formatDate(u.createdAt)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {u.id !== currentUser.id && (
                          <button
                            onClick={() => switchUser(u.id)}
                            className="px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition"
                            title="Switch session persona to test permissions"
                          >
                            Switch To
                          </button>
                        )}

                        {isAdmin && u.id !== currentUser.id && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`px-2 py-1 text-xs font-medium rounded transition ${
                              u.active
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {u.active ? 'Deactivate' : 'Reactivate'}
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
      </div>

      {/* Modal: Invite Team Member */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Invite Brokerage Team Member</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as any;
                try {
                  const res = await fetch('/api/team', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      workspaceId: workspace.id,
                      name: form.name.value,
                      email: form.email.value,
                      role: form.role.value,
                      actorId: currentUser.id,
                      actorName: currentUser.name,
                      actorRole: currentUser.role,
                    }),
                  });
                  const json = await res.json();
                  if (!json.success) throw new Error(json.error || 'Failed to invite user');
                  setShowInviteModal(false);
                  fetchTeam();
                } catch (err: any) {
                  alert(err.message);
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Jason Miller"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Corporate Email Address *</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="e.g. j.miller@apexlending.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Role *</label>
                <select name="role" defaultValue="LOAN_OFFICER" className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                  <option value="LOAN_OFFICER">Loan Officer (Originator)</option>
                  <option value="PROCESSOR">Loan Processor (Document Verification)</option>
                  <option value="ADMIN">Brokerage Admin (Full Pipeline Management)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 shadow-xs"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
