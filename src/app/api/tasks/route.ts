import { NextRequest, NextResponse } from 'next/server';
import {
  getTasks,
  createTask,
  updateTask,
  getLoanById,
  logActivity,
} from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || 'ws-apex-101';
    const loanId = searchParams.get('loanId') || undefined;
    const status = searchParams.get('status') || undefined;
    const assigneeId = searchParams.get('assigneeId') || undefined;
    const priority = searchParams.get('priority') || undefined;

    let tasks = getTasks(workspaceId, loanId);

    if (status && status !== 'all') {
      tasks = tasks.filter((t) => t.status === status);
    }
    if (assigneeId && assigneeId !== 'all') {
      tasks = tasks.filter((t) => t.assigneeId === assigneeId);
    }
    if (priority && priority !== 'all') {
      tasks = tasks.filter((t) => t.priority === priority);
    }

    // Sort by due date ascending
    tasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return NextResponse.json({ success: true, data: tasks });
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

    if (!body.loanId || !body.title || !body.dueDate) {
      return NextResponse.json(
        { success: false, error: 'Loan ID, task title, and due date are required.' },
        { status: 400 }
      );
    }

    const loan = getLoanById(workspaceId, body.loanId);

    const newTask = createTask(workspaceId, {
      loanId: body.loanId,
      loanNumber: loan?.loanNumber || 'UNKNOWN',
      borrowerDisplayName: loan?.borrowerDisplayName || 'Unknown Borrower',
      title: body.title.trim(),
      description: body.description || '',
      assigneeId: body.assigneeId,
      assigneeName: body.assigneeName,
      dueDate: body.dueDate,
      priority: body.priority || 'Normal',
      status: 'To Do',
      conditionId: body.conditionId,
      documentId: body.documentId,
      exceptionId: body.exceptionId,
    });

    logActivity(workspaceId, {
      loanId: body.loanId,
      loanNumber: loan?.loanNumber,
      actorId,
      actorName,
      actorRole,
      action: 'TASK_CREATED',
      entityType: 'TASK',
      entityId: newTask.id,
      details: `Created task "${newTask.title}" assigned to ${newTask.assigneeName || 'Unassigned'}`,
    });

    return NextResponse.json({ success: true, data: newTask });
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
      return NextResponse.json({ success: false, error: 'Task ID required' }, { status: 400 });
    }

    if (updates.status === 'Completed') {
      updates.completedAt = new Date().toISOString();
    }

    const updated = updateTask(workspaceId, id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    logActivity(workspaceId, {
      loanId: updated.loanId,
      loanNumber: updated.loanNumber,
      actorId,
      actorName,
      actorRole,
      action: updates.status === 'Completed' ? 'TASK_COMPLETED' : 'TASK_UPDATED',
      entityType: 'TASK',
      entityId: updated.id,
      details: updates.status === 'Completed'
        ? `Completed task "${updated.title}"`
        : `Updated task "${updated.title}" to ${updated.status}`,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
