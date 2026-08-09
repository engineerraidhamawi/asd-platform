import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logAction } from '@/lib/audit';

const VALID_ROLES = ['admin', 'doctor', 'monitor', 'patient'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role, createdById } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    if (role && !VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: Invalid role. Must be one of: {VALID_ROLES.join(', ')} }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'doctor',
      },
    });

    logAction('USER_CREATED', user.id, New {role || 'doctor'} user: {name} ({email}), createdById || user.id);

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}