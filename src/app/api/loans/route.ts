import { NextRequest, NextResponse } from 'next/server';
import { getLoans, createLoan, logActivity } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || 'ws-apex-101';
    const query = searchParams.get('query')?.toLowerCase();
    const stage = searchParams.get('stage');
    const ownerId = searchParams.get('ownerId');
    const hasBlockers = searchParams.get('hasBlockers');

    let loans = getLoans(workspaceId);

    if (query) {
      loans = loans.filter(
        (l) =>
          l.loanNumber.toLowerCase().includes(query) ||
          l.borrowerDisplayName.toLowerCase().includes(query) ||
          l.propertyAddress.toLowerCase().includes(query) ||
          l.lenderName.toLowerCase().includes(query)
      );
    }

    if (stage && stage !== 'all') {
      loans = loans.filter((l) => l.stage === stage);
    }

    if (ownerId && ownerId !== 'all') {
      loans = loans.filter((l) => l.loanOfficerId === ownerId || l.processorId === ownerId);
    }

    if (hasBlockers === 'true') {
      loans = loans.filter((l) => l.hasBlockingExceptions || l.stage === 'Blocked');
    }

    return NextResponse.json({ success: true, data: loans });
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

    // Required field validation
    if (!body.loanNumber || !body.borrowerDisplayName || !body.loanAmount || !body.targetClosingDate) {
      return NextResponse.json(
        { success: false, error: 'Loan number, borrower name, amount, and closing date are required.' },
        { status: 400 }
      );
    }

    const newLoan = createLoan(workspaceId, {
      loanNumber: body.loanNumber.toUpperCase().trim(),
      borrowerDisplayName: body.borrowerDisplayName.trim(),
      loanOfficerId: body.loanOfficerId || 'usr-2',
      loanOfficerName: body.loanOfficerName || 'David Miller',
      processorId: body.processorId || 'usr-3',
      processorName: body.processorName || 'Elena Ramos',
      stage: body.stage || 'Setup',
      loanAmount: Number(body.loanAmount),
      propertyAddress: body.propertyAddress || 'To be specified',
      propertyType: body.propertyType || 'Single Family Residence',
      targetClosingDate: body.targetClosingDate,
      lenderName: body.lenderName || 'TBD Wholesale Lender',
      loanProgram: body.loanProgram || 'Conventional 30-Year Fixed',
    });

    logActivity(workspaceId, {
      loanId: newLoan.id,
      loanNumber: newLoan.loanNumber,
      actorId,
      actorName,
      actorRole,
      action: 'LOAN_CREATED',
      entityType: 'LOAN',
      entityId: newLoan.id,
      details: `Created new loan file ${newLoan.loanNumber} for ${newLoan.borrowerDisplayName}`,
    });

    return NextResponse.json({ success: true, data: newLoan });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
