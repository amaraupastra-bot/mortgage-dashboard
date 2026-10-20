'use client';

import React, { useEffect, useState, use, Suspense } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Mail,
  Send,
  AlertCircle,
} from 'lucide-react';
import { CustomForm, FormField } from '@/types';

function FormViewerContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [form, setForm] = useState<CustomForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);

  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    async function loadForm() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/forms/${id}?workspaceId=ws-apex-101`);
        const json = await res.json();
        if (!json.success || !json.data) throw new Error(json.error || 'Form not found');
        setForm(json.data);

        // Pre-fill initial form values
        const initial: Record<string, any> = {};
        json.data.fields.forEach((f: FormField) => {
          initial[f.id] = f.type === 'select' && f.options?.length ? f.options[0] : '';
        });
        setFormData(initial);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadForm();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSubmitting(true);
    setError(null);

    try {
      const mappedData: Record<string, any> = {};
      form.fields.forEach((f) => {
        const val = formData[f.id];
        mappedData[f.id] = val;
        // Also map to common fields
        if (f.label.toLowerCase().includes('name')) mappedData.fullName = val;
        if (f.type === 'email') mappedData.email = val;
        if (f.type === 'tel' || f.label.toLowerCase().includes('phone')) mappedData.phone = val;
        if (f.label.toLowerCase().includes('amount')) mappedData.loanAmount = val;
        if (f.label.toLowerCase().includes('purpose') || f.label.toLowerCase().includes('program')) mappedData.loanPurpose = val;
        if (f.label.toLowerCase().includes('address')) mappedData.propertyAddress = val;
      });

      const res = await fetch(`/api/forms/${form.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mappedData),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Submission failed');

      setSubmittedData(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-2 animate-pulse">
          <div className="w-10 h-10 bg-slate-200 rounded-full mx-auto" />
          <div className="h-4 bg-slate-200 rounded w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Form Unavailable</h2>
          <p className="text-xs text-slate-500">{error || 'This form is inactive or does not exist.'}</p>
        </div>
      </div>
    );
  }

  if (submittedData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Form Submitted
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-2">Thank You!</h2>
            <p className="text-xs text-slate-500 mt-1">
              Your details were received and a new loan file has been opened.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-slate-500">Loan File #</span>
              <span className="font-mono font-bold text-blue-700">{submittedData.loanNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Applicant</span>
              <span className="font-bold text-slate-800">{submittedData.borrowerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Notification Alert</span>
              <span className="font-medium text-emerald-700 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> Dispatched to {submittedData.notificationSentTo}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                setSubmittedData(null);
              }}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition"
            >
              Submit Another Response
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs text-slate-900">Apex Lending Partners</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">NMLS #1948201</span>
        </div>

        {/* Form Card */}
        <div
          style={{
            fontFamily:
              form.theme?.fontFamily === 'Merriweather'
                ? 'Georgia, Merriweather, serif'
                : form.theme?.fontFamily === 'Playfair'
                ? '"Playfair Display", Georgia, serif'
                : form.theme?.fontFamily === 'Poppins'
                ? 'Poppins, system-ui, sans-serif'
                : form.theme?.fontFamily === 'Roboto'
                ? 'Roboto, system-ui, sans-serif'
                : 'inherit',
          }}
          className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6"
        >
          <div>
            <h1 className="text-xl font-bold text-slate-900">{form.title}</h1>
            {form.description && <p className="text-xs text-slate-500 mt-1">{form.description}</p>}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {form.fields.map((field) => {
                const isFull = field.width === 'full' || field.type === 'heading' || field.type === 'divider' || field.type === 'textarea';

                if (field.type === 'heading') {
                  return (
                    <div key={field.id} className="sm:col-span-2 pt-2">
                      <h3 className="text-base font-bold text-slate-900">{field.label}</h3>
                      {field.helpText && <p className="text-xs text-slate-500 mt-0.5">{field.helpText}</p>}
                    </div>
                  );
                }

                if (field.type === 'divider') {
                  return (
                    <div key={field.id} className="sm:col-span-2 py-1">
                      <hr className="border-slate-200" />
                    </div>
                  );
                }

                return (
                  <div key={field.id} className={isFull ? 'sm:col-span-2' : 'sm:col-span-1'}>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>

                    {field.helpText && <p className="text-[11px] text-slate-400 mb-1">{field.helpText}</p>}

                    {field.type === 'select' ? (
                      <select
                        value={formData[field.id] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                        required={field.required}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white outline-none focus:border-blue-600 text-slate-900 font-medium"
                      >
                        <option value="">Select an option...</option>
                        {field.options?.map((opt, i) => (
                          <option key={i} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'radio' ? (
                      <div className="space-y-1.5 pt-0.5">
                        {field.options?.map((opt, i) => (
                          <label
                            key={i}
                            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition text-xs ${
                              formData[field.id] === opt
                                ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-semibold'
                                : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                            }`}
                          >
                            <input
                              type="radio"
                              name={field.id}
                              value={opt}
                              checked={formData[field.id] === opt}
                              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                              required={field.required}
                              className="text-blue-600"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    ) : field.type === 'file' ? (
                      <div className="space-y-1">
                        <input
                          type="file"
                          onChange={(e) => setFormData({ ...formData, [field.id]: e.target.files?.[0]?.name || '' })}
                          required={field.required}
                          className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-300 rounded-lg p-1 bg-white"
                        />
                      </div>
                    ) : field.type === 'checkbox' ? (
                      <label className="flex items-center gap-2.5 pt-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(formData[field.id])}
                          onChange={(e) => setFormData({ ...formData, [field.id]: e.target.checked })}
                          required={field.required}
                          className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                        />
                        <span className="text-xs text-slate-700 font-medium">
                          {field.placeholder || field.label} {field.required && <span className="text-red-500">*</span>}
                        </span>
                      </label>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        rows={3}
                        placeholder={field.placeholder || ''}
                        value={formData[field.id] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                        required={field.required}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600 text-slate-900 font-medium"
                      />
                    ) : (
                      <input
                        type={field.type}
                        placeholder={field.placeholder || ''}
                        value={formData[field.id] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                        required={field.required}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600 text-slate-900 font-medium"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-[11px] flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Encrypted secure intake. Submissions are transmitted directly to brokerage processing.</span>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                style={{ backgroundColor: form.theme?.primaryColor || '#2563eb' }}
                className={`w-full text-white font-semibold shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50 hover:brightness-95 ${
                  form.theme?.buttonRadius || 'rounded-xl'
                } ${
                  form.theme?.buttonSize === 'sm'
                    ? 'py-2 px-3 text-xs'
                    : form.theme?.buttonSize === 'lg'
                    ? 'py-3.5 px-6 text-sm'
                    : 'py-2.5 px-4 text-xs'
                }`}
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Submitting...' : form.theme?.buttonText || 'Submit Form'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function FormViewerPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading form...</div>}>
      <FormViewerContent params={params} />
    </Suspense>
  );
}
