'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { CustomForm, FormField, FormTheme } from '@/types';
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
  Type,
  AlignLeft,
  Phone,
  DollarSign,
  Calendar,
  ListFilter,
  CheckSquare,
  Heading,
  Minus,
  Settings as SettingsIcon,
  Layers,
  Sparkles,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Palette,
  Laptop,
  Smartphone,
  Save,
  Sliders,
  Check,
} from 'lucide-react';

const defaultTheme: FormTheme = {
  primaryColor: '#2563eb',
  buttonText: 'Submit Loan Request',
  buttonSize: 'md',
  buttonRadius: 'rounded-xl',
  cardStyle: 'bordered',
};

// Available components in Fillout-style palette
const componentPalette = [
  { type: 'text', label: 'Short Text', icon: Type, description: 'Single-line text for names, titles' },
  { type: 'textarea', label: 'Large Text', icon: AlignLeft, description: 'Multi-line paragraph notes' },
  { type: 'email', label: 'Email', icon: Mail, description: 'Validated email input' },
  { type: 'tel', label: 'Phone Number', icon: Phone, description: 'Phone contact with format' },
  { type: 'number', label: 'Loan Amount ($)', icon: DollarSign, description: 'Currency or numeric amount' },
  { type: 'select', label: 'Dropdown Select', icon: ListFilter, description: 'Single choice from list' },
  { type: 'radio', label: 'Multiple Choice', icon: CheckSquare, description: 'Selectable pill options' },
  { type: 'date', label: 'Date Picker', icon: Calendar, description: 'Target closing or move-in date' },
  { type: 'heading', label: 'Section Header', icon: Heading, description: 'Section divider with title' },
  { type: 'divider', label: 'Divider Line', icon: Minus, description: 'Clean separator line' },
];

