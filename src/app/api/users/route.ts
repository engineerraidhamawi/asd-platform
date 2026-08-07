import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logAction } from '@/lib/audit';

// PATCH /api/users — update user (e.g., reset password)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, email, role, password } = body;
    if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    const data: any = {};
    if (name) data.name = name;
    if (email) data.email = email;
    if (role) data.role = role;
    if (password) {
      const { createHash } = await import('crypto');
      data.password = createHash('sha256').update(password + 'asd-salt-2024').digest('hex');
    }

    const user = await db.user.update({ where: { id }, data });
    logAction('USER_UPDATED', id, `Updated user: ${JSON.stringify(data)}`, body.adminId);

    const { password: _, ...safe } = user;
    return NextResponse.json(safe);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// GET /api/users — list all users
export async function GET() {
  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { patients: true, auditLogs: true } } },
    });
    const safeUsers = users.map(({ password: _, ...user }) => user);
    return NextResponse.json(safeUsers);
  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// DELETE /api/users?id=xxx — delete a user
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const adminId = searchParams.get('adminId');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id },
      include: { patients: { include: { sessions: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    for (const patient of user.patients) {
      for (const session of patient.sessions) {
        await db.assessment.deleteMany({ where: { sessionId: session.id } });
        await db.result.deleteMany({ where: { sessionId: session.id } });
      }
      await db.session.deleteMany({ where: { patientId: patient.id } });
    }
    await db.patient.deleteMany({ where: { createdById: id } });
    await db.auditLog.deleteMany({ where: { userId: id } });
    await db.user.delete({ where: { id } });

    logAction('USER_DELETED', id, `Deleted user: ${user.name} (${user.email})`, adminId || undefined);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}