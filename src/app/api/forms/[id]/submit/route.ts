import { NextRequest, NextResponse } from 'next/server';
import { submitCustomForm } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const result = submitCustomForm(id, body);
    if (!result) {
      return NextResponse.json({ success: false, error: 'Form not found or inactive' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        loanNumber: result.loan.loanNumber,
        loanId: result.loan.id,
        borrowerName: result.loan.borrowerDisplayName,
        amount: result.loan.loanAmount,
        notificationSentTo: result.form.notificationEmail,
        submittedAt: result.submission.submittedAt,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
