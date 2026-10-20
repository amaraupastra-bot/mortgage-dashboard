import { NextRequest, NextResponse } from 'next/server';
import {
  getDocuments,
  createDocument,
  updateDocument,
  linkDocumentToCondition,
  getLoanById,
  logActivity,
  recalculateLoanReadiness,
} from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || 'ws-apex-101';
    const loanId = searchParams.get('loanId') || undefined;
    const status = searchParams.get('status') || undefined;

    let docs = getDocuments(workspaceId, loanId);

    if (status && status !== 'all') {
      docs = docs.filter((d) => d.status === status);
    }

    return NextResponse.json({ success: true, data: docs });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const workspaceId = body.workspaceId || 'ws-apex-101';
    const actorId = body.actorId || 'usr-3';
    const actorName = body.actorName || 'Elena Ramos';
    const actorRole = body.actorRole || 'PROCESSOR';

    if (!body.loanId || !body.filename || !body.docType) {
      return NextResponse.json(
        { success: false, error: 'Loan ID, filename, and document type are required.' },
        { status: 400 }
      );
    }

    // Size limit check (Max 25MB standard for mortgage PDFs)
    const fileSize = body.fileSize || 1024 * 512;
    if (fileSize > 25 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File exceeds maximum allowed size of 25MB.' },
        { status: 400 }
      );
    }

    // Allowed mime types
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/tiff'];
    const mimeType = body.mimeType || 'application/pdf';
    if (!allowedTypes.includes(mimeType) && !body.filename.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { success: false, error: 'Invalid file format. Only PDF, PNG, JPG, and TIFF are accepted.' },
        { status: 400 }
      );
    }

    const loan = getLoanById(workspaceId, body.loanId);

    // Initial status on upload is 'Review Required' or 'Processing' (Upload does NOT auto-resolve condition)
    const newDoc = createDocument(workspaceId, {
      loanId: body.loanId,
      filename: body.filename.replace(/[^a-zA-Z0-9._-]/g, '_'),
      originalName: body.originalName || body.filename,
      docType: body.docType,
      fileSize,
      mimeType,
      status: 'Review Required',
      uploadedById: actorId,
      uploadedByName: actorName,
      storagePath: `/uploads/${body.loanId}/${body.filename}`,
      extractedMetadata: body.extractedMetadata || {
        documentDate: new Date().toISOString().split('T')[0],
        pageCount: body.pageCount || 1,
        borrowerName: loan?.borrowerDisplayName,
        isAiExtracted: false,
      },
    });

    if (body.conditionId) {
      linkDocumentToCondition(newDoc.id, body.conditionId);
    }

    recalculateLoanReadiness(workspaceId, body.loanId);

    logActivity(workspaceId, {
      loanId: body.loanId,
      loanNumber: loan?.loanNumber,
      actorId,
      actorName,
      actorRole,
      action: 'DOCUMENT_UPLOADED',
      entityType: 'DOCUMENT',
      entityId: newDoc.id,
      details: `Uploaded ${newDoc.docType} (${newDoc.originalName}) - awaiting human review`,
    });

    return NextResponse.json({ success: true, data: newDoc });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    const workspaceId = body.workspaceId || 'ws-apex-101';
    const actorId = body.actorId || 'usr-3';
    const actorName = body.actorName || 'Elena Ramos';
    const actorRole = body.actorRole || 'PROCESSOR';

    if (!id) {
      return NextResponse.json({ success: false, error: 'Document ID required' }, { status: 400 });
    }

    // Set reviewer info if decision is being made
    if (updates.status && updates.status !== 'Uploaded' && updates.status !== 'Processing') {
      updates.reviewerId = actorId;
      updates.reviewerName = actorName;
      updates.reviewedAt = new Date().toISOString();
    }

    const updated = updateDocument(workspaceId, id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    if (updated.loanId) {
      recalculateLoanReadiness(workspaceId, updated.loanId);
    }

    const loan = updated.loanId ? getLoanById(workspaceId, updated.loanId) : null;

    logActivity(workspaceId, {
      loanId: updated.loanId,
      loanNumber: loan?.loanNumber,
      actorId,
      actorName,
      actorRole,
      action: 'DOCUMENT_REVIEWED',
      entityType: 'DOCUMENT',
      entityId: updated.id,
      details: `Processor ${actorName} updated ${updated.originalName} status to "${updated.status}" ${updates.reviewerNotes ? `(${updates.reviewerNotes})` : ''}`,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
