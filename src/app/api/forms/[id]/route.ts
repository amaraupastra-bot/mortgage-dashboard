import { NextRequest, NextResponse } from 'next/server';
import { getFormById, updateCustomForm, deleteCustomForm, logActivity } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || 'ws-apex-101';

    const form = getFormById(workspaceId, id);
    if (!form) {
      return NextResponse.json({ success: false, error: 'Form not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: form });
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

    const updated = updateCustomForm(workspaceId, id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Form not found' }, { status: 404 });
    }

    logActivity(workspaceId, {
      actorId: body.actorId || 'usr-1',
      actorName: body.actorName || 'Sarah Jenkins',
      actorRole: body.actorRole || 'ADMIN',
      action: 'FORM_UPDATED' as any,
      entityType: 'SETTINGS',
      entityId: id,
      details: `Updated form "${updated.title}" (Status: ${updated.status}, Alert Email: ${updated.notificationEmail})`,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || 'ws-apex-101';

    const deleted = deleteCustomForm(workspaceId, id);
    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
