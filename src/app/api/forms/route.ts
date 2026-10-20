import { NextRequest, NextResponse } from 'next/server';
import { getForms, createCustomForm, logActivity } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || 'ws-apex-101';

    const forms = getForms(workspaceId);
    return NextResponse.json({ success: true, data: forms });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const workspaceId = body.workspaceId || 'ws-apex-101';

    if (!body.title) {
      return NextResponse.json({ success: false, error: 'Form title is required.' }, { status: 400 });
    }

    const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const newForm = createCustomForm(workspaceId, {
      title: body.title.trim(),
      slug: slug || `form-${Date.now()}`,
      description: body.description || '',
      notificationEmail: body.notificationEmail || 'operations@apexlending.com',
      status: body.status || 'Published',
      fields: body.fields || [
        { id: `f-${Date.now()}-1`, type: 'text', label: 'Full Legal Name', required: true },
        { id: `f-${Date.now()}-2`, type: 'email', label: 'Email Address', required: true },
        { id: `f-${Date.now()}-3`, type: 'tel', label: 'Phone Number', required: true },
        { id: `f-${Date.now()}-4`, type: 'number', label: 'Loan Amount ($)', required: true },
      ],
    });

    logActivity(workspaceId, {
      actorId: body.actorId || 'usr-1',
      actorName: body.actorName || 'Sarah Jenkins',
      actorRole: body.actorRole || 'ADMIN',
      action: 'FORM_CREATED' as any,
      entityType: 'SETTINGS',
      entityId: newForm.id,
      details: `Created custom intake form: "${newForm.title}" (Notification email: ${newForm.notificationEmail})`,
    });

    return NextResponse.json({ success: true, data: newForm });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
