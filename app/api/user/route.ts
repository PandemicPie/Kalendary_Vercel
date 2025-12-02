import { NextRequest, NextResponse } from 'next/server';
import { getUser, updateUser } from '@/lib/db-adapter';
import { verifyToken } from '@/lib/auth';

// GET /api/user - Get current user profile
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Token mancante' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Token non valido' },
        { status: 401 }
      );
    }

    const user: any = await getUser(decoded.email);
    if (!user) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      );
    }

    // Parse JSON fields
    const interests = user.interests ? JSON.parse(user.interests) : [];
    const goals = user.goals ? JSON.parse(user.goals) : [];
    const schoolHours = user.school_hours ? JSON.parse(user.school_hours) : null;
    const dayHours = user.day_hours ? JSON.parse(user.day_hours) : null;

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
        onboardingCompleted: interests.length > 0 || goals.length > 0,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Errore durante il recupero del profilo' },
      { status: 500 }
    );
  }
}

// PUT /api/user - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Token mancante' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Token non valido' },
        { status: 401 }
      );
    }

    const user: any = await getUser(decoded.email);
    if (!user) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      );
    }

    const updates = await request.json();

    // Prepare update data
    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.interests !== undefined) updateData.interests = JSON.stringify(updates.interests);
    if (updates.goals !== undefined) updateData.goals = JSON.stringify(updates.goals);
    if (updates.isStudent !== undefined) updateData.is_student = updates.isStudent ? true : false;
    if (updates.weekType !== undefined) updateData.week_type = updates.weekType;
    if (updates.schoolHours !== undefined) updateData.school_hours = JSON.stringify(updates.schoolHours);
    if (updates.dayHours !== undefined) updateData.day_hours = JSON.stringify(updates.dayHours);

    await updateUser(user.id, updateData);

    // Get updated user
    const updatedUser: any = await getUser(decoded.email);
    const interests = updatedUser.interests ? JSON.parse(updatedUser.interests) : [];
    const goals = updatedUser.goals ? JSON.parse(updatedUser.goals) : [];
    const schoolHours = updatedUser.school_hours ? JSON.parse(updatedUser.school_hours) : null;
    const dayHours = updatedUser.day_hours ? JSON.parse(updatedUser.day_hours) : null;

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        interests,
        goals,
        isStudent: updatedUser.is_student === true || updatedUser.is_student === 1,
        weekType: updatedUser.week_type,
        schoolHours,
        dayHours,
        onboardingCompleted: true,
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Errore durante l\'aggiornamento del profilo' },
      { status: 500 }
    );
  }
}
