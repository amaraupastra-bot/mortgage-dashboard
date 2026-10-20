import { NextRequest, NextResponse } from 'next/server';
import {
  getExceptions,
  createException,
  updateException,
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
    const severity = searchParams.get('severity') || undefined;
    const category = searchParams.get('category') || undefined;
    const ownerId = searchParams.get('ownerId') || undefined;

    let exceptions = getExceptions(workspaceId, loanId);

    if (status && status !== 'all') {
      exceptions = exceptions.filter((e) => e.status === status);
    }
    if (severity && severity !== 'all') {
      exceptions = exceptions.filter((e) => e.severity === severity);
    }
    if (category && category !== 'all') {
      exceptions = exceptions.filter((e) => e.category === category);
    }
    if (ownerId && ownerId !== 'all') {
      exceptions = exceptions.filter((e) => e.responsibleUserId === ownerId);
    }

    // Transparent initial priority sorting: Urgent -> High -> Normal -> Low, then by date
    const severityWeight: Record<string, number> = { Urgent: 4, High: 3, Normal: 2, Low: 1 };
    exceptions.sort((a, b) => {
      const weightDiff = (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0);
      if (weightDiff !== 0) return weightDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({ success: true, data: exceptions });
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

    if (!body.loanId || !body.issue || !body.evidence) {
      return NextResponse.json(
        { success: false, error: 'Loan ID, issue summary, and evidence reference are required.' },
        { status: 400 }
      );
    }

    const loan = getLoanById(workspaceId, body.loanId);

    const newExc = createException(workspaceId, {
      loanId: body.loanId,
      loanNumber: loan?.loanNumber || 'UNKNOWN',
      borrowerDisplayName: loan?.borrowerDisplayName || 'Unknown Borrower',
      issue: body.issue.trim(),
      evidence: body.evidence.trim(),
      category: body.category || 'Requirement Coverage',
      severity: body.severity || 'Normal',
      severityReason: body.severityReason || 'Standard file readiness review checkpoint.',
      status: 'Open',
      isAiSuggested: body.isAiSuggested ?? false,
      aiConfidence: body.aiConfidence,
      responsibleUserId: body.responsibleUserId,
      responsibleUserName: body.responsibleUserName,
      dueDate: body.dueDate,
      recommendedAction: body.recommendedAction || 'Review document and clear blocker.',
    });

    recalculateLoanReadiness(workspaceId, body.loanId);

    logActivity(workspaceId, {
      loanId: body.loanId,
      loanNumber: loan?.loanNumber,
      actorId,
      actorName,
      actorRole,
      action: 'EXCEPTION_FLAGGED',
      entityType: 'EXCEPTION',
      entityId: newExc.id,
      details: `Flagged exception [${newExc.severity}]: ${newExc.issue}`,
    });

    return NextResponse.json({ success: true, data: newExc });
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
      return NextResponse.json({ success: false, error: 'Exception ID required' }, { status: 400 });
    }

    // Resolving requires a reason or linked resolution step
    if (updates.status === 'Resolved') {
      updates.resolvedAt = new Date().toISOString();
      updates.resolvedById = actorId;
      updates.resolvedByName = actorName;
      if (!updates.resolutionReason) {
        updates.resolutionReason = 'Resolved following document verification and loan review.';
      }
    }

    const updated = updateException(workspaceId, id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Exception not found' }, { status: 404 });
    }

    if (updated.loanId) {
      recalculateLoanReadiness(workspaceId, updated.loanId);
    }

    logActivity(workspaceId, {
      loanId: updated.loanId,
      loanNumber: updated.loanNumber,
      actorId,
      actorName,
      actorRole,
      action: updates.status === 'Resolved' ? 'EXCEPTION_RESOLVED' : 'EXCEPTION_UPDATED',
      entityType: 'EXCEPTION',
      entityId: updated.id,
      details: updates.status === 'Resolved'
        ? `Resolved exception: "${updated.issue}" (${updates.resolutionReason})`
        : `Updated exception status to ${updated.status} / Assigned to ${updated.responsibleUserName || 'Team'}`,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