const colorOptions = [
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Indigo', hex: '#4f46e5' },
  { name: 'Navy Slate', hex: '#0f172a' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Crimson', hex: '#dc2626' },
  { name: 'Amber Gold', hex: '#d97706' },
];

function FormsContent() {
  const { workspace, currentUser } = useAuth();
  const [forms, setForms] = useState<CustomForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active view: 'list' (all forms) or 'studio' (Fillout-style builder)
  const [activeView, setActiveView] = useState<'list' | 'studio'>('list');
  const [studioTab, setStudioTab] = useState<'builder' | 'settings' | 'preview' | 'embed'>('builder');

  // Active form being designed
  const [currentForm, setCurrentForm] = useState<CustomForm | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [saving, setSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  // Drag over tracking
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [draggedPaletteType, setDraggedPaletteType] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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

  // Start designing a new form
  const handleCreateNewForm = () => {
    const newForm: CustomForm = {
      id: `form-${Date.now()}`,
      workspaceId: workspace.id,
      title: 'Borrower Pre-Approval Intake',
      slug: `intake-${Date.now()}`,
      description: 'Fill out this quick financing intake form. Our loan officers will evaluate your file.',
      notificationEmail: currentUser.email || 'operations@apexlending.com',
      status: 'Published',
      submissionsCount: 0,
      theme: { ...defaultTheme },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fields: [
        { id: `f-head-1`, type: 'heading', label: 'Applicant Contact Details', required: false, width: 'full' },
        { id: `f-name`, type: 'text', label: 'Full Legal Name(s)', placeholder: 'e.g. Robert & Megan Davis', required: true, width: 'half' },
        { id: `f-email`, type: 'email', label: 'Email Address', placeholder: 'robert@example.com', required: true, width: 'half' },
        { id: `f-phone`, type: 'tel', label: 'Phone Number', placeholder: '(512) 555-0199', required: true, width: 'half' },
        { id: `f-date`, type: 'date', label: 'Target Closing Date', required: false, width: 'half' },
        { id: `f-divider-1`, type: 'divider', label: 'Divider', required: false, width: 'full' },
        { id: `f-head-2`, type: 'heading', label: 'Loan Program & Financing Goal', required: false, width: 'full' },
        {
          id: `f-program`,
          type: 'select',
          label: 'Financing Goal & Loan Program',
          required: true,
          width: 'half',
          options: ['Conventional 30-Year Purchase', 'FHA 30-Year Loan', 'VA Zero Down Loan', 'Rate & Term Refinance', 'Cash-Out Refinance'],
        },
        { id: `f-amount`, type: 'number', label: 'Estimated Loan Amount ($)', placeholder: '540000', required: true, width: 'half' },
        { id: `f-address`, type: 'text', label: 'Subject Property Address', placeholder: '742 Evergreen Terrace, Austin TX', required: false, width: 'full' },
        { id: `f-notes`, type: 'textarea', label: 'Special Instructions / Comments', placeholder: 'Any specific requests...', required: false, width: 'full' },
      ],
    };
    setCurrentForm(newForm);
    setSelectedFieldId(null);
    setActiveView('studio');
    setStudioTab('builder');
  };

  const handleEditForm = (form: CustomForm) => {
    setCurrentForm({
      ...form,
      theme: form.theme || { ...defaultTheme },
    });
    setSelectedFieldId(null);
    setActiveView('studio');
    setStudioTab('builder');
  };

  // Add field from Palette
  const handleAddFieldFromPalette = (type: any, label: string) => {
    if (!currentForm) return;
    const newField: FormField = {
      id: `f-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      label: label || 'New Question',
      placeholder: type === 'number' ? '500000' : 'Enter response...',
      required: type !== 'heading' && type !== 'divider' && type !== 'textarea',
      width: type === 'heading' || type === 'divider' || type === 'textarea' ? 'full' : 'half',
      options: type === 'select' || type === 'radio' ? ['Option 1', 'Option 2', 'Option 3'] : undefined,
    };

    const updated = {
      ...currentForm,
      fields: [...currentForm.fields, newField],
    };
    setCurrentForm(updated);
    setSelectedFieldId(newField.id);
  };

  // Drag and drop reordering & palette dragging
  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
    setDraggedPaletteType(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (targetIndex: number) => {
    if (!currentForm) return;

    if (draggedPaletteType) {
      const comp = componentPalette.find((c) => c.type === draggedPaletteType);
      const newField: FormField = {
        id: `f-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: draggedPaletteType as any,
        label: comp?.label || 'New Question',
        placeholder: draggedPaletteType === 'number' ? '500000' : 'Enter response...',
        required: draggedPaletteType !== 'heading' && draggedPaletteType !== 'divider' && draggedPaletteType !== 'textarea',
        width: draggedPaletteType === 'heading' || draggedPaletteType === 'divider' || draggedPaletteType === 'textarea' ? 'full' : 'half',
        options: draggedPaletteType === 'select' || draggedPaletteType === 'radio' ? ['Option 1', 'Option 2', 'Option 3'] : undefined,
      };

      const list = [...currentForm.fields];
      const insertAt = Math.min(Math.max(0, targetIndex), list.length);
      list.splice(insertAt, 0, newField);
      setCurrentForm({ ...currentForm, fields: list });
      setSelectedFieldId(newField.id);
      setDraggedPaletteType(null);
      setDragOverIndex(null);
      return;
    }

    if (draggedItemIndex !== null) {
      const list = [...currentForm.fields];
      const item = list.splice(draggedItemIndex, 1)[0];
      const insertAt = Math.min(Math.max(0, targetIndex), list.length);
      list.splice(insertAt, 0, item);
      setCurrentForm({ ...currentForm, fields: list });
      setDraggedItemIndex(null);
      setDragOverIndex(null);
    }
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    if (!currentForm) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= currentForm.fields.length) return;
    const list = [...currentForm.fields];
    const temp = list[index];
    list[index] = list[newIndex];
    list[newIndex] = temp;
    setCurrentForm({ ...currentForm, fields: list });
  };

  const handleDeleteField = (fieldId: string) => {
    if (!currentForm) return;
    setCurrentForm({
      ...currentForm,
      fields: currentForm.fields.filter((f) => f.id !== fieldId),
    });
    if (selectedFieldId === fieldId) setSelectedFieldId(null);
  };

  const handleDuplicateField = (field: FormField) => {
    if (!currentForm) return;
    const copy: FormField = {
      ...field,
      id: `f-${Date.now()}`,
      label: `${field.label} (Copy)`,
    };
    const list = [...currentForm.fields, copy];
    setCurrentForm({ ...currentForm, fields: list });
    setSelectedFieldId(copy.id);
  };

  // Delete entire form
  const handleDeleteForm = async (formId: string, formTitle: string) => {
    if (!confirm(`Are you sure you want to delete the form "${formTitle}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/forms/${formId}?workspaceId=${workspace.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        if (currentForm?.id === formId) {
          setCurrentForm(null);
          setActiveView('list');
        }
        fetchForms();
      } else {
        alert(data.error || 'Failed to delete form');
      }
    } catch {
      alert('Failed to delete form');
    }
  };

  // Save current form changes
  const handleSaveStudioForm = async () => {
    if (!currentForm) return;
    setSaving(true);

    try {
      const existing = forms.find((f) => f.id === currentForm.id);
      let res;
      if (existing) {
        res = await fetch(`/api/forms/${currentForm.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...currentForm,
            workspaceId: workspace.id,
            actorId: currentUser.id,
            actorName: currentUser.name,
            actorRole: currentUser.role,
          }),
        });
      } else {
        res = await fetch('/api/forms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...currentForm,
            workspaceId: workspace.id,
            actorId: currentUser.id,
            actorName: currentUser.name,
            actorRole: currentUser.role,
          }),
        });
      }

      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to save form');
      setCurrentForm(json.data);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3000);
      fetchForms();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const selectedField = currentForm?.fields.find((f) => f.id === selectedFieldId);

  // -------------------------------------------------------------
  // VIEW 1: FORMS LIST VIEW
  // -------------------------------------------------------------
  if (activeView === 'list') {
    return (
      <div className="space-y-6">
        {/* Title & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FormInput className="w-6 h-6 text-blue-600" />
              Lead Intake Form Studio (Fillout-Style Builder)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Design custom borrower intake forms with drag-and-drop, set alert notification emails, and embed into any website.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateNewForm}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-4 h-4" /> Open Form Studio
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
            [1, 2, 3].map((i) => <div key={i} className="h-52 bg-slate-100 rounded-xl animate-pulse" />)
          ) : forms.length === 0 ? (
            <div className="col-span-full p-12 bg-white rounded-xl border border-slate-200 text-center text-slate-500">
              <FormInput className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-sm text-slate-800">No custom forms designed yet</h3>
              <p className="text-xs text-slate-400 mt-1">Open the Studio to design your first custom form.</p>
              <button
                onClick={handleCreateNewForm}
                className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-xs hover:bg-blue-700"
              >
                Launch Studio Builder
              </button>
            </div>
          ) : (
            forms.map((form) => (
              <div
                key={form.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          form.status === 'Published'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {form.status}
                      </span>
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {form.submissionsCount || 0} Submissions
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteForm(form.id, form.title)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                      title="Delete this form"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 leading-snug">{form.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{form.description}</p>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-800">
                      <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="text-[11px] truncate">
                        Alerts To: <strong>{form.notificationEmail}</strong>
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {form.fields?.length || 0} configured components & inputs
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <button
                    onClick={() => handleEditForm(form)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs shadow-xs transition"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-400" /> Customize in Studio
                  </button>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <a
                      href={`/f/${form.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg border border-slate-200 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-blue-600" /> View
                    </a>

                    <button
                      onClick={() => {
                        handleEditForm(form);
                        setStudioTab('embed');
                      }}
                      className="flex items-center justify-center gap-1 py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg border border-indigo-200 transition"
                    >
                      <Code className="w-3.5 h-3.5" /> Embed
                    </button>

                    <button
                      onClick={() => handleDeleteForm(form.id, form.title)}
                      className="flex items-center justify-center gap-1 py-1.5 px-2 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-lg border border-red-200 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: FILLOUT-STYLE STUDIO / BUILDER
  // -------------------------------------------------------------
  if (!currentForm) return null;

  const currentTheme = currentForm.theme || defaultTheme;

  return (
    <div className="-m-4 lg:-m-8 flex flex-col h-[calc(100vh-4rem)] bg-slate-100 overflow-hidden">
      {/* Studio Top Navigation Bar */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('list')}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
          >
            <ChevronLeft className="w-4 h-4" /> All Forms
          </button>

          <div className="h-4 w-px bg-slate-200" />

          {/* Form Title Inline */}
          <input
            type="text"
            value={currentForm.title}
            onChange={(e) => setCurrentForm({ ...currentForm, title: e.target.value })}
            className="font-bold text-sm text-slate-900 bg-transparent hover:bg-slate-50 px-2 py-1 rounded outline-none border border-transparent hover:border-slate-300 focus:border-blue-600 focus:bg-white"
          />
        </div>

        {/* Center Tabs: Builder | Settings | Preview | Embed */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
          {[
            { id: 'builder', label: 'Builder Studio', icon: Layers },
            { id: 'settings', label: 'Email & Settings', icon: Mail },
            { id: 'preview', label: 'Preview', icon: Eye },
            { id: 'embed', label: 'Embed & Share', icon: Code },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = studioTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStudioTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition ${
                  active ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Action: Publish / Save */}
        <div className="flex items-center gap-2">
          {saveToast && (
            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-600" /> Saved!
            </span>
          )}

          <select
            value={currentForm.status}
            onChange={(e) => setCurrentForm({ ...currentForm, status: e.target.value as any })}
            className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white font-medium"
          >
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
          </select>

          <button
            onClick={() => handleDeleteForm(currentForm.id, currentForm.title)}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg border border-red-200 transition"
            title="Delete this form"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-600" />
            <span>Delete</span>
          </button>

          <button
            onClick={handleSaveStudioForm}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Publish Form'}
          </button>
        </div>
      </header>

      {/* ----------------------------------------------------------- */}
      {/* TAB 1: BUILDER STUDIO (Palette + Live Canvas + Inspector)   */}
      {/* ----------------------------------------------------------- */}
      {studioTab === 'builder' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Component Palette */}
          <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto">
            <div className="p-3 border-b border-slate-100 bg-slate-50">
              <span className="font-bold text-xs text-slate-800 uppercase tracking-wider block">
                Fields & Inputs Library
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">Drag to canvas or click to insert</p>
            </div>

            <div className="p-3 space-y-1.5">
              {componentPalette.map((comp) => {
                const Icon = comp.icon;
                return (
                  <div
                    key={comp.type}
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', comp.type);
                      setDraggedPaletteType(comp.type);
                      setDraggedItemIndex(null);
                    }}
                    onDragEnd={() => {
                      setDraggedPaletteType(null);
                      setDragOverIndex(null);
                    }}
                    onClick={() => handleAddFieldFromPalette(comp.type, comp.label)}
                    className="w-full flex items-center gap-2.5 p-2 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-left transition group shadow-2xs cursor-grab active:cursor-grabbing select-none"
                  >
                    <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center shrink-0 transition">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-xs text-slate-800 group-hover:text-blue-700 flex items-center justify-between">
                        <span>{comp.label}</span>
                        <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-400" />
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{comp.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Center Canvas: Live Interactive WYSIWYG Editor */}
          <main className="flex-1 bg-slate-100 overflow-y-auto p-6 flex flex-col items-center">
            {/* Canvas Header Subtitle */}
            <div className="w-full max-w-xl mb-3 flex items-center justify-between text-xs text-slate-500">
              <span>Click any field on the canvas to inspect & configure properties</span>
              <span className="font-mono text-[11px]">{currentForm.fields.length} Components</span>
            </div>

            {/* The Live Form Sheet */}
            <div
              className={`w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5 transition-all`}
            >
              {/* Form Title & Description on Canvas */}
              <div
                onClick={() => setSelectedFieldId(null)}
                className={`p-3 rounded-xl cursor-pointer transition border ${
                  selectedFieldId === null ? 'border-blue-400 bg-blue-50/20' : 'border-transparent hover:border-slate-200'
                }`}
              >
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">{currentForm.title}</h2>
                <p className="text-xs text-slate-500 mt-1">{currentForm.description}</p>
              </div>

              {/* Dynamic Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentForm.fields.map((field, idx) => {
                  const isSelected = selectedFieldId === field.id;
                  const isFull = field.width === 'full';

                  return (
                    <div
                      key={field.id}
                      className={isFull ? 'sm:col-span-2' : 'sm:col-span-1'}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={(e) => {
                        e.stopPropagation();
                        handleDrop(idx);
                      }}
                    >
                      {/* Insertion line indicator */}
                      {dragOverIndex === idx && (
                        <div className="h-1 bg-blue-500 rounded-full my-1.5 shadow-sm animate-pulse" />
                      )}

                      <div
                        draggable={true}
                        onDragStart={() => handleDragStart(idx)}
                        onDragEnd={() => {
                          setDraggedItemIndex(null);
                          setDragOverIndex(null);
                        }}
                        onClick={() => setSelectedFieldId(field.id)}
                        className={`relative group p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/10 shadow-xs'
                            : 'border-slate-200 hover:border-slate-400 bg-white'
                        }`}
                      >
                        {/* Drag handle & Actions on Hover / Selection */}
                        <div
                          className={`absolute -top-3 right-2 flex items-center gap-1 bg-white border border-slate-200 rounded-md shadow-xs px-1.5 py-0.5 text-xs transition-opacity z-10 ${
                            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          <div className="p-1 text-slate-400 cursor-grab active:cursor-grabbing hover:text-slate-600" title="Drag to reorder">
                            <GripVertical className="w-3 h-3" />
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveField(idx, 'up');
                            }}
                            disabled={idx === 0}
                            className="p-1 hover:text-blue-600 disabled:opacity-20"
                            title="Move up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveField(idx, 'down');
                            }}
                            disabled={idx === currentForm.fields.length - 1}
                            className="p-1 hover:text-blue-600 disabled:opacity-20"
                            title="Move down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateField(field);
                            }}
                            className="p-1 hover:text-blue-600"
                            title="Duplicate"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteField(field.id);
                            }}
                            className="p-1 hover:text-red-600"
                            title="Delete field"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Rendering based on component type */}
                        {field.type === 'heading' ? (
                          <div className="py-1">
                            <h3 className="font-bold text-sm text-slate-900">{field.label}</h3>
                            {field.helpText && <p className="text-[11px] text-slate-500">{field.helpText}</p>}
                          </div>
                        ) : field.type === 'divider' ? (
                          <hr className="my-2 border-slate-200" />
                        ) : (
                          <div className="space-y-1 text-xs">
                            <label className="block font-semibold text-slate-800">
                              {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>

                            {field.helpText && <p className="text-[10px] text-slate-400">{field.helpText}</p>}

                            {field.type === 'textarea' ? (
                              <div className="p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-400 text-xs">
                                {field.placeholder || 'Long paragraph text area...'}
                              </div>
                            ) : field.type === 'select' ? (
                              <div className="p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 text-xs flex items-center justify-between">
                                <span>{field.options?.[0] || 'Select option...'}</span>
                                <ChevronRight className="w-3 h-3 rotate-90 text-slate-400" />
                              </div>
                            ) : field.type === 'radio' ? (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {field.options?.map((opt, oIdx) => (
                                  <span
                                    key={oIdx}
                                    className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-700 text-xs font-medium"
                                  >
                                    {opt}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <div className="p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-400 text-xs truncate">
                                {field.placeholder || `Enter ${field.label}...`}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Dropzone at bottom of form */}
                <div
                  onDragOver={(e) => handleDragOver(e, currentForm.fields.length)}
                  onDrop={(e) => {
                    e.stopPropagation();
                    handleDrop(currentForm.fields.length);
                  }}
                  className={`col-span-1 sm:col-span-2 p-3.5 border-2 border-dashed rounded-xl text-center transition ${
                    dragOverIndex === currentForm.fields.length || draggedPaletteType !== null
                      ? 'border-blue-500 bg-blue-50/50 text-blue-700 font-medium'
                      : 'border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 text-xs">
                    <Plus className="w-4 h-4 text-blue-600" />
                    <span>Drop component here or click items on the left palette to insert</span>
                  </div>
                </div>
              </div>

              {/* Submit Button on Canvas (Customizable) */}
              <div
                onClick={() => setSelectedFieldId('button-theme')}
                className={`pt-3 border-t border-slate-100 cursor-pointer p-2 rounded-xl border ${
                  selectedFieldId === 'button-theme' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-transparent hover:border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>Submit Button Styling (Click to edit text, color, size)</span>
                </div>
                <button
                  type="button"
                  style={{ backgroundColor: currentTheme.primaryColor }}
                  className={`w-full text-white font-semibold transition shadow-xs flex items-center justify-center gap-2 ${
                    currentTheme.buttonRadius
                  } ${
                    currentTheme.buttonSize === 'sm'
                      ? 'py-1.5 px-3 text-xs'
                      : currentTheme.buttonSize === 'lg'
                      ? 'py-3.5 px-6 text-sm'
                      : 'py-2.5 px-4 text-xs'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  {currentTheme.buttonText}
                </button>
              </div>
            </div>
          </main>

          {/* Right Panel: Inspector & Properties Panel */}
          <aside className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-y-auto">
            {selectedField ? (
              // FIELD INSPECTOR
              <div className="p-4 space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                    Question Properties
                  </span>
                  <button
                    onClick={() => setSelectedFieldId(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Question Label *</label>
                  <input
                    type="text"
                    value={selectedField.label}
                    onChange={(e) => {
                      const idx = currentForm.fields.findIndex((f) => f.id === selectedField.id);
                      if (idx !== -1) {
                        const list = [...currentForm.fields];
                        list[idx] = { ...list[idx], label: e.target.value };
                        setCurrentForm({ ...currentForm, fields: list });
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-semibold text-slate-900"
                  />
                </div>

                {selectedField.type !== 'heading' && selectedField.type !== 'divider' && (
                  <>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Placeholder Text</label>
                      <input
                        type="text"
                        value={selectedField.placeholder || ''}
                        onChange={(e) => {
                          const idx = currentForm.fields.findIndex((f) => f.id === selectedField.id);
                          if (idx !== -1) {
                            const list = [...currentForm.fields];
                            list[idx] = { ...list[idx], placeholder: e.target.value };
                            setCurrentForm({ ...currentForm, fields: list });
                          }
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Help / Subtitle Note</label>
                      <input
                        type="text"
                        value={selectedField.helpText || ''}
                        onChange={(e) => {
                          const idx = currentForm.fields.findIndex((f) => f.id === selectedField.id);
                          if (idx !== -1) {
                            const list = [...currentForm.fields];
                            list[idx] = { ...list[idx], helpText: e.target.value };
                            setCurrentForm({ ...currentForm, fields: list });
                          }
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-slate-800"
                      />
                    </div>

                    {/* Width setting (Fillout layout feature) */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Field Width on Canvas</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const idx = currentForm.fields.findIndex((f) => f.id === selectedField.id);
                            if (idx !== -1) {
                              const list = [...currentForm.fields];
                              list[idx] = { ...list[idx], width: 'half' };
                              setCurrentForm({ ...currentForm, fields: list });
                            }
                          }}
                          className={`py-1.5 px-2 border rounded-lg font-medium text-xs ${
                            selectedField.width === 'half'
                              ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                              : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          50% (Half Width)
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const idx = currentForm.fields.findIndex((f) => f.id === selectedField.id);
                            if (idx !== -1) {
                              const list = [...currentForm.fields];
                              list[idx] = { ...list[idx], width: 'full' };
                              setCurrentForm({ ...currentForm, fields: list });
                            }
                          }}
                          className={`py-1.5 px-2 border rounded-lg font-medium text-xs ${
                            selectedField.width === 'full'
                              ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                              : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          100% (Full Width)
                        </button>
                      </div>
                    </div>

                    {/* Required toggle */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="font-semibold text-slate-800">Required Response</span>
                      <input
                        type="checkbox"
                        checked={selectedField.required}
                        onChange={(e) => {
                          const idx = currentForm.fields.findIndex((f) => f.id === selectedField.id);
                          if (idx !== -1) {
                            const list = [...currentForm.fields];
                            list[idx] = { ...list[idx], required: e.target.checked };
                            setCurrentForm({ ...currentForm, fields: list });
                          }
                        }}
                        className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                      />
                    </div>
                  </>
                )}

                {/* Options List Editor for Select / Radio */}
                {(selectedField.type === 'select' || selectedField.type === 'radio') && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <label className="block font-semibold text-slate-700">Dropdown Choices</label>
                    <div className="space-y-1.5">
                      {selectedField.options?.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const idx = currentForm.fields.findIndex((f) => f.id === selectedField.id);
                              if (idx !== -1) {
                                const list = [...currentForm.fields];
                                const updatedOpts = [...(list[idx].options || [])];
                                updatedOpts[oIdx] = e.target.value;
                                list[idx] = { ...list[idx], options: updatedOpts };
                                setCurrentForm({ ...currentForm, fields: list });
                              }
                            }}
                            className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const idx = currentForm.fields.findIndex((f) => f.id === selectedField.id);
                              if (idx !== -1) {
                                const list = [...currentForm.fields];
                                const updatedOpts = (list[idx].options || []).filter((_, i) => i !== oIdx);
                                list[idx] = { ...list[idx], options: updatedOpts };
                                setCurrentForm({ ...currentForm, fields: list });
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => {
                          const idx = currentForm.fields.findIndex((f) => f.id === selectedField.id);
                          if (idx !== -1) {
                            const list = [...currentForm.fields];
                            const updatedOpts = [...(list[idx].options || []), `Option ${(list[idx].options?.length || 0) + 1}`];
                            list[idx] = { ...list[idx], options: updatedOpts };
                            setCurrentForm({ ...currentForm, fields: list });
                          }
                        }}
                        className="text-blue-600 hover:underline font-semibold flex items-center gap-1 pt-1"
                      >
                        <Plus className="w-3 h-3" /> Add Choice
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : selectedFieldId === 'button-theme' ? (
              // SUBMIT BUTTON & THEME INSPECTOR
              <div className="p-4 space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-blue-600" /> Submit Button Styling
                  </span>
                  <button onClick={() => setSelectedFieldId(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Button Text</label>
                  <input
                    type="text"
                    value={currentTheme.buttonText}
                    onChange={(e) =>
                      setCurrentForm({
                        ...currentForm,
                        theme: { ...currentTheme, buttonText: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Button Color Theme</label>
                  <div className="grid grid-cols-3 gap-2">
                    {colorOptions.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() =>
                          setCurrentForm({
                            ...currentForm,
                            theme: { ...currentTheme, primaryColor: c.hex },
                          })
                        }
                        style={{ backgroundColor: c.hex }}
                        className={`h-9 rounded-lg text-white font-semibold text-[10px] flex items-center justify-center transition shadow-2xs ${
                          currentTheme.primaryColor === c.hex ? 'ring-2 ring-offset-2 ring-slate-900 font-bold' : ''
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Button Size</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['sm', 'md', 'lg'] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() =>
                          setCurrentForm({
                            ...currentForm,
                            theme: { ...currentTheme, buttonSize: sz },
                          })
                        }
                        className={`py-1.5 border rounded-lg font-semibold uppercase text-[11px] ${
                          currentTheme.buttonSize === sz ? 'bg-blue-50 border-blue-600 text-blue-700' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Corner Roundness</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'rounded-md', label: 'Slight' },
                      { id: 'rounded-xl', label: 'Rounded' },
                      { id: 'rounded-full', label: 'Pill' },
                    ].map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() =>
                          setCurrentForm({
                            ...currentForm,
                            theme: { ...currentTheme, buttonRadius: r.id as any },
                          })
                        }
                        className={`py-1.5 border rounded-lg font-semibold text-[11px] ${
                          currentTheme.buttonRadius === r.id ? 'bg-blue-50 border-blue-600 text-blue-700' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // FORM GENERAL SETTINGS IN INSPECTOR
              <div className="p-4 space-y-4 text-xs">
                <div className="pb-3 border-b border-slate-100">
                  <span className="font-bold text-xs text-slate-800 uppercase tracking-wider block">
                    Form Settings
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Select any question on canvas to edit it</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Form Title</label>
                  <input
                    type="text"
                    value={currentForm.title}
                    onChange={(e) => setCurrentForm({ ...currentForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subtitle / Description</label>
                  <textarea
                    rows={2}
                    value={currentForm.description}
                    onChange={(e) => setCurrentForm({ ...currentForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-slate-800"
                  />
                </div>

                {/* Email Notification Setting */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                  <label className="block font-bold text-blue-900 text-xs">
                    📧 Submission Notification Email
                  </label>
                  <input
                    type="email"
                    value={currentForm.notificationEmail}
                    onChange={(e) => setCurrentForm({ ...currentForm, notificationEmail: e.target.value })}
                    placeholder="your-email@brokerage.com"
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg outline-none bg-white font-medium text-slate-900"
                  />
                  <p className="text-[10px] text-blue-700 leading-relaxed">
                    Lead submissions are recorded and forwarded directly to this email address.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setSelectedFieldId('button-theme')}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold flex items-center justify-between"
                  >
                    <span>Customize Button Color & Size</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* TAB 2: EMAIL & SETTINGS TAB                                 */}
      {/* ----------------------------------------------------------- */}
      {studioTab === 'settings' && (
        <div className="flex-1 bg-slate-100 overflow-y-auto p-8 flex justify-center">
          <div className="max-w-xl w-full bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6 text-xs">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Form Notification & Integration Settings</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure where lead responses land and how your team is alerted.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-blue-600" /> Notification Recipient Email *
                </label>
                <input
                  type="email"
                  required
                  value={currentForm.notificationEmail}
                  onChange={(e) => setCurrentForm({ ...currentForm, notificationEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white font-medium text-slate-900"
                />
                <p className="text-[11px] text-slate-500">
                  Every time a client submits, an automated lead package is delivered to this address.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mortgage File Creation Status</label>
                <input
                  type="text"
                  readOnly
                  value="Stage: Setup (Automatic Pipeline Entry)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-600 font-medium"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Submissions automatically create an active loan file in your MortgageLevels dashboard under the Setup queue.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDeleteForm(currentForm.id, currentForm.title)}
                  className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-lg text-xs border border-red-200 transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Delete Form Permanently</span>
                </button>

                <button
                  onClick={handleSaveStudioForm}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs shadow-xs"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* TAB 3: LIVE PREVIEW TAB (Desktop & Mobile Simulation)        */}
      {/* ----------------------------------------------------------- */}
      {studioTab === 'preview' && (
        <div className="flex-1 bg-slate-100 overflow-y-auto p-6 flex flex-col items-center">
          {/* Device Toggles */}
          <div className="mb-4 flex items-center bg-white p-1 rounded-lg border border-slate-200 text-xs font-semibold shadow-2xs">
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md ${
                previewDevice === 'desktop' ? 'bg-slate-900 text-white' : 'text-slate-600'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" /> Desktop (100%)
            </button>
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md ${
                previewDevice === 'mobile' ? 'bg-slate-900 text-white' : 'text-slate-600'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" /> Mobile Phone (375px)
            </button>
          </div>

          <div
            className={`bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-5 transition-all ${
              previewDevice === 'mobile' ? 'w-[375px]' : 'max-w-xl w-full'
            }`}
          >
            <div>
              <h2 className="text-xl font-bold text-slate-900">{currentForm.title}</h2>
              {currentForm.description && <p className="text-xs text-slate-500 mt-1">{currentForm.description}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {currentForm.fields.map((field) => (
                <div
                  key={field.id}
                  className={field.width === 'full' || previewDevice === 'mobile' ? 'sm:col-span-2' : 'sm:col-span-1'}
                >
                  {field.type === 'heading' ? (
                    <h3 className="font-bold text-sm text-slate-900 pt-2">{field.label}</h3>
                  ) : field.type === 'divider' ? (
                    <hr className="my-2 border-slate-200" />
                  ) : (
                    <div className="space-y-1">
                      <label className="block font-semibold text-slate-800">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                        placeholder={field.placeholder || ''}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white text-slate-800 text-xs font-medium"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              style={{ backgroundColor: currentTheme.primaryColor }}
              className={`w-full text-white font-semibold transition shadow-xs flex items-center justify-center gap-2 ${
                currentTheme.buttonRadius
              } ${
                currentTheme.buttonSize === 'sm'
                  ? 'py-1.5 px-3 text-xs'
                  : currentTheme.buttonSize === 'lg'
                  ? 'py-3.5 px-6 text-sm'
                  : 'py-2.5 px-4 text-xs'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              {currentTheme.buttonText}
            </button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* TAB 4: EMBED & SHARE TAB (iFrame code & direct link)         */}
      {/* ----------------------------------------------------------- */}
      {studioTab === 'embed' && (
        <div className="flex-1 bg-slate-100 overflow-y-auto p-8 flex justify-center">
          <div className="max-w-2xl w-full bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6 text-xs">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Embed & Share Form</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Use this form on your brokerage website or share the standalone link with clients.
              </p>
            </div>

            <div className="space-y-4">
              {/* Direct Link */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block font-bold text-slate-900 text-xs">
                  Direct Public Link (Share with clients)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`http://localhost:3000/f/${currentForm.id}`}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 font-mono text-xs select-all outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`http://localhost:3000/f/${currentForm.id}`);
                      alert('Copied direct link!');
                    }}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs shrink-0 transition"
                  >
                    Copy Link
                  </button>
                  <a
                    href={`/f/${currentForm.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 rounded-lg shrink-0 transition"
                    title="Open live in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Embed Code */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-indigo-600" /> Website Embed Code (iFrame Widget)
                </label>
                <textarea
                  readOnly
                  rows={3}
                  value={`<iframe src="http://localhost:3000/f/${currentForm.id}" width="100%" height="750" frameborder="0" style="border:none; border-radius:12px; box-shadow:0 4px 16px rgba(0,0,0,0.06);"></iframe>`}
                  className="w-full p-3 border border-slate-300 rounded-lg bg-slate-900 text-emerald-400 font-mono text-[11px] select-all outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `<iframe src="http://localhost:3000/f/${currentForm.id}" width="100%" height="750" frameborder="0" style="border:none; border-radius:12px; box-shadow:0 4px 16px rgba(0,0,0,0.06);"></iframe>`
                    );
                    alert('Copied embed snippet! Paste this into WordPress, Webflow, or Squarespace.');
                  }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs shadow-xs transition"
                >
                  Copy Website Embed Code
                </button>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 space-y-1 text-xs">
                <strong className="block font-bold">Live Synchronization Notice:</strong>
                <p className="text-[11px] leading-relaxed text-blue-800">
                  When a client fills out this embedded form on your website, a new loan file is instantly generated in your MortgageLevels dashboard under the Setup stage, and a notification is dispatched to <strong>{currentForm.notificationEmail}</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FormsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Form Studio...</div>}>
      <FormsContent />
    </Suspense>
  );
}
