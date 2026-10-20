'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { CustomForm, FormField } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  FormInput,
  Plus,
  Copy,
  ExternalLink,
  Code,
  Trash2,
  Edit3,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Mail,
  Send,
  Eye,
  RefreshCw,
  X,
  FileText,
  Sparkles,
} from 'lucide-react';

function FormsContent() {
  const { workspace, currentUser } = useAuth();
  const [forms, setForms] = useState<CustomForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Builder Modal State
  const [editingForm, setEditingForm] = useState<CustomForm | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  // Embed Modal State
  const [embedModalForm, setEmbedModalForm] = useState<CustomForm | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchForms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/forms?workspaceId=${workspace.id}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load forms');
      setForms(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [workspace.id]);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const handleCreateNew = () => {
    const blank: CustomForm = {
      id: '',
      workspaceId: workspace.id,
      title: 'New Borrower Intake Form',
      slug: `intake-${Date.now()}`,
      description: 'Quick financing inquiry and pre-qualification checklist.',
      notificationEmail: currentUser.email || 'operations@apexlending.com',
      status: 'Published',
      submissionsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fields: [
        { id: `f-${Date.now()}-1`, type: 'text', label: 'Full Legal Name', placeholder: 'e.g. John Doe', required: true },
        { id: `f-${Date.now()}-2`, type: 'email', label: 'Email Address', placeholder: 'john@example.com', required: true },
        { id: `f-${Date.now()}-3`, type: 'tel', label: 'Phone Number', placeholder: '(555) 000-0000', required: true },
        {
          id: `f-${Date.now()}-4`,
          type: 'select',
          label: 'Financing Goal',
          required: true,
          options: ['Home Purchase', 'Refinance Rate & Term', 'Cash-Out Refinance', 'VA Benefit Loan'],
        },
        { id: `f-${Date.now()}-5`, type: 'number', label: 'Estimated Loan Amount ($)', placeholder: '400000', required: true },
        { id: `f-${Date.now()}-6`, type: 'textarea', label: 'Property Address & Notes', placeholder: 'Address or property details...', required: false },
      ],
    };
    setEditingForm(blank);
    setIsNew(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingForm) return;
    setSaving(true);

    try {
      if (isNew) {
        const res = await fetch('/api/forms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...editingForm,
            workspaceId: workspace.id,
            actorId: currentUser.id,
            actorName: currentUser.name,
            actorRole: currentUser.role,
          }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Failed to save form');
      } else {
        const res = await fetch(`/api/forms/${editingForm.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...editingForm,
            workspaceId: workspace.id,
            actorId: currentUser.id,
            actorName: currentUser.name,
            actorRole: currentUser.role,
          }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Failed to update form');
      }

      setEditingForm(null);
      fetchForms();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this intake form?')) return;
    try {
      await fetch(`/api/forms/${formId}?workspaceId=${workspace.id}`, { method: 'DELETE' });
      fetchForms();
    } catch {
      alert('Failed to delete form');
    }
  };

  // Field manipulation inside the Builder
  const addField = () => {
    if (!editingForm) return;
    const newField: FormField = {
      id: `f-${Date.now()}`,
      type: 'text',
      label: 'New Question',
      placeholder: 'Enter response...',
      required: false,
    };
    setEditingForm({
      ...editingForm,
      fields: [...editingForm.fields, newField],
    });
  };

  const removeField = (fieldId: string) => {
    if (!editingForm) return;
    setEditingForm({
      ...editingForm,
      fields: editingForm.fields.filter((f) => f.id !== fieldId),
    });
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (!editingForm) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= editingForm.fields.length) return;

    const list = [...editingForm.fields];
    const temp = list[index];
    list[index] = list[newIndex];
    list[newIndex] = temp;

    setEditingForm({ ...editingForm, fields: list });
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    if (!editingForm) return;
    const list = [...editingForm.fields];
    list[index] = { ...list[index], ...updates };
    setEditingForm({ ...editingForm, fields: list });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FormInput className="w-6 h-6 text-blue-600" />
            Lead Intake Forms & Builder
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create custom intake forms with drag/reorder controls, set your notification email, and get embed codes for your website.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Create Custom Form
          </button>
          <button
            onClick={fetchForms}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200 bg-white"
            title="Refresh forms"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />)
        ) : forms.length === 0 ? (
          <div className="col-span-full p-12 bg-white rounded-xl border border-slate-200 text-center text-slate-500">
            <FormInput className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="font-bold text-sm text-slate-800">No custom forms created yet</h3>
            <button
              onClick={handleCreateNew}
              className="mt-3 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg"
            >
              Build Your First Form
            </button>
          </div>
        ) : (
          forms.map((form) => {
            const publicUrl = `http://localhost:3000/f/${form.id}`;
            return (
              <div
                key={form.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        form.status === 'Published'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {form.status}
                    </span>
                    <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {form.submissionsCount} Leads
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 leading-snug">{form.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{form.description}</p>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                      <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="text-[11px] truncate">
                        Alerts: <strong>{form.notificationEmail}</strong>
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {form.fields.length} dynamic field(s) configured
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => setEmbedModalForm(form)}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg border border-slate-200 transition"
                    >
                      <Code className="w-3.5 h-3.5 text-indigo-600" /> Embed Code
                    </button>
                    <a
                      href={`/f/${form.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg border border-blue-200 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Test Form
                    </a>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      onClick={() => {
                        setEditingForm(form);
                        setIsNew(false);
                      }}
                      className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Fields & Email
                    </button>
                    <button
                      onClick={() => handleDeleteForm(form.id)}
                      className="text-xs text-slate-400 hover:text-red-600 p-1 rounded"
                      title="Delete form"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Interactive Form Builder */}
      {editingForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full my-8 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {isNew ? 'Create New Intake Form' : `Edit Form: ${editingForm.title}`}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure form fields, reorder questions, and specify where notifications are delivered.
                </p>
              </div>
              <button onClick={() => setEditingForm(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-5 text-xs">
              {/* General Form Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Form Title *</label>
                  <input
                    type="text"
                    required
                    value={editingForm.title}
                    onChange={(e) => setEditingForm({ ...editingForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Description / Subtitle</label>
                  <input
                    type="text"
                    value={editingForm.description}
                    onChange={(e) => setEditingForm({ ...editingForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Notification Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. your-email@brokerage.com"
                      value={editingForm.notificationEmail}
                      onChange={(e) => setEditingForm({ ...editingForm, notificationEmail: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg outline-none bg-white font-medium text-slate-900"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Every time a borrower submits, an alert is recorded and delivered to this email.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Publish Status</label>
                  <select
                    value={editingForm.status}
                    onChange={(e) => setEditingForm({ ...editingForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="Published">Published (Active & Accessible)</option>
                    <option value="Draft">Draft (Internal Only)</option>
                  </select>
                </div>
              </div>

              {/* Form Fields Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    Form Questions & Questions Order ({editingForm.fields.length})
                  </h4>
                  <button
                    type="button"
                    onClick={addField}
                    className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded font-semibold text-xs hover:bg-indigo-100 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Question
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {editingForm.fields.map((field, idx) => (
                    <div
                      key={field.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2 hover:border-slate-300 transition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-1">
                          {/* Reorder arrows */}
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveField(idx, 'up')}
                              className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === editingForm.fields.length - 1}
                              onClick={() => moveField(idx, 'down')}
                              className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="font-mono text-xs font-bold text-slate-400 w-5">#{idx + 1}</span>

                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateField(idx, { label: e.target.value })}
                            placeholder="Question label..."
                            className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs font-semibold text-slate-900 outline-none"
                          />
                        </div>

                        {/* Field Type Select */}
                        <select
                          value={field.type}
                          onChange={(e) => updateField(idx, { type: e.target.value as any })}
                          className="px-2 py-1 border border-slate-200 rounded text-xs bg-slate-50 font-medium"
                        >
                          <option value="text">Short Text</option>
                          <option value="email">Email</option>
                          <option value="tel">Phone</option>
                          <option value="number">Number / Amount</option>
                          <option value="select">Dropdown Select</option>
                          <option value="textarea">Long Text / Paragraph</option>
                          <option value="date">Date</option>
                        </select>

                        {/* Required toggle */}
                        <label className="flex items-center gap-1 text-[11px] font-medium text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(idx, { required: e.target.checked })}
                            className="rounded text-blue-600"
                          />
                          <span>Required</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => removeField(field.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                          title="Remove field"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Dropdown Options editor if type === 'select' */}
                      {field.type === 'select' && (
                        <div className="pl-8 pt-1">
                          <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                            Dropdown Options (comma-separated):
                          </label>
                          <input
                            type="text"
                            value={field.options?.join(', ') || ''}
                            onChange={(e) =>
                              updateField(idx, {
                                options: e.target.value.split(',').map((o) => o.trim()).filter(Boolean),
                              })
                            }
                            placeholder="Option 1, Option 2, Option 3..."
                            className="w-full px-2 py-1 border border-slate-200 rounded text-xs bg-slate-50 font-medium"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingForm(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save & Publish Form'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Embed Code & Share Link */}
      {embedModalForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900 font-sans">
                  Embed & Share &quot;{embedModalForm.title}&quot;
                </h3>
                <p className="text-xs text-slate-500">Put this form on your website or send direct link to clients.</p>
              </div>
              <button onClick={() => setEmbedModalForm(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Direct Link */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Direct Form Link (Share with clients)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`http://localhost:3000/f/${embedModalForm.id}`}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 font-mono text-xs select-all outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`http://localhost:3000/f/${embedModalForm.id}`);
                      alert('Direct link copied!');
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg border border-slate-200 shrink-0 transition"
                  >
                    Copy Link
                  </button>
                </div>
              </div>

              {/* Website Embed Code */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Website Embed Code (iFrame Widget)</label>
                <textarea
                  readOnly
                  rows={3}
                  value={`<iframe src="http://localhost:3000/f/${embedModalForm.id}" width="100%" height="750" frameborder="0" style="border:none; border-radius:12px; box-shadow:0 4px 16px rgba(0,0,0,0.06);"></iframe>`}
                  className="w-full p-3 border border-slate-300 rounded-lg bg-slate-900 text-emerald-400 font-mono text-[11px] select-all outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `<iframe src="http://localhost:3000/f/${embedModalForm.id}" width="100%" height="750" frameborder="0" style="border:none; border-radius:12px; box-shadow:0 4px 16px rgba(0,0,0,0.06);"></iframe>`
                    );
                    alert('Embed code copied! Paste into WordPress or your website.');
                  }}
                  className="mt-2 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition"
                >
                  Copy Website Embed Code
                </button>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] space-y-1">
                <strong>Automatic Pipeline Synchronization:</strong>
                <div>
                  Any submission made through this link or embedded widget automatically creates a new loan file in your <strong>Setup</strong> queue and sends an alert to <strong>{embedModalForm.notificationEmail}</strong>.
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setEmbedModalForm(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FormsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Form Builder...</div>}>
      <FormsContent />
    </Suspense>
  );
}
