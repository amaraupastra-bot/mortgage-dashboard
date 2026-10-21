'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { SystemSettings } from '@/types';
import {
  Settings,
  Building2,
  Cpu,
  ShieldCheck,
  Bell,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Info,
} from 'lucide-react';

export default function SettingsPage() {
  const { workspace, currentUser } = useAuth();
  const isAdmin = currentUser.role === 'ADMIN';

  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/settings?workspaceId=${workspace.id}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to fetch settings');
      setSettings(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [workspace.id]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Only Brokerage Admins may modify workspace settings.');
      return;
    }
    if (!settings) return;

    setSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          workspaceId: workspace.id,
          actorId: currentUser.id,
          actorName: currentUser.name,
          actorRole: currentUser.role,
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to save settings');
      setSettings(json.data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4" />
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
        <h2 className="text-base font-bold text-slate-900">Administrator Permission Required</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Global brokerage configuration, NMLS licensing, AI validation thresholds, and data retention rules can only be modified by the Broker of Record (Admin).
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

  const inputClass =
    'w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white text-slate-900 font-medium disabled:bg-slate-100 disabled:text-slate-900 disabled:border-slate-300 disabled:opacity-100 focus:border-blue-600 focus:ring-1 focus:ring-blue-600';
  const selectClass =
    'w-full sm:w-80 px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-medium disabled:bg-slate-100 disabled:text-slate-900 disabled:border-slate-300 disabled:opacity-100 outline-none focus:border-blue-600';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" />
          Workspace Configuration & Integrations
        </h1>
        <p className="text-xs text-slate-600 mt-0.5">
          Configure brokerage identification, data retention policies, and file readiness checking engine rules.
        </p>
      </div>

      {!isAdmin && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-center gap-2 font-medium">
          <Lock className="w-4 h-4 shrink-0 text-amber-700" />
          <span>
            You are currently viewing as <strong>{currentUser.name} ({currentUser.role})</strong>. Only Brokerage Admins may edit workspace settings. Switch to <strong>Sarah Jenkins (Admin)</strong> from the top right to edit.
          </span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-900 flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
          <span>Settings saved and applied successfully across the workspace.</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-xs text-red-900 flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-700" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Brokerage Profile */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">Brokerage Entity Details</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Brokerage Legal Name</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.brokerageName}
                onChange={(e) => setSettings({ ...settings, brokerageName: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">NMLS License Identification #</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.nmlsId}
                onChange={(e) => setSettings({ ...settings, nmlsId: e.target.value })}
                className={`${inputClass} font-mono`}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Operations Contact Email</label>
              <input
                type="email"
                disabled={!isAdmin}
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Brokerage Phone</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Section 2: AI & Readiness Checker Engine */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">File Readiness & AI Engine Configuration</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Inspection Engine Provider</label>
              <select
                disabled={!isAdmin}
                value={settings.aiProvider}
                onChange={(e) => setSettings({ ...settings, aiProvider: e.target.value as any })}
                className={selectClass}
              >
                <option value="deterministic">Deterministic Rule Engine (No External API Required)</option>
                <option value="openai">OpenAI API (GPT-4o Document Extraction)</option>
                <option value="anthropic">Anthropic API (Claude 3.5 Sonnet Vision)</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                The local deterministic engine executes all verified mortgage checklist rules without sending data to external third parties.
              </p>
            </div>

            {settings.aiProvider !== 'deterministic' && (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-800 font-semibold">
                  <KeyRound className="w-4 h-4 text-indigo-600" /> API Provider Credentials
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Provider API Key</label>
                  <input
                    type="password"
                    disabled={!isAdmin}
                    placeholder="sk-live-..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white font-mono text-slate-900"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Keys are kept secure in environment configuration and never exposed to client browsers.
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Minimum AI Extraction Confidence Threshold ({settings.minConfidenceThreshold}%)
              </label>
              <input
                type="range"
                min="60"
                max="95"
                step="5"
                disabled={!isAdmin}
                value={settings.minConfidenceThreshold}
                onChange={(e) => setSettings({ ...settings, minConfidenceThreshold: Number(e.target.value) })}
                className="w-full max-w-sm accent-blue-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-0.5">
                Extractions scoring below this threshold are automatically flagged as &quot;Needs Human Review&quot;.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Data Retention & Compliance */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">Regulatory Retention & Privacy Settings</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Loan File Document Retention Policy</label>
              <select
                disabled={!isAdmin}
                value={settings.dataRetentionDays}
                onChange={(e) => setSettings({ ...settings, dataRetentionDays: Number(e.target.value) })}
                className={selectClass}
              >
                <option value={2555}>7 Years (Standard US Federal Mortgage Record Retention)</option>
                <option value={1825}>5 Years (State Specific Minimum)</option>
                <option value={3650}>10 Years (Extended Brokerage Archive)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="emailAlerts"
                disabled={!isAdmin}
                checked={settings.emailAlertsEnabled}
                onChange={(e) => setSettings({ ...settings, emailAlertsEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <label htmlFor="emailAlerts" className="font-semibold text-slate-700 cursor-pointer">
                Send email alerts when high-severity exceptions or overdue conditions are flagged
              </label>
            </div>
          </div>
        </div>

        {/* Section 4: Website Embed & Borrower Intake Widget */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">Website Embed & Borrower Lead Intake Widget</h3>
          </div>

          <p className="text-xs text-slate-600">
            Embed this form directly onto your brokerage website (WordPress, Webflow, Squarespace, or custom site). When clients fill it out on your website, it automatically creates the loan file in your MortgageLevels dashboard under the <strong>Setup</strong> stage.
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Direct Client Application URL</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value="http://localhost:3000/apply"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 font-mono text-xs select-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('http://localhost:3000/apply');
                    alert('Copied direct intake link to clipboard!');
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg border border-slate-200 shrink-0 transition"
                >
                  Copy Link
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Website Embed Code (iFrame / HTML Widget)</label>
              <div className="relative">
                <textarea
                  readOnly
                  rows={2}
                  value='<iframe src="http://localhost:3000/apply" width="100%" height="750" frameborder="0" style="border:none; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.05);"></iframe>'
                  className="w-full p-3 border border-slate-300 rounded-lg bg-slate-900 text-emerald-400 font-mono text-[11px] select-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('<iframe src="http://localhost:3000/apply" width="100%" height="750" frameborder="0" style="border:none; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.05);"></iframe>');
                    alert('Copied website embed code to clipboard!');
                  }}
                  className="mt-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition"
                >
                  Copy Embed Code
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Paste this HTML snippet into any page on your website to allow borrowers to submit their loan files directly into your dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        {isAdmin && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Workspace Settings'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
