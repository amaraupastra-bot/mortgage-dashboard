'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
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
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Trash2,
  Send,
  ArrowRight,
} from 'lucide-react';

interface InvitePreviewData {
  name: string;
  email: string;
  role: UserRole;
  token: string;
  inviteUrl: string;
}

export default function TeamPage() {
  const { workspace, currentUser, availableUsers, switchUser, refreshUsers } = useAuth();
  const [team, setTeam] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite modal & result modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteResult, setInviteResult] = useState<InvitePreviewData | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);

  const isAdmin = currentUser.role === 'ADMIN';

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/team?workspaceId=${workspace.id}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load team');
      setTeam(json.data);
      refreshUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [workspace.id, refreshUsers]);

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

  const handleDeleteUser = async (user: User) => {
    if (!isAdmin) {
      alert('Only Brokerage Admins may remove team members.');
      return;
    }

    if (user.id === currentUser.id || user.id === 'usr-1') {
      alert('Cannot delete your own account or the primary Broker of Record.');
      return;
    }

    if (!confirm(`Are you sure you want to permanently remove ${user.name} (${user.email}) from the brokerage?`)) {
      return;
    }

    try {
      const res = await fetch(
        `/api/team?id=${user.id}&workspaceId=${workspace.id}&actorId=${currentUser.id}&actorRole=${currentUser.role}`,
        { method: 'DELETE' }
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to delete user');
      fetchTeam();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isAdmin) {
    return (
      <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center max-w-lg mx-auto mt-12 space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Administrator Access Restricted</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Team member invitations, role changes, and account access controls are reserved exclusively for the Brokerage Administrator.
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
            <Users className="w-6 h-6 text-blue-600" />
            Team Access & Invitation Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Invite team members via magic onboarding link, assign role-based permissions, and manage operators.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin ? (
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-sm transition active:scale-95"
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
          <span className="font-bold text-slate-900 block mb-0.5 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Role-Based Access Control (RBAC) Architecture:
          </span>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            <strong>Brokerage Admin (Owner):</strong> Full workspace control, can invite/remove members, view all files, and modify global settings.<br />
            <strong>Loan Officer:</strong> Dedicated pipeline view (shows their assigned borrowers and deals), 1003 editing, document intake.<br />
            <strong>Loan Processor:</strong> Operational review hub, document verification, and lender condition clearance.
          </p>
        </div>

        {/* Current Session Persona Indicator */}
        <div className="bg-white p-3 rounded-lg border border-slate-200 shrink-0 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Active Session Persona:
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
                  <th className="py-3 px-4">Added Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {team.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-[11px]">
                          {u.name[0]}
                        </div>
                        <span>{u.name}</span>
                        {u.id === currentUser.id && (
                          <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-semibold">
                            Current You
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 pl-9">{u.email}</div>
                    </td>

                    <td className="py-3 px-4">
                      {isAdmin && u.id !== currentUser.id ? (
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeRole(u, e.target.value as UserRole)}
                          className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white font-medium text-slate-800 outline-none"
                        >
                          <option value="ADMIN">Brokerage Admin (Owner)</option>
                          <option value="LOAN_OFFICER">Loan Officer (Originator)</option>
                          <option value="PROCESSOR">Loan Processor (Underwriting)</option>
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
                      <div className="flex items-center justify-end gap-1.5">
                        {u.id !== currentUser.id && (
                          <button
                            onClick={() => switchUser(u.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition"
                            title="Switch session persona to inspect role view"
                          >
                            Switch To
                          </button>
                        )}

                        {isAdmin && u.id !== currentUser.id && (
                          <>
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`px-2 py-1 text-xs font-medium rounded-md transition ${
                                u.active
                                  ? 'text-amber-700 hover:bg-amber-50 border border-amber-200'
                                  : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                              }`}
                            >
                              {u.active ? 'Deactivate' : 'Reactivate'}
                            </button>

                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition"
                              title="Permanently remove team member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
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

      {/* Modal 1: Form to Invite Team Member */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Invite Brokerage Team Member</h3>
                  <p className="text-[11px] text-slate-500">Send an invitation email with a magic access link</p>
                </div>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSendingInvite(true);
                const form = e.target as any;
                const nameVal = form.name.value.trim();
                const emailVal = form.email.value.trim().toLowerCase();
                const roleVal = form.role.value as UserRole;

                try {
                  const res = await fetch('/api/team', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      workspaceId: workspace.id,
                      name: nameVal,
                      email: emailVal,
                      role: roleVal,
                      actorId: currentUser.id,
                      actorName: currentUser.name,
                      actorRole: currentUser.role,
                    }),
                  });
                  const json = await res.json();
                  if (!json.success) throw new Error(json.error || 'Failed to invite user');

                  // Generate invitation URL
                  const token = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
                  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
                  const inviteUrl = `${origin}/login?invite=${token}&email=${encodeURIComponent(
                    emailVal
                  )}&role=${roleVal}&name=${encodeURIComponent(nameVal)}`;

                  setShowInviteModal(false);
                  setInviteResult({
                    name: nameVal,
                    email: emailVal,
                    role: roleVal,
                    token,
                    inviteUrl,
                  });
                  fetchTeam();
                } catch (err: any) {
                  alert(err.message);
                } finally {
                  setSendingInvite(false);
                }
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Jason Miller"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Corporate Email Address *</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="e.g. j.miller@apexlending.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Role *</label>
                <select
                  name="role"
                  defaultValue="LOAN_OFFICER"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                >
                  <option value="LOAN_OFFICER">Loan Officer (Originator - Assigned Pipeline)</option>
                  <option value="PROCESSOR">Loan Processor (Document Verification & Clearance)</option>
                  <option value="ADMIN">Brokerage Admin (Full Pipeline & Team Management)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Loan Officers only see their assigned deals; Processors see document clearance queues; Admins have full access.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingInvite}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {sendingInvite ? 'Generating Invite...' : 'Generate & Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Dispatched Email Preview & Magic Link */}
      {inviteResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Invitation Dispatched Successfully!</h3>
                  <p className="text-[11px] text-slate-500">Email sent to {inviteResult.email}</p>
                </div>
              </div>
              <button onClick={() => setInviteResult(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Email Client Preview */}
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Simulated Dispatched Email:
              </span>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2.5">
                <div className="border-b border-slate-200 pb-2 space-y-1 text-[11px]">
                  <div className="flex items-center justify-between text-slate-500">
                    <span><strong>From:</strong> Apex Lending Partners &lt;notifications@apexlending.com&gt;</span>
                    <span className="text-[10px]">Just now</span>
                  </div>
                  <div className="text-slate-700">
                    <strong>To:</strong> {inviteResult.name} &lt;{inviteResult.email}&gt;
                  </div>
                  <div className="text-slate-900 font-semibold">
                    <strong>Subject:</strong> You&apos;ve been invited to join the Apex Lending Partners Mortgage Portal
                  </div>
                </div>

                <div className="pt-1 text-slate-700 space-y-2 text-[11px] leading-relaxed">
                  <p>Hi <strong>{inviteResult.name}</strong>,</p>
                  <p>
                    <strong>{currentUser.name}</strong> has invited you to join the brokerage workspace on MortgageLevels as a{' '}
                    <span className="font-semibold text-blue-700 bg-blue-50 px-1 py-0.5 rounded">
                      {inviteResult.role === 'ADMIN'
                        ? 'Brokerage Admin'
                        : inviteResult.role === 'LOAN_OFFICER'
                        ? 'Loan Officer'
                        : 'Loan Processor'}
                    </span>
                    .
                  </p>
                  <p className="text-slate-600">
                    Click the button below to accept your invitation, set your password, and access your active mortgage pipeline.
                  </p>

                  <div className="py-2 text-center">
                    <a
                      href={inviteResult.inviteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs shadow-sm transition"
                    >
                      <span>Accept Invitation & Set Password</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <p className="text-[10px] text-slate-400">
                    Apex Lending Partners &bull; NMLS #{workspace.nmlsId} &bull; Security Token: {inviteResult.token}
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Magic Link Copy Box */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-700">
                Magic Invitation Link (Direct Test URL):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteResult.inviteUrl}
                  className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-600 select-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(inviteResult.inviteUrl)}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition ${
                    copiedLink
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                  }`}
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Link
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                You can test this link right now in another tab.
              </span>
              <button
                type="button"
                onClick={() => setInviteResult(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
