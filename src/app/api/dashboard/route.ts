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
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('userRole');

    let loans = getLoans(workspaceId);
    let exceptions = getExceptions(workspaceId);
    let tasks = getTasks(workspaceId);
    let documents = getDocuments(workspaceId);
    let activities = getActivityLogs(workspaceId, undefined, 10);
    const allUsers = getUsers(workspaceId);

    const isLoanOfficer = userRole === 'LOAN_OFFICER' && userId;
    const isProcessor = userRole === 'PROCESSOR' && userId;

    // Filter data specifically for Loan Officer's working files
    if (isLoanOfficer) {
      // Only loans assigned to this Loan Officer
      loans = loans.filter((l) => l.loanOfficerId === userId);
      const officerLoanIds = new Set(loans.map((l) => l.id));

      exceptions = exceptions.filter((e) => officerLoanIds.has(e.loanId));
      tasks = tasks.filter((t) => t.assigneeId === userId || officerLoanIds.has(t.loanId));
      documents = documents.filter((d) => officerLoanIds.has(d.loanId));
      activities = activities.filter((a) => (a.loanId && officerLoanIds.has(a.loanId)) || a.actorId === userId);
    } else if (isProcessor) {
      // Loan Processor focuses on active underwriting queue
      const processorLoans = loans.filter((l) => l.processorId === userId || l.stage === 'In Progress' || l.stage === 'Setup');
      const processorLoanIds = new Set(processorLoans.map((l) => l.id));
      tasks = tasks.filter((t) => t.assigneeId === userId || processorLoanIds.has(t.loanId));
    }

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

    // Team workload distribution (For Admin, show all; for Loan Officer, show only their profile)
    const workloadUsers = isLoanOfficer ? allUsers.filter((u) => u.id === userId) : allUsers;

    const teamWorkload = workloadUsers.map((u) => {
      const assignedLoans = getLoans(workspaceId).filter(
        (l) => (l.loanOfficerId === u.id || l.processorId === u.id) && l.stage !== 'Archived'
      ).length;
      const assignedTasks = getTasks(workspaceId).filter(
        (t) => t.assigneeId === u.id && t.status !== 'Completed' && t.status !== 'Cancelled'
      ).length;
      const assignedExceptions = getExceptions(workspaceId).filter(
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

    // Total dollar volume in working pipeline
    const totalPipelineVolume = activeLoans.reduce((sum, l) => sum + (l.loanAmount || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        isPersonalView: Boolean(isLoanOfficer),
        totalPipelineVolume,
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
