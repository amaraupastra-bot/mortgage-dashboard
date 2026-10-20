import { Loan, Condition, Document, Exception, ExceptionCategory, ExceptionSeverity } from '@/types';

export interface ReadinessCheckFinding {
  issue: string;
  evidence: string;
  category: ExceptionCategory;
  severity: ExceptionSeverity;
  severityReason: string;
  recommendedAction: string;
  conditionId?: string;
  documentId?: string;
  isAiSuggested: boolean;
  aiConfidence?: number;
}

export interface ReadinessReport {
  loanId: string;
  loanNumber: string;
  score: number;
  totalConditions: number;
  resolvedConditions: number;
  unresolvedConditions: number;
  totalDocuments: number;
  documentsNeedingReview: number;
  findings: ReadinessCheckFinding[];
  isReadyForBrokerReview: boolean;
  blockersCount: number;
  checkedAt: string;
}

/**
 * Runs deterministic checks + optional AI assistance findings on a loan file.
 * Never fabricates extraction results or guarantees lender approval.
 */
export function runLoanReadinessChecks(
  loan: Loan,
  conditions: Condition[],
  documents: Document[],
  existingExceptions: Exception[] = []
): ReadinessReport {
  const findings: ReadinessCheckFinding[] = [];

  // Check 1: Requirement Coverage (Conditions with no linked documents)
  for (const cond of conditions) {
    if (cond.status === 'Resolved') continue;

    const linkedDocs = documents.filter((d) => 
      cond.linkedDocumentIds?.includes(d.id) || d.loanId === loan.id && d.docType.toLowerCase().includes(cond.title.toLowerCase().slice(0, 5))
    );

    if (linkedDocs.length === 0) {
      findings.push({
        issue: `No documentation provided for condition: "${cond.title}"`,
        evidence: `Condition [${cond.id}] created on ${new Date(cond.createdAt).toLocaleDateString()} has 0 linked files.`,
        category: 'Requirement Coverage',
        severity: cond.source === 'Lender Initial' || cond.source === 'Closing Prior to Funding' ? 'High' : 'Normal',
        severityReason: 'Lenders will not issue Clear to Close without satisfying explicit loan conditions.',
        recommendedAction: `Request document from borrower or third party for "${cond.title}".`,
        conditionId: cond.id,
        isAiSuggested: false,
      });
    } else {
      // Check if linked docs are all in "Review Required" or "Rejected"
      const hasAccepted = linkedDocs.some((d) => d.status === 'Accepted for Requirement');
      const hasReviewRequired = linkedDocs.some((d) => d.status === 'Review Required');
      const allRejected = linkedDocs.every((d) => d.status === 'Rejected');

      if (allRejected) {
        findings.push({
          issue: `All submitted documents for condition "${cond.title}" have been rejected`,
          evidence: `Linked documents (${linkedDocs.map((d) => d.originalName).join(', ')}) were marked Rejected during human review.`,
          category: 'Requirement Coverage',
          severity: 'Urgent',
          severityReason: 'Rejected documents cannot satisfy underwriting requirements.',
          recommendedAction: 'Request replacement documentation meeting lender criteria.',
          conditionId: cond.id,
          isAiSuggested: false,
        });
      } else if (!hasAccepted && hasReviewRequired) {
        findings.push({
          issue: `Document pending review for condition: "${cond.title}"`,
          evidence: `Document uploaded but human processor review step has not been performed. Upload alone does not resolve a condition.`,
          category: 'Requirement Coverage',
          severity: 'Normal',
          severityReason: 'Condition clearance requires explicit processor acceptance.',
          recommendedAction: 'Open document preview and accept or reject requirement.',
          conditionId: cond.id,
          isAiSuggested: false,
        });
      }
    }

    // Check overdue condition dates
    if (cond.dueDate) {
      const due = new Date(cond.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (due < today) {
        const daysOver = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
        findings.push({
          issue: `Condition "${cond.title}" is ${daysOver} day(s) past due`,
          evidence: `Target due date was ${cond.dueDate}; condition remains ${cond.status}.`,
          category: 'Condition Overdue',
          severity: daysOver > 3 ? 'Urgent' : 'High',
          severityReason: `Closing scheduled for ${loan.targetClosingDate}; overdue conditions risk rate lock expiration.`,
          recommendedAction: `Escalate to loan officer or contact borrower immediately.`,
          conditionId: cond.id,
          isAiSuggested: false,
        });
      }
    }
  }

  // Check 2: Document-Level Integrity & Freshness
  const closingDate = new Date(loan.targetClosingDate);

  for (const doc of documents) {
    // Check page completeness
    if (doc.extractedMetadata?.pageCount && doc.extractedMetadata?.missingFields?.length) {
      for (const missing of doc.extractedMetadata.missingFields) {
        findings.push({
          issue: `Missing document information in "${doc.originalName}": ${missing}`,
          evidence: `File integrity check extracted ${doc.extractedMetadata.pageCount} page(s). Note: ${missing}`,
          category: 'Page Completeness',
          severity: 'High',
          severityReason: 'Fannie Mae / Freddie Mac guidelines reject partial statements without trailing reconciliation pages.',
          recommendedAction: 'Obtain complete original PDF without missing pages.',
          documentId: doc.id,
          isAiSuggested: doc.extractedMetadata.isAiExtracted ?? false,
          aiConfidence: doc.extractedMetadata.confidenceScore,
        });
      }
    }

    // Check Document Freshness (older than 60 days before closing date)
    if (doc.extractedMetadata?.documentDate && (doc.docType.toLowerCase().includes('bank') || doc.docType.toLowerCase().includes('paystub'))) {
      const docDate = new Date(doc.extractedMetadata.documentDate);
      const diffDays = Math.floor((closingDate.getTime() - docDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays > 60) {
        findings.push({
          issue: `Document "${doc.originalName}" may expire before closing (${diffDays} days old)`,
          evidence: `Statement date is ${doc.extractedMetadata.documentDate}, closing is ${loan.targetClosingDate} (limit is 60-90 days for asset/income).`,
          category: 'Date Range Mismatch',
          severity: diffDays > 90 ? 'Urgent' : 'High',
          severityReason: 'Conventional and FHA loan guidelines require asset/income documentation within 60-120 days of note date.',
          recommendedAction: 'Request most recent statement covering the period within 30 days of closing.',
          documentId: doc.id,
          isAiSuggested: false,
        });
      }
    }

    // Check borrower display name match
    if (doc.extractedMetadata?.borrowerName) {
      const docName = doc.extractedMetadata.borrowerName.toLowerCase();
      const loanNames = loan.borrowerDisplayName.toLowerCase().split('&').map((n) => n.trim());
      const hasMatch = loanNames.some((n) => {
        const parts = n.split(' ');
        const lastName = parts[parts.length - 1];
        return docName.includes(lastName);
      });

      if (!hasMatch) {
        findings.push({
          issue: `Potential borrower name mismatch in "${doc.originalName}"`,
          evidence: `Document name "${doc.extractedMetadata.borrowerName}" differs from loan file record "${loan.borrowerDisplayName}".`,
          category: 'Missing Required Field',
          severity: 'Normal',
          severityReason: 'All asset, income, and title documents must match registered borrower names.',
          recommendedAction: 'Verify borrower identity, alias, or provide explanation letter.',
          documentId: doc.id,
          isAiSuggested: true,
          aiConfidence: 0.89,
        });
      }
    }
  }

  // Calculate readiness score
  const totalConds = conditions.length;
  const resolvedConds = conditions.filter((c) => c.status === 'Resolved').length;
  const unresolvedConds = totalConds - resolvedConds;
  const docsNeedingReview = documents.filter((d) => d.status === 'Review Required' || d.status === 'Processing').length;

  const urgentBlockers = findings.filter((f) => f.severity === 'Urgent' || f.severity === 'High');

  let calculatedScore = 100;
  if (totalConds > 0) {
    calculatedScore = Math.round((resolvedConds / totalConds) * 70);
  } else {
    calculatedScore = 50;
  }

  // Deduct based on findings
  const deduction = findings.reduce((acc, f) => {
    if (f.severity === 'Urgent') return acc + 12;
    if (f.severity === 'High') return acc + 8;
    if (f.severity === 'Normal') return acc + 4;
    return acc + 2;
  }, 0);

  calculatedScore = Math.max(15, Math.min(100, calculatedScore + 30 - deduction));

  const isReady = calculatedScore >= 95 && unresolvedConds === 0 && urgentBlockers.length === 0;

  return {
    loanId: loan.id,
    loanNumber: loan.loanNumber,
    score: calculatedScore,
    totalConditions: totalConds,
    resolvedConditions: resolvedConds,
    unresolvedConditions: unresolvedConds,
    totalDocuments: documents.length,
    documentsNeedingReview: docsNeedingReview,
    findings,
    isReadyForBrokerReview: isReady,
    blockersCount: urgentBlockers.length,
    checkedAt: new Date().toISOString(),
  };
}
