import { NextRequest, NextResponse } from 'next/server';
import {
  getLoanById,
  updateLoan,
  getConditions,
  getDocuments,
  getExceptions,
  getTasks,
  getActivityLogs,
  logActivity,
  recalculateLoanReadiness,
} from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || 'ws-apex-101';

    const loan = getLoanById(workspaceId, id);
    if (!loan) {
      return NextResponse.json({ success: false, error: 'Loan not found or unauthorized' }, { status: 404 });
    }

    const conditions = getConditions(workspaceId, id);
    const documents = getDocuments(workspaceId, id);
    const exceptions = getExceptions(workspaceId, id);
    const tasks = getTasks(workspaceId, id);
    const activityLogs = getActivityLogs(workspaceId, id, 30);

    return NextResponse.json({
      success: true,
      data: {
        loan,
        conditions,
        documents,
        exceptions,
        tasks,
        activityLogs,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const workspaceId = body.workspaceId || 'ws-apex-101';
    const actorId = body.actorId || 'usr-1';
    const actorName = body.actorName || 'Sarah Jenkins';
    const actorRole = body.actorRole || 'ADMIN';

    const existing = getLoanById(workspaceId, id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Loan not found' }, { status: 404 });
    }

    const updated = updateLoan(workspaceId, id, body);
    recalculateLoanReadiness(workspaceId, id);

    if (body.stage && body.stage !== existing.stage) {
      logActivity(workspaceId, {
        loanId: id,
        loanNumber: existing.loanNumber,
        actorId,
        actorName,
        actorRole,
        action: 'STAGE_UPDATED',
        entityType: 'LOAN',
        entityId: id,
        details: `Stage updated from ${existing.stage} to ${body.stage}`,
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
