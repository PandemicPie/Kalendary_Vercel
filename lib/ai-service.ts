// AI Service for LM Studio integration

const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://localhost:1234';

interface Activity {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  completed: boolean;
  type: 'scheduled' | 'suggested' | 'routine' | 'exam';
  category?: string;
  emoji?: string;
  examSubject?: string;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval?: number;
    endDate?: Date;
  };
}

interface UserProfile {
  name: string;
  interests: string[];
  goals: string[];
  isStudent?: boolean | null;
  weekType?: 'short' | 'long' | null;
  schoolHours?: { start: string; end: string };
  dayHours?: { start: string; end: string };
}

interface AIAnalysisResult {
  deadTimeSlots: Array<{
    start: string;
    end: string;
    duration: number;
    suggestions: string[];
  }>;
  patterns: Array<{
    activity: string;
    frequency: string;
    recommendation: string;
  }>;
  suggestions: Array<{
    title: string;
    description: string;
    category: string;
    suggestedTime?: string;
    recurring?: string;
  }>;
}

/**
 * Analyzes user's calendar and generates intelligent suggestions
 */
export async function analyzeCalendar(
  user: UserProfile,
  activities: Activity[]
): Promise<AIAnalysisResult> {
  try {
    const systemPrompt = generateSystemPrompt(user);
    const userPrompt = generateCalendarAnalysisPrompt(user, activities);

    const response = await fetch(`${LM_STUDIO_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'local-model',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error('LM Studio API request failed');
    }

    const data = await response.json();
    const aiResponse = JSON.parse(data.choices[0].message.content);

    return aiResponse;
  } catch (error: any) {
    // LM Studio not available - use fallback (this is normal)
    if (error.cause?.code === 'ECONNREFUSED') {
      console.log('ℹ️ LM Studio non disponibile - uso suggerimenti fallback');
    } else {
      console.error('AI analysis error:', error);
    }
    // Return fallback suggestions if AI fails
    return generateFallbackSuggestions(user, activities);
  }
}

/**
 * Generates concise daily suggestions
 */
export async function generateDailySuggestions(
  user: UserProfile,
  activities: Activity[],
  date: Date
): Promise<string[]> {
  try {
    const systemPrompt = `Sei un assistente AI per Kalendary, un'app di calendario intelligente.
Il tuo compito è generare suggerimenti brevi, motivanti e actionable per l'utente.
Rispondi SOLO con un array JSON di stringhe (massimo 3 suggerimenti).
Ogni suggerimento deve essere:
- Breve (max 50 caratteri)
- Specifico e actionable
- Motivante ma non invadente
- Basato sugli interessi e obiettivi dell'utente
- PRIORITÀ ALTA: Se ci sono verifiche/interrogazioni imminenti, suggerisci di studiare/prepararsi`;

    const todayActivities = activities.filter(
      (a) =>
        new Date(a.startTime).toDateString() === date.toDateString()
    );

    // Check for upcoming exams
    const upcomingExams = getUpcomingExams(activities, date);
    const examInfo = upcomingExams.length > 0
      ? `\n\nVERIFICHE/INTERROGAZIONI IMMINENTI (IMPORTANTE!):\n${upcomingExams
          .map(
            (e) =>
              `- ${e.exam.examSubject || 'Materia'}: tra ${e.daysUntil} giorni (${new Date(e.exam.startTime).toLocaleDateString('it-IT')})`
          )
          .join('\n')}\n\n⚠️ Suggerisci di studiare/prepararsi per queste verifiche!`
      : '';

    const userPrompt = `Utente: ${user.name}
Interessi: ${user.interests.join(', ')}
Obiettivi: ${user.goals.join(', ')}
Attività di oggi: ${todayActivities.length} (${todayActivities.filter((a) => a.completed).length} completate)${examInfo}

Genera 2-3 suggerimenti brevi per oggi. Se ci sono verifiche, includi suggerimenti per studiare. Rispondi in formato JSON array.`;

    const response = await fetch(`${LM_STUDIO_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'local-model',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error('LM Studio API request failed');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Try to parse as JSON array
    try {
      const suggestions = JSON.parse(content);
      if (Array.isArray(suggestions)) {
        return suggestions.slice(0, 3);
      }
    } catch {
      // If not JSON, split by newlines
      return content
        .split('\n')
        .filter((line: string) => line.trim().length > 0)
        .slice(0, 3);
    }

    return [];
  } catch (error: any) {
    // LM Studio not available - use fallback (this is normal)
    if (error.cause?.code === 'ECONNREFUSED') {
      console.log('ℹ️ LM Studio non disponibile - uso suggerimenti fallback');
    } else {
      console.error('Daily suggestions error:', error);
    }
    return generateFallbackDailySuggestions(user, activities);
  }
}

/**
 * Detects patterns in user activities
 */
export function detectPatterns(activities: Activity[]): Array<{
  activity: string;
  frequency: string;
  times: string[];
}> {
  const patterns: Map<
    string,
    { count: number; times: Set<string>; days: Set<number> }
  > = new Map();

  activities.forEach((activity) => {
    const key = activity.title.toLowerCase();
    const time = new Date(activity.startTime).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const day = new Date(activity.startTime).getDay();

    if (!patterns.has(key)) {
      patterns.set(key, { count: 0, times: new Set(), days: new Set() });
    }

    const pattern = patterns.get(key)!;
    pattern.count++;
    pattern.times.add(time);
    pattern.days.add(day);
  });

  const results: Array<{
    activity: string;
    frequency: string;
    times: string[];
  }> = [];

  patterns.forEach((pattern, activity) => {
    if (pattern.count >= 3) {
      let frequency = 'occasionale';
      if (pattern.count >= 10) frequency = 'abituale';
      else if (pattern.count >= 5) frequency = 'frequente';

      results.push({
        activity,
        frequency,
        times: Array.from(pattern.times),
      });
    }
  });

  return results;
}

/**
 * Finds dead time slots in the user's calendar
 */
export function findDeadTime(
  activities: Activity[],
  date: Date,
  dayHours: { start: string; end: string }
): Array<{ start: string; end: string; duration: number }> {
  const dayActivities = activities
    .filter(
      (a) =>
        new Date(a.startTime).toDateString() === date.toDateString()
    )
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

  const deadSlots: Array<{ start: string; end: string; duration: number }> = [];

  // Parse day hours
  const [dayStartHour, dayStartMin] = dayHours.start.split(':').map(Number);
  const [dayEndHour, dayEndMin] = dayHours.end.split(':').map(Number);

  const dayStart = new Date(date);
  dayStart.setHours(dayStartHour, dayStartMin, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(dayEndHour, dayEndMin, 0, 0);

  if (dayActivities.length === 0) {
    // Entire day is free
    const duration = (dayEnd.getTime() - dayStart.getTime()) / (1000 * 60);
    if (duration > 60) {
      deadSlots.push({
        start: dayHours.start,
        end: dayHours.end,
        duration,
      });
    }
    return deadSlots;
  }

  // Check gap before first activity
  const firstActivity = new Date(dayActivities[0].startTime);
  if (firstActivity.getTime() - dayStart.getTime() > 60 * 60 * 1000) {
    // More than 1 hour gap
    const duration = (firstActivity.getTime() - dayStart.getTime()) / (1000 * 60);
    deadSlots.push({
      start: dayHours.start,
      end: firstActivity.toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      duration,
    });
  }

  // Check gaps between activities
  for (let i = 0; i < dayActivities.length - 1; i++) {
    const currentEnd = new Date(dayActivities[i].endTime);
    const nextStart = new Date(dayActivities[i + 1].startTime);
    const gap = nextStart.getTime() - currentEnd.getTime();

    if (gap > 60 * 60 * 1000) {
      // More than 1 hour gap
      const duration = gap / (1000 * 60);
      deadSlots.push({
        start: currentEnd.toLocaleTimeString('it-IT', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        end: nextStart.toLocaleTimeString('it-IT', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        duration,
      });
    }
  }

  // Check gap after last activity
  const lastActivity = new Date(
    dayActivities[dayActivities.length - 1].endTime
  );
  if (dayEnd.getTime() - lastActivity.getTime() > 60 * 60 * 1000) {
    const duration = (dayEnd.getTime() - lastActivity.getTime()) / (1000 * 60);
    deadSlots.push({
      start: lastActivity.toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      end: dayHours.end,
      duration,
    });
  }

  return deadSlots;
}

/**
 * Finds upcoming exams in the next 7 days
 */
export function getUpcomingExams(
  activities: Activity[],
  fromDate: Date = new Date()
): Array<{ exam: Activity; daysUntil: number }> {
  const upcomingExams: Array<{ exam: Activity; daysUntil: number }> = [];
  const now = fromDate.getTime();
  const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;

  activities.forEach((activity) => {
    if (activity.type === 'exam') {
      const examTime = new Date(activity.startTime).getTime();
      if (examTime >= now && examTime <= sevenDaysFromNow) {
        const daysUntil = Math.ceil((examTime - now) / (1000 * 60 * 60 * 24));
        upcomingExams.push({ exam: activity, daysUntil });
      }
    }
  });

  return upcomingExams.sort((a, b) => a.daysUntil - b.daysUntil);
}

// Private helper functions

function generateSystemPrompt(user: UserProfile): string {
  return `Sei un assistente AI per Kalendary, un'app di calendario intelligente che aiuta gli utenti a ottimizzare il loro tempo.

Informazioni utente:
- Nome: ${user.name}
- Interessi: ${user.interests.join(', ')}
- Obiettivi: ${user.goals.join(', ')}
${user.isStudent ? `- Studente: sì (settimana ${user.weekType === 'short' ? 'corta' : 'lunga'})` : ''}
${user.schoolHours ? `- Orario scuola: ${user.schoolHours.start}-${user.schoolHours.end}` : ''}
- Orario giornaliero: ${user.dayHours?.start || '07:00'}-${user.dayHours?.end || '23:00'}

Il tuo compito:
1. Analizzare il calendario dell'utente
2. Identificare "tempo morto" (gap > 1 ora tra attività)
3. Riconoscere pattern ricorrenti
4. Suggerire attività basate su interessi e obiettivi
5. Mantenere suggerimenti brevi e actionable

Rispondi SEMPRE in formato JSON con questa struttura:
{
  "deadTimeSlots": [{"start": "HH:MM", "end": "HH:MM", "duration": number, "suggestions": [string]}],
  "patterns": [{"activity": string, "frequency": string, "recommendation": string}],
  "suggestions": [{"title": string, "description": string, "category": string, "suggestedTime": string, "recurring": string}]
}`;
}

function generateCalendarAnalysisPrompt(
  user: UserProfile,
  activities: Activity[]
): string {
  const today = new Date();
  const weekActivities = activities.filter((a) => {
    const diff = today.getTime() - new Date(a.startTime).getTime();
    return diff <= 7 * 24 * 60 * 60 * 1000; // Last 7 days
  });

  const completed = weekActivities.filter((a) => a.completed).length;
  const total = weekActivities.length;

  return `Analizza il calendario dell'utente e genera suggerimenti intelligenti.

Attività ultima settimana: ${total} (${completed} completate, ${Math.round((completed / total) * 100)}% completion rate)

Attività recenti:
${activities
  .slice(0, 20)
  .map(
    (a) =>
      `- ${a.title}: ${new Date(a.startTime).toLocaleDateString('it-IT')} ${new Date(a.startTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}-${new Date(a.endTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} ${a.completed ? '✓' : '○'}`
  )
  .join('\n')}

Genera:
1. Analisi del tempo morto per oggi
2. Pattern identificati nelle attività
3. 3-5 suggerimenti di attività personalizzati

Ricorda: suggerimenti brevi, specifici, motivanti!`;
}

function generateFallbackSuggestions(
  user: UserProfile,
  activities: Activity[]
): AIAnalysisResult {
  const suggestions = [];

  // Generate suggestions based on interests
  if (user.interests.includes('fitness')) {
    suggestions.push({
      title: 'Allenamento rapido',
      description: '30 minuti di esercizio fisico',
      category: 'fitness',
      recurring: '3x settimana',
    });
  }

  if (user.interests.includes('study')) {
    suggestions.push({
      title: 'Sessione di studio',
      description: 'Focus su un argomento importante',
      category: 'study',
      recurring: 'quotidiano',
    });
  }

  if (user.interests.includes('creative')) {
    suggestions.push({
      title: 'Momento creativo',
      description: 'Dedica tempo alla tua creatività',
      category: 'creative',
      recurring: '2x settimana',
    });
  }

  return {
    deadTimeSlots: [],
    patterns: [],
    suggestions,
  };
}

function generateFallbackDailySuggestions(
  user: UserProfile,
  activities: Activity[]
): string[] {
  const suggestions = [];

  // Priority 1: Check for upcoming exams
  const upcomingExams = getUpcomingExams(activities);
  if (upcomingExams.length > 0) {
    const nearestExam = upcomingExams[0];
    const subject = nearestExam.exam.examSubject || 'materia';
    const daysText =
      nearestExam.daysUntil === 0
        ? 'oggi'
        : nearestExam.daysUntil === 1
        ? 'domani'
        : `tra ${nearestExam.daysUntil} giorni`;

    suggestions.push(`📚 Studia per ${subject} (${daysText})`);

    // Add a second study suggestion if exam is very soon
    if (nearestExam.daysUntil <= 2) {
      suggestions.push(`📝 Ripassa ${subject} per la verifica`);
    }
  }

  // Add other suggestions based on goals
  if (user.goals.includes('productivity') && suggestions.length < 3) {
    suggestions.push('📈 Completa 3 task prioritari oggi');
  }

  if (user.goals.includes('health') && suggestions.length < 3) {
    suggestions.push('🏃 30 min di attività fisica');
  }

  if (user.goals.includes('learning') && suggestions.length < 3) {
    suggestions.push('🧠 Impara qualcosa di nuovo');
  }

  if (suggestions.length === 0) {
    suggestions.push('✨ Pianifica la tua giornata');
  }

  return suggestions.slice(0, 3);
}
