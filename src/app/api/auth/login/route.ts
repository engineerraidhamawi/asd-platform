import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logAction } from '@/lib/audit';
import { createHash } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      logAction('LOGIN_FAILED', email, 'User not found');
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    let passwordValid = false;

    // Check if password is bcrypt hash (starts with $2)
    if (user.password.startsWith('')) {
      const bcrypt = await import('bcryptjs');
      passwordValid = await bcrypt.compare(password, user.password);
    } else {
      // Legacy SHA-256 fallback — check then auto-upgrade to bcrypt
      const hashedInput = createHash('sha256').update(password + 'asd-salt-2024').digest('hex');
      if (hashedInput === user.password) {
        passwordValid = true;
        // Upgrade to bcrypt
        const bcrypt = await import('bcryptjs');
        const newHash = await bcrypt.hash(password, 12);
        await db.user.update({ where: { id: user.id }, data: { password: newHash } });
      }
    }

    if (!passwordValid) {
      logAction('LOGIN_FAILED', user.id, Wrong password for {email}, user.id);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    logAction('LOGIN_SUCCESS', user.id, User {user.name} ({user.role}) logged in, user.id);

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}