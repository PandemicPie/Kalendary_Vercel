import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUser } from '@/lib/db-adapter';
import { hashPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password e nome sono obbligatori' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La password deve essere almeno 6 caratteri' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await getUser(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email già registrata' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const result = await createUser(email, hashedPassword, name);
    const userId = result.lastInsertRowid || result.id;

    // Generate token
    const token = generateToken(userId, email);

    // Return user data and token
    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        name,
      },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Errore durante la registrazione' },
      { status: 500 }
    );
  }
}
