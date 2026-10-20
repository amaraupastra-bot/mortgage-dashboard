import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSettings, logActivity } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || 'ws-apex-101';

    const settings = getSettings(workspaceId);
    return NextResponse.json({ success: true, data: settings });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const workspaceId = body.workspaceId || 'ws-apex-101';
    const actorId = body.actorId || 'usr-1';
    const actorName = body.actorName || 'Sarah Jenkins';
    const actorRole = body.actorRole || 'ADMIN';

    // Only Admin can update workspace settings
    if (actorRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only Brokerage Admins may modify workspace settings.' },
        { status: 403 }
      );
    }

    const updated = updateSettings(workspaceId, body);

    logActivity(workspaceId, {
      actorId,
      actorName,
      actorRole,
      action: 'SETTINGS_UPDATED',
      entityType: 'SETTINGS',
      entityId: workspaceId,
      details: `Updated workspace configuration (AI Provider: ${updated.aiProvider}, Retention: ${updated.dataRetentionDays} days)`,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
