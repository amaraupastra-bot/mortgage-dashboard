import { NextRequest, NextResponse } from 'next/server';
import {
  getAllUsers,
  createUser,
  updateUser,
  logActivity,
} from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || 'ws-apex-101';

    const users = getAllUsers(workspaceId);
    return NextResponse.json({ success: true, data: users });
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

    // Only Admin can invite team members
    if (actorRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only Brokerage Admins may invite team members.' },
        { status: 403 }
      );
    }

    if (!body.name || !body.email || !body.role) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and role are required.' },
        { status: 400 }
      );
    }

    const newUser = createUser(workspaceId, {
      name: body.name.trim(),
      email: body.email.toLowerCase().trim(),
      role: body.role,
      active: true,
    });

    logActivity(workspaceId, {
      actorId,
      actorName,
      actorRole,
      action: 'USER_INVITED',
      entityType: 'USER',
      entityId: newUser.id,
      details: `Invited new team member: ${newUser.name} (${newUser.email}) as ${newUser.role}`,
    });

    return NextResponse.json({ success: true, data: newUser });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    const workspaceId = body.workspaceId || 'ws-apex-101';
    const actorId = body.actorId || 'usr-1';
    const actorName = body.actorName || 'Sarah Jenkins';
    const actorRole = body.actorRole || 'ADMIN';

    if (actorRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only Brokerage Admins may modify team access.' },
        { status: 403 }
      );
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
    }

    const updated = updateUser(workspaceId, id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    logActivity(workspaceId, {
      actorId,
      actorName,
      actorRole,
      action: 'USER_UPDATED',
      entityType: 'USER',
      entityId: updated.id,
      details: `Updated team member ${updated.name} (Active: ${updated.active}, Role: ${updated.role})`,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
