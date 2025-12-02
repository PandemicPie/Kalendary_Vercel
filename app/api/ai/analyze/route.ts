import { NextRequest, NextResponse } from 'next/server';
import { getUserActivities } from '@/lib/db-adapter';
import { getUserFromToken } from '@/lib/auth';
import { analyzeCalendar } from '@/lib/ai-service';

function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  return getUserFromToken(token);
}

// POST /api/ai/analyze - Analyze user's calendar with AI
export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { userProfile } = await request.json();

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

    // Analyze with AI
    const analysis = await analyzeCalendar(userProfile, activities);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json(
      { error: 'Errore durante l\'analisi AI' },
      { status: 500 }
    );
  }
}
