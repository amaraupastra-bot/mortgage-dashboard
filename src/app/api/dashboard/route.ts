import { NextRequest, NextResponse } from 'next/server';
import {
  getLoans,
  getExceptions,
  getTasks,
  getDocuments,
  getActivityLogs,
  getUsers,
} from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || 'ws-apex-101';

    const loans = getLoans(workspaceId);
    const exceptions = getExceptions(workspaceId);
    const tasks = getTasks(workspaceId);
    const documents = getDocuments(workspaceId);
    const activities = getActivityLogs(workspaceId, undefined, 10);
    const users = getUsers(workspaceId);

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Active loans (non-archived)
    const activeLoans = loans.filter((l) => l.stage !== 'Archived');
    // Blocked loans
    const blockedLoans = loans.filter(
      (l) => l.stage === 'Blocked' || l.hasBlockingExceptions
    );
    // Ready for Review loans
    const readyForReviewLoans = loans.filter((l) => l.stage === 'Ready for Broker Review');

    // Documents awaiting review
    const docsAwaitingReview = documents.filter(
      (d) => d.status === 'Review Required' || d.status === 'Processing'
    );

    // Overdue tasks
    const overdueTasks = tasks.filter((t) => {
      if (t.status === 'Completed' || t.status === 'Cancelled') return false;
      const dueDate = new Date(t.dueDate);
      return dueDate < now;
    });

    // Open exceptions
    const openExceptions = exceptions.filter(
      (e) => e.status === 'Open' || e.status === 'Assigned' || e.status === 'In Progress'
    );

    // Priority issues (Urgent or High)
    const priorityIssues = openExceptions.filter(
      (e) => e.severity === 'Urgent' || e.severity === 'High'
    );

    // Team workload distribution
    const teamWorkload = users.map((u) => {
      const assignedLoans = loans.filter(
        (l) => (l.loanOfficerId === u.id || l.processorId === u.id) && l.stage !== 'Archived'
      ).length;
      const assignedTasks = tasks.filter(
        (t) => t.assigneeId === u.id && t.status !== 'Completed' && t.status !== 'Cancelled'
      ).length;
      const assignedExceptions = exceptions.filter(
        (e) => e.responsibleUserId === u.id && e.status !== 'Resolved' && e.status !== 'Dismissed'
      ).length;

      return {
        userId: u.id,
        name: u.name,
        role: u.role,
        assignedLoans,
        assignedTasks,
        assignedExceptions,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          activeLoansCount: activeLoans.length,
          blockedLoansCount: blockedLoans.length,
          readyForReviewCount: readyForReviewLoans.length,
          docsAwaitingReviewCount: docsAwaitingReview.length,
          overdueTasksCount: overdueTasks.length,
          openExceptionsCount: openExceptions.length,
          priorityIssuesCount: priorityIssues.length,
        },
        priorityIssues: priorityIssues.slice(0, 5),
        recentActivity: activities,
        teamWorkload,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
