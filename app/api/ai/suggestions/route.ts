import { NextRequest, NextResponse } from 'next/server';
import { getUserActivities } from '@/lib/db-adapter';
import { getUserFromToken } from '@/lib/auth';
import { generateDailySuggestions, findDeadTime } from '@/lib/ai-service';

function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  return getUserFromToken(token);
}

// POST /api/ai/suggestions - Get daily AI suggestions
export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { userProfile, date } = await request.json();
    const targetDate = date ? new Date(date) : new Date();

    // Get user activities
    const dbActivities = await getUserActivities(user.userId);

    // Format activities (handles both SQLite 0/1 and PostgreSQL true/false)
    const activities = dbActivities.map((activity: any) => ({
      id: activity.id.toString(),
      title: activity.title,
      description: activity.description,
      startTime: new Date(activity.start_time),
      endTime: new Date(activity.end_time),
      completed: activity.completed === true || activity.completed === 1,
      type: activity.type,
      category: activity.category,
    }));

    // Generate suggestions
    const suggestions = await generateDailySuggestions(
      userProfile,
      activities,
      targetDate
    );

    // Find dead time for today
    const dayHours = userProfile.dayHours || { start: '07:00', end: '23:00' };
    const deadTimeSlots = findDeadTime(activities, targetDate, dayHours);

    return NextResponse.json({
      success: true,
      suggestions,
      deadTimeSlots,
    });
  } catch (error) {
    console.error('AI suggestions error:', error);
    return NextResponse.json(
      { error: 'Errore durante la generazione dei suggerimenti' },
      { status: 500 }
    );
  }
}
