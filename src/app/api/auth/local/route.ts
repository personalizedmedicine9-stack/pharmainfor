import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createHash, randomUUID } from 'crypto';

function hashPassword(password: string): string {
  return createHash('sha256').update(password + 'pharmainsight-local-salt').digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, password, displayName } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (action === 'signup') {
      // Check if user already exists
      const existing = await db.localUser.findUnique({ where: { email: cleanEmail } });
      if (existing) {
        return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
      }

      // Create new local user
      const user = await db.localUser.create({
        data: {
          id: randomUUID(),
          email: cleanEmail,
          passwordHash: hashPassword(password),
          displayName: displayName?.trim() || '',
        },
      });

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
        },
        authMode: 'local',
      });
    }

    if (action === 'signin') {
      // Find user
      const user = await db.localUser.findUnique({ where: { email: cleanEmail } });
      if (!user) {
        return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
      }

      // Verify password
      if (user.passwordHash !== hashPassword(password)) {
        return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
      }

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
        },
        authMode: 'local',
      });
    }

    return NextResponse.json({ error: 'Invalid action. Use "signin" or "signup".' }, { status: 400 });
  } catch (error: any) {
    console.error('[Local Auth] Error:', error.message);
    return NextResponse.json({ error: 'Authentication failed. Please try again.' }, { status: 500 });
  }
}
