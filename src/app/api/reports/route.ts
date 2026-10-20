import { NextRequest, NextResponse } from 'next/server';
import {
  getLoans,
  getExceptions,
  getTasks,
  getDocuments,
  getConditions,
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
    const conditions = getConditions(workspaceId);
    const users = getUsers(workspaceId);

    const now = new Date();

    // 1. Open exceptions breakdown
    const openExceptions = exceptions.filter((e) => e.status !== 'Resolved' && e.status !== 'Dismissed');
    const severityBreakdown = {
      Urgent: openExceptions.filter((e) => e.severity === 'Urgent').length,
      High: openExceptions.filter((e) => e.severity === 'High').length,
      Normal: openExceptions.filter((e) => e.severity === 'Normal').length,
      Low: openExceptions.filter((e) => e.severity === 'Low').length,
    };

    const categoryBreakdown: Record<string, number> = {};
    for (const e of openExceptions) {
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + 1;
    }

    // 2. Task metrics
    const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
    const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    const overdueTasks = tasks.filter((t) => {
      if (t.status === 'Completed' || t.status === 'Cancelled') return false;
      return new Date(t.dueDate) < now;
    }).length;

    // 3. Review queue age (average days since documents entered review)
    const reviewQueueDocs = documents.filter((d) => d.status === 'Review Required' || d.status === 'Processing');
    let totalQueueDays = 0;
    for (const d of reviewQueueDocs) {
      const up = new Date(d.uploadedAt);
      const days = (now.getTime() - up.getTime()) / (1000 * 60 * 60 * 24);
      totalQueueDays += days;
    }
    const avgReviewQueueAgeDays = reviewQueueDocs.length > 0
      ? Number((totalQueueDays / reviewQueueDocs.length).toFixed(1))
      : 0;

    // 4. Time to resolution (for resolved exceptions)
    const resolvedExceptions = exceptions.filter((e) => e.status === 'Resolved' && e.resolvedAt);
    let totalResDays = 0;
    for (const e of resolvedExceptions) {
      const start = new Date(e.createdAt);
      const end = new Date(e.resolvedAt!);
      const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      totalResDays += days;
    }
    const avgResolutionTimeDays = resolvedExceptions.length > 0
      ? Number((totalResDays / resolvedExceptions.length).toFixed(1))
      : 1.5;

    // 5. Document issue rate
    const flaggedDocsCount = documents.filter((d) => d.status === 'Rejected' || (d.extractedMetadata?.missingFields && d.extractedMetadata.missingFields.length > 0)).length;
    const documentIssueRate = documents.length > 0
      ? Math.round((flaggedDocsCount / documents.length) * 100)
      : 0;

    // 6. Condition Clearance Rate
    const resolvedConditionsCount = conditions.filter((c) => c.status === 'Resolved').length;
    const conditionClearanceRate = conditions.length > 0
      ? Math.round((resolvedConditionsCount / conditions.length) * 100)
      : 0;

    // 7. Team member workload
    const teamWorkload = users.map((u) => {
      const userLoans = loans.filter((l) => (l.loanOfficerId === u.id || l.processorId === u.id) && l.stage !== 'Archived').length;
      const userTasks = tasks.filter((t) => t.assigneeId === u.id && t.status !== 'Completed' && t.status !== 'Cancelled').length;
      const userExceptions = exceptions.filter((e) => e.responsibleUserId === u.id && e.status !== 'Resolved' && e.status !== 'Dismissed').length;

      return {
        userId: u.id,
        name: u.name,
        role: u.role,
        activeLoans: userLoans,
        openTasks: userTasks,
        pendingExceptions: userExceptions,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        totalLoans: loans.length,
        activeLoans: loans.filter((l) => l.stage !== 'Archived').length,
        openExceptionsCount: openExceptions.length,
        severityBreakdown,
        categoryBreakdown,
        taskCompletionRate,
        overdueTasksCount: overdueTasks,
        avgReviewQueueAgeDays,
        avgResolutionTimeDays,
        documentIssueRate,
        conditionClearanceRate,
        teamWorkload,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
