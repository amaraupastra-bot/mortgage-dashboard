'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Document, DocumentStatus } from '@/types';
import { DocumentStatusBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import {
  FileText,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileClock,
  Upload,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  X,
} from 'lucide-react';

function DocumentsContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';

  const { workspace, currentUser } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewingDoc, setReviewingDoc] = useState<Document | null>(null);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ workspaceId: workspace.id });
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/documents?${params.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load documents');
      setDocuments(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [workspace.id, statusFilter]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const filteredDocs = documents.filter((doc) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      doc.originalName.toLowerCase().includes(term) ||
      doc.docType.toLowerCase().includes(term) ||
      doc.uploadedByName.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Document Inventory & Review Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Central repository of borrower files, extracted metadata, and processor requirement approvals.
          </p>
        </div>
        <button
          onClick={fetchDocuments}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search documents by filename, document type, or uploader..."
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
              <option value="all">All Review Statuses</option>
              <option value="Review Required">Review Required (Queue)</option>
              <option value="Processing">Processing</option>
              <option value="Accepted for Requirement">Accepted for Requirement</option>
              <option value="Rejected">Rejected</option>
              <option value="Superseded">Superseded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Document Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileClock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="font-bold text-sm text-slate-800">No documents found</h3>
            <p className="text-xs text-slate-400 mt-1">Review queue is empty or no files match the current search filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Document File</th>
                  <th className="py-3 px-4">Document Type</th>
                  <th className="py-3 px-4">Review Status</th>
                  <th className="py-3 px-4">Extracted Attributes</th>
                  <th className="py-3 px-4">Uploaded</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">{doc.originalName}</div>
                      <div className="text-[10px] text-slate-400">
                        {(doc.fileSize / 1024).toFixed(0)} KB • Version {doc.version}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{doc.docType}</span>
                    </td>

                    <td className="py-3 px-4">
                      <DocumentStatusBadge status={doc.status} />
                      {doc.reviewerNotes && (
                        <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-xs">{doc.reviewerNotes}</div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {doc.extractedMetadata ? (
                        <div className="text-[11px] space-y-0.5 text-slate-600">
                          {doc.extractedMetadata.documentDate && (
                            <div>Date: <strong className="text-slate-800">{doc.extractedMetadata.documentDate}</strong></div>
                          )}
                          {doc.extractedMetadata.missingFields && doc.extractedMetadata.missingFields.length > 0 && (
                            <div className="text-red-600 font-medium text-[10px] truncate max-w-xs">
                              {doc.extractedMetadata.missingFields[0]}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-medium">{doc.uploadedByName}</div>
                      <div className="text-[10px] text-slate-400">{formatDate(doc.uploadedAt)}</div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition"
                          title="Preview metadata & integrity"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setReviewingDoc(doc)}
                          className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded transition"
                        >
                          Review
                        </button>

                        <Link
                          href={`/loans/${doc.loanId}?tab=documents`}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition"
                          title="Open loan workspace"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Decision Modal */}
      {reviewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Processor Review Sign-Off</h3>
              <button onClick={() => setReviewingDoc(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              File: <strong className="text-slate-900 font-mono">{reviewingDoc.originalName}</strong>
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as any;
                try {
                  await fetch('/api/documents', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      workspaceId: workspace.id,
                      id: reviewingDoc.id,
                      status: form.status.value,
                      reviewerNotes: form.reviewerNotes.value,
                      actorId: currentUser.id,
                      actorName: currentUser.name,
                      actorRole: currentUser.role,
                    }),
                  });
                  setReviewingDoc(null);
                  fetchDocuments();
                } catch {
                  alert('Failed to update review status');
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Review Decision *</label>
                <select name="status" defaultValue="Accepted for Requirement" className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                  <option value="Accepted for Requirement">Accepted for Requirement</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Review Required">Needs Further Review</option>
                  <option value="Superseded">Superseded by Newer Version</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reviewer Notes</label>
                <textarea
                  name="reviewerNotes"
                  rows={2}
                  placeholder="e.g. Verified statement reflects required balance, all 6 pages present."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReviewingDoc(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 shadow-xs"
                >
                  Save Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900 font-mono">{previewDoc.originalName}</h3>
                <p className="text-xs text-slate-500">Secure Document Inspector</p>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-44 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center p-4 bg-slate-50">
              <FileText className="w-10 h-10 text-blue-600 mb-2" />
              <div className="text-xs font-bold text-slate-800">{previewDoc.filename}</div>
              <div className="text-[11px] text-slate-500 mt-1">
                Encrypted Private Storage: <code className="text-[10px] bg-slate-200 px-1 py-0.5 rounded">{previewDoc.storagePath}</code>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
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

export default function DocumentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading documents...</div>}>
      <DocumentsContent />
    </Suspense>
  );
}
