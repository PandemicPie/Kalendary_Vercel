import { NextRequest, NextResponse } from 'next/server';
import {
  getUserActivities,
  createActivity,
  updateActivity,
  deleteActivity,
} from '@/lib/db-adapter';
import { getUserFromToken } from '@/lib/auth';

function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  return getUserFromToken(token);
}

// GET - Fetch all activities for user
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const activities = await getUserActivities(user.userId);

    // Format activities (handles both SQLite 0/1 and PostgreSQL true/false)
    const formattedActivities = activities.map((activity: any) => ({
      id: activity.id.toString(),
      title: activity.title,
      description: activity.description,
      startTime: new Date(activity.start_time),
      endTime: new Date(activity.end_time),
      completed: activity.completed === true || activity.completed === 1,
      type: activity.type,
      category: activity.category,
      emoji: activity.emoji,
      recurring: activity.recurring ? (typeof activity.recurring === 'string' ? JSON.parse(activity.recurring) : activity.recurring) : null,
      examSubject: activity.exam_subject,
    }));

    return NextResponse.json({ activities: formattedActivities });
  } catch (error) {
    console.error('Get activities error:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero delle attività' },
      { status: 500 }
    );
  }
}

// POST - Create new activity
export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const activity = await request.json();

    const result = await createActivity(user.userId, {
      ...activity,
      startTime: new Date(activity.startTime).toISOString(),
      endTime: new Date(activity.endTime).toISOString(),
    });

    return NextResponse.json({
      success: true,
      activityId: result.lastInsertRowid || result.id,
    });
  } catch (error) {
    console.error('Create activity error:', error);
    return NextResponse.json(
      { error: 'Errore nella creazione dell\'attività' },
      { status: 500 }
    );
  }
}

// PUT - Update activity
export async function PUT(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { id, ...updates } = await request.json();

    // Format updates for database
    const dbUpdates: any = {};
    if (updates.title) dbUpdates.title = updates.title;
    if (updates.description !== undefined)
      dbUpdates.description = updates.description;
    if (updates.startTime)
      dbUpdates.start_time = new Date(updates.startTime).toISOString();
    if (updates.endTime)
      dbUpdates.end_time = new Date(updates.endTime).toISOString();
    if (updates.completed !== undefined)
      dbUpdates.completed = updates.completed ? true : false;
    if (updates.type) dbUpdates.type = updates.type;
    if (updates.category) dbUpdates.category = updates.category;

    await updateActivity(parseInt(id), user.userId, dbUpdates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update activity error:', error);
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento dell\'attività' },
      { status: 500 }
    );
  }
}

// DELETE - Delete activity
export async function DELETE(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID attività richiesto' },
        { status: 400 }
      );
    }

    await deleteActivity(parseInt(id), user.userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete activity error:', error);
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione dell\'attività' },
      { status: 500 }
    );
  }
}
