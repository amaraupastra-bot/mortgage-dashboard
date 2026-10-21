import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, createUser, updateUser, logActivity } from '@/lib/db';
import { UserRole } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || 'login';
    const workspaceId = body.workspaceId || 'ws-apex-101';

    const users = getAllUsers(workspaceId);

    if (action === 'login') {
      const email = (body.email || '').toLowerCase().trim();
      const user = users.find((u) => u.email.toLowerCase() === email);

      if (!user) {
        // If demo email or unrecognized, provide helpful fallback
        return NextResponse.json(
          {
            success: false,
            error: 'No active team member account found for this email. Check your invitation link or select a demo persona below.',
          },
          { status: 404 }
        );
      }

      if (!user.active) {
        return NextResponse.json(
          {
            success: false,
            error: 'This team member account has been deactivated by the Brokerage Administrator.',
          },
          { status: 403 }
        );
      }

      logActivity(workspaceId, {
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: 'USER_UPDATED',
        entityType: 'USER',
        entityId: user.id,
        details: `User signed in: ${user.name} (${user.role})`,
      });

      return NextResponse.json({ success: true, data: user });
    }

    if (action === 'accept-invite') {
      const email = (body.email || '').toLowerCase().trim();
      const name = (body.name || '').trim();
      const role: UserRole = body.role || 'LOAN_OFFICER';
      const token = body.token;

      if (!email || !name) {
        return NextResponse.json(
          { success: false, error: 'Full name and email are required to accept invitation.' },
          { status: 400 }
        );
      }

      // Check if user already exists
      let existingUser = users.find((u) => u.email.toLowerCase() === email);

      if (existingUser) {
        // Activate and update
        const updated = updateUser(workspaceId, existingUser.id, {
          name,
          role,
          active: true,
        });

        logActivity(workspaceId, {
          actorId: existingUser.id,
          actorName: name,
          actorRole: role,
          action: 'USER_UPDATED',
          entityType: 'USER',
          entityId: existingUser.id,
          details: `Invited user activated account & completed password setup: ${name} (${role}) via token ${token || 'direct'}`,
        });

        return NextResponse.json({ success: true, data: updated || existingUser });
      }

      // Create new user in workspace
      const newUser = createUser(workspaceId, {
        name,
        email,
        role,
        active: true,
      });

      logActivity(workspaceId, {
        actorId: newUser.id,
        actorName: newUser.name,
        actorRole: newUser.role,
        action: 'USER_INVITED',
        entityType: 'USER',
        entityId: newUser.id,
        details: `New team member onboarded via invitation link: ${newUser.name} (${newUser.role})`,
      });

      return NextResponse.json({ success: true, data: newUser });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
