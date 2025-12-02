import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db-adapter';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e password sono obbligatori' },
        { status: 400 }
      );
    }

    // Get user
    const user: any = await getUser(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Credenziali non valide' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Credenziali non valide' },
        { status: 401 }
      );
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    // Parse JSON fields
    const interests = user.interests ? JSON.parse(user.interests) : [];
    const goals = user.goals ? JSON.parse(user.goals) : [];
    const schoolHours = user.school_hours ? JSON.parse(user.school_hours) : null;
    const dayHours = user.day_hours ? JSON.parse(user.day_hours) : null;

    // Return user data and token
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        interests,
        goals,
        isStudent: user.is_student === true || user.is_student === 1,
        weekType: user.week_type,
        schoolHours,
        dayHours,
        onboardingCompleted: true,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Errore durante il login' },
      { status: 500 }
    );
  }
}
