'use client';

import React, { useEffect, useState, useCallback } from 'react';
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

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" />
          Workspace Configuration & Integrations
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure brokerage identification, data retention policies, and file readiness checking engine rules.
        </p>
      </div>

      {!isAdmin && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
          <Lock className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            You are logged in as <strong>{currentUser.name} ({currentUser.role})</strong>. Only Brokerage Admins may edit workspace settings. Fields are displayed in read-only mode.
          </span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Settings saved and applied successfully across the workspace.</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">NMLS License Identification #</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.nmlsId}
                onChange={(e) => setSettings({ ...settings, nmlsId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none disabled:bg-slate-50 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Operations Contact Email</label>
              <input
                type="email"
                disabled={!isAdmin}
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Brokerage Phone</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none disabled:bg-slate-50"
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
                className="w-full sm:w-80 px-3 py-2 border border-slate-300 rounded-lg bg-white outline-none disabled:bg-slate-50"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white font-mono"
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
                className="w-full max-w-sm accent-blue-600"
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
                className="w-full sm:w-80 px-3 py-2 border border-slate-300 rounded-lg bg-white outline-none disabled:bg-slate-50"
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
