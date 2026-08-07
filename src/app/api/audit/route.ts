import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/audit — fetch audit logs
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');

    const where: any = {};
    if (action) where.action = action;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      }),
      db.auditLog.count({ where }),
    ]);

    return NextResponse.json({ logs, total });
  } catch (error) {
    console.error('Audit GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}

// POST /api/audit — create audit log entry
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, action, target, details } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    const log = await db.auditLog.create({
      data: {
        userId: userId || null,
        action,
        target: target || null,
        details: details || null,
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error('Audit POST error:', error);
    return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 });
  }
}