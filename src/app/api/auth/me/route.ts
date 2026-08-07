import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'x-user-id header is required' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        patients: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}