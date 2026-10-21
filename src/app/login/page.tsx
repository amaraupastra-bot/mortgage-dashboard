'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { RoleBadge } from '@/components/ui/Badge';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Building2,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  Users,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { workspace, login, acceptInvite, switchUser, availableUsers } = useAuth();

  // Invite query params
  const inviteToken = searchParams.get('invite') || '';
  const paramEmail = searchParams.get('email') || '';
  const paramRole = (searchParams.get('role') as UserRole) || 'LOAN_OFFICER';
  const paramName = searchParams.get('name') || '';

  const isInviteMode = Boolean(inviteToken);

  // Form states
  const [email, setEmail] = useState(paramEmail || 's.jenkins@apexlending.com');
  const [password, setPassword] = useState('ApexSecure2026!');
  const [name, setName] = useState(paramName || '');
  const [role, setRole] = useState<UserRole>(paramRole);
  const [showPassword, setShowPassword] = useState(false);
  const [showDevPersonas, setShowDevPersonas] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (paramEmail) setEmail(paramEmail);
    if (paramName) setName(paramName);
    if (paramRole) setRole(paramRole);
  }, [paramEmail, paramName, paramRole]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isInviteMode) {
        // Invite acceptance
        const res = await acceptInvite({
          token: inviteToken,
          name: name || email.split('@')[0],
          email,
          role,
          password,
        });

        if (!res.success) {
          setError(res.error || 'Failed to complete invitation setup');
          setLoading(false);
          return;
        }

        setSuccessMsg(`Welcome aboard, ${res.user?.name}! Your account is now active.`);
        setTimeout(() => {
          router.push('/');
        }, 800);
      } else {
        // Standard login
        const res = await login(email, password);
        if (!res.success) {
          setError(res.error || 'Invalid credentials or user not found');
          setLoading(false);
          return;
        }

        setSuccessMsg(`Authenticated as ${res.user?.name} (${res.user?.role}). Redirecting...`);
        setTimeout(() => {
          router.push('/');
        }, 600);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('DemoPass2026!');
    setError(null);
    setLoading(true);
    const res = await login(demoEmail, 'DemoPass2026!');
    if (res.success) {
      setSuccessMsg(`Logged in as ${res.user?.name}. Redirecting...`);
      setTimeout(() => {
        router.push('/');
      }, 500);
    } else {
      setError(res.error || 'Failed to switch demo persona');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background radial gradient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-slate-950 pointer-events-none" />

      {/* Top Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/20 mb-4 border border-blue-400/30">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          MortgageLevels <span className="text-blue-400">Portal</span>
        </h1>
        <p className="mt-1 text-xs text-slate-400 flex items-center justify-center gap-1.5 font-medium">
          <Building2 className="w-3.5 h-3.5 text-blue-400" />
          {workspace.name} &bull; NMLS #{workspace.nmlsId}
        </p>
      </div>

      {/* Main Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-200/80">
          {/* 14-Day Free Trial Notice Banner */}
          <div className="mb-5 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">14-Day Pro Free Trial Active</div>
                <div className="text-[10px] text-slate-500">11 days remaining &bull; Full enterprise features</div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
              PRO TIER
            </span>
          </div>

          {/* Invite Banner if visiting with token */}
          {isInviteMode && (
            <div className="mb-6 p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-blue-950">Team Member Invitation</h3>
                  <p className="text-[11px] text-blue-800 mt-0.5 leading-relaxed">
                    You have been invited by Brokerage Admin to join as{' '}
                    <span className="font-bold underline">
                      {role === 'ADMIN' ? 'Brokerage Admin' : role === 'LOAN_OFFICER' ? 'Loan Officer' : 'Loan Processor'}
                    </span>
                    . Complete your password setup below to activate your account.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">
              {isInviteMode ? 'Activate Account & Set Password' : 'Sign In to Your Workspace'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isInviteMode
                ? 'Confirm your details to unlock your mortgage pipeline'
                : 'Access your assigned loan files, underwriting conditions, and exception radar'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            {isInviteMode && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jason Miller"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@apexlending.com"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {isInviteMode ? 'Create Password *' : 'Password *'}
                </label>
                {!isInviteMode && (
                  <span className="text-[11px] text-blue-600 hover:underline cursor-pointer">
                    Forgot password?
                  </span>
                )}
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isInviteMode && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Role</label>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">
                    {role === 'ADMIN' ? 'Brokerage Admin' : role === 'LOAN_OFFICER' ? 'Loan Officer' : 'Loan Processor'}
                  </span>
                  <RoleBadge role={role} />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                'Processing...'
              ) : isInviteMode ? (
                <>
                  <span>Activate Account & Access Pipeline</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Sign In to Brokerage Portal</span>
                </>
              )}
            </button>
          </form>

          {/* Discreet Dev / Testing Persona Accordion (Hidden from Invitees) */}
          {!isInviteMode && (
            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setShowDevPersonas(!showDevPersonas)}
                className="text-[11px] text-slate-400 hover:text-slate-600 font-medium inline-flex items-center gap-1.5 transition"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{showDevPersonas ? 'Hide Dev Testing Personas' : 'Dev Testing Switcher (Click to expand)'}</span>
                {showDevPersonas ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {showDevPersonas && (
                <div className="mt-3 space-y-1.5 animate-in fade-in duration-150 text-left">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('s.jenkins@apexlending.com')}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50/70 hover:border-blue-300 transition text-left flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800">👑 Sarah Jenkins (Owner / Admin)</div>
                      <div className="text-[10px] text-slate-400">Full branch visibility & settings</div>
                    </div>
                    <RoleBadge role="ADMIN" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('d.miller@apexlending.com')}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50/70 hover:border-blue-300 transition text-left flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800">💼 David Miller (Loan Officer)</div>
                      <div className="text-[10px] text-slate-400">Assigned loans & 1003 editing</div>
                    </div>
                    <RoleBadge role="LOAN_OFFICER" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('e.ramos@apexlending.com')}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50/70 hover:border-blue-300 transition text-left flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800">📑 Elena Ramos (Processor)</div>
                      <div className="text-[10px] text-slate-400">Document verification & conditions</div>
                    </div>
                    <RoleBadge role="PROCESSOR" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Compliance Footer */}
        <div className="mt-6 text-center text-[11px] text-slate-500 space-y-1">
          <p>
            Equal Housing Opportunity Brokerage &bull; Multi-Tenant Isolated Infrastructure
          </p>
          <p className="text-[10px] text-slate-400">
            Protected under 256-Bit Financial Encryption &bull; NMLS Consumer Access Verified
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs">Loading portal...</div>}>
      <LoginContent />
    </Suspense>
  );
}
