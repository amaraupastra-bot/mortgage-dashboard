import { NextRequest, NextResponse } from 'next/server';
import {
  getLoanById,
  getConditions,
  getDocuments,
  getExceptions,
  createException,
  logActivity,
  recalculateLoanReadiness,
} from '@/lib/db';
import { runLoanReadinessChecks } from '@/lib/readiness-checker';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { loanId, syncExceptions, actorId, actorName, actorRole } = body;
    const workspaceId = body.workspaceId || 'ws-apex-101';

    if (!loanId) {
      return NextResponse.json({ success: false, error: 'Loan ID required' }, { status: 400 });
    }

    const loan = getLoanById(workspaceId, loanId);
    if (!loan) {
      return NextResponse.json({ success: false, error: 'Loan not found' }, { status: 404 });
    }

    const conditions = getConditions(workspaceId, loanId);
    const documents = getDocuments(workspaceId, loanId);
    const existingExceptions = getExceptions(workspaceId, loanId);

    const report = runLoanReadinessChecks(loan, conditions, documents, existingExceptions);

    // If syncExceptions is requested, promote findings that are not already exceptions
    let createdExceptionsCount = 0;
    if (syncExceptions) {
      for (const finding of report.findings) {
        const isDuplicate = existingExceptions.some(
          (e) => e.issue.toLowerCase() === finding.issue.toLowerCase() && e.status !== 'Resolved'
        );

        if (!isDuplicate && (finding.severity === 'Urgent' || finding.severity === 'High')) {
          createException(workspaceId, {
            loanId: loan.id,
            loanNumber: loan.loanNumber,
            borrowerDisplayName: loan.borrowerDisplayName,
            issue: finding.issue,
            evidence: finding.evidence,
            category: finding.category,
            severity: finding.severity,
            severityReason: finding.severityReason,
            status: 'Open',
            isAiSuggested: finding.isAiSuggested,
            aiConfidence: finding.aiConfidence,
            responsibleUserId: loan.processorId || loan.loanOfficerId,
            responsibleUserName: loan.processorName || loan.loanOfficerName,
            recommendedAction: finding.recommendedAction,
          });
          createdExceptionsCount++;
        }
      }
    }

    recalculateLoanReadiness(workspaceId, loanId);

    logActivity(workspaceId, {
      loanId: loan.id,
      loanNumber: loan.loanNumber,
      actorId: actorId || 'usr-1',
      actorName: actorName || 'System',
      actorRole: actorRole || 'ADMIN',
      action: 'READINESS_CHECK_EXECUTED',
      entityType: 'LOAN',
      entityId: loan.id,
      details: `Executed File Readiness Check: Score ${report.score}%, ${report.findings.length} findings, ${createdExceptionsCount} exceptions synced.`,
    });

    return NextResponse.json({
      success: true,
      data: {
        report,
        createdExceptionsCount,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
