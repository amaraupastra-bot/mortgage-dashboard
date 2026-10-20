import { NextRequest, NextResponse } from 'next/server';
import {
  getConditions,
  createCondition,
  updateCondition,
  getLoanById,
  logActivity,
  recalculateLoanReadiness,
  linkDocumentToCondition,
} from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || 'ws-apex-101';
    const loanId = searchParams.get('loanId') || undefined;

    const conditions = getConditions(workspaceId, loanId);
    return NextResponse.json({ success: true, data: conditions });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const workspaceId = body.workspaceId || 'ws-apex-101';
    const actorId = body.actorId || 'usr-1';
    const actorName = body.actorName || 'Sarah Jenkins';
    const actorRole = body.actorRole || 'ADMIN';

    if (!body.loanId || !body.title || !body.dueDate) {
      return NextResponse.json(
        { success: false, error: 'Loan ID, title, and due date are required.' },
        { status: 400 }
      );
    }

    const loan = getLoanById(workspaceId, body.loanId);

    const condition = createCondition(workspaceId, {
      loanId: body.loanId,
      title: body.title.trim(),
      description: body.description || '',
      source: body.source || 'Lender Initial',
      status: body.status || 'Open',
      ownerId: body.ownerId,
      ownerName: body.ownerName,
      dueDate: body.dueDate,
      linkedDocumentIds: body.linkedDocumentIds || [],
    });

    if (body.linkedDocumentIds && body.linkedDocumentIds.length > 0) {
      for (const docId of body.linkedDocumentIds) {
        linkDocumentToCondition(docId, condition.id);
      }
    }

    recalculateLoanReadiness(workspaceId, body.loanId);

    logActivity(workspaceId, {
      loanId: body.loanId,
      loanNumber: loan?.loanNumber,
      actorId,
      actorName,
      actorRole,
      action: 'CONDITION_ADDED',
      entityType: 'CONDITION',
      entityId: condition.id,
      details: `Added requirement condition: "${condition.title}" (${condition.source})`,
    });

    return NextResponse.json({ success: true, data: condition });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    const workspaceId = body.workspaceId || 'ws-apex-101';
    const actorId = body.actorId || 'usr-1';
    const actorName = body.actorName || 'Sarah Jenkins';
    const actorRole = body.actorRole || 'ADMIN';

    if (!id) {
      return NextResponse.json({ success: false, error: 'Condition ID required' }, { status: 400 });
    }

    // Check if resolving: requires review notes or confirmation
    if (updates.status === 'Resolved') {
      updates.resolvedAt = new Date().toISOString();
      updates.resolvedById = actorId;
      if (!updates.resolutionNotes) {
        updates.resolutionNotes = `Signed off by ${actorName} (${actorRole})`;
      }
    }

    const updated = updateCondition(workspaceId, id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Condition not found' }, { status: 404 });
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
      action: updates.status === 'Resolved' ? 'CONDITION_RESOLVED' : 'CONDITION_UPDATED',
      entityType: 'CONDITION',
      entityId: updated.id,
      details: updates.status === 'Resolved' 
        ? `Condition marked resolved: "${updated.title}" - ${updates.resolutionNotes}`
        : `Updated condition "${updated.title}" status to ${updated.status}`,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
