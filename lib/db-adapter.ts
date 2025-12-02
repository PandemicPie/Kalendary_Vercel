// Database adapter for Vercel PostgreSQL
// This version is optimized for Vercel deployment (PostgreSQL only)

import { sql } from '@vercel/postgres';

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

let initialized = false;

export async function initializeDatabase() {
  if (initialized) return;
  
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        interests TEXT,
        goals TEXT,
        is_student BOOLEAN DEFAULT false,
        week_type TEXT,
        school_hours TEXT,
        day_hours TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create activities table
    await sql`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        completed BOOLEAN DEFAULT false,
        type TEXT DEFAULT 'scheduled',
        category TEXT,
        emoji TEXT,
        recurring TEXT,
        exam_subject TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create streaks table
    await sql`
      CREATE TABLE IF NOT EXISTS streaks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        current INTEGER DEFAULT 0,
        best INTEGER DEFAULT 0,
        total_points INTEGER DEFAULT 0,
        last_completed_date DATE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(start_time)`;

    initialized = true;
    console.log('✅ Database initialized successfully');
  } catch (error: any) {
    // Ignore "already exists" errors
    if (!error.message?.includes('already exists')) {
      console.error('Database initialization error:', error);
      throw error;
    }
    initialized = true;
  }
}

// ============================================================================
// USER FUNCTIONS
// ============================================================================

export async function getUser(email: string) {
  await initializeDatabase();
  const result = await sql`SELECT * FROM users WHERE email = ${email}`;
  return result.rows[0];
}

export async function getUserById(id: number) {
  await initializeDatabase();
  const result = await sql`SELECT * FROM users WHERE id = ${id}`;
  return result.rows[0];
}

export async function createUser(email: string, password: string, name: string) {
  await initializeDatabase();
  const result = await sql`
    INSERT INTO users (email, password, name)
    VALUES (${email}, ${password}, ${name})
    RETURNING id
  `;
  return { id: result.rows[0].id, lastInsertRowid: result.rows[0].id };
}

export async function updateUser(id: number, updates: Record<string, any>) {
  await initializeDatabase();
  
  const entries = Object.entries(updates);
  if (entries.length === 0) return { changes: 0 };
  
  // Build dynamic query
  const setClauses: string[] = [];
  const values: any[] = [];
  
  entries.forEach(([key, value], index) => {
    setClauses.push(`${key} = $${index + 1}`);
    values.push(value);
  });
  
  values.push(id);
  
  const query = `
    UPDATE users
    SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${values.length}
  `;
  
  await sql.query(query, values);
  return { changes: 1 };
}

// ============================================================================
// ACTIVITIES FUNCTIONS
// ============================================================================

export async function getUserActivities(userId: number) {
  await initializeDatabase();
  const result = await sql`
    SELECT * FROM activities
    WHERE user_id = ${userId}
    ORDER BY start_time
  `;
  return result.rows;
}

export async function createActivity(userId: number, activity: {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  completed?: boolean;
  type?: string;
  category?: string;
  emoji?: string;
  recurring?: any;
  examSubject?: string;
}) {
  await initializeDatabase();
  
  const result = await sql`
    INSERT INTO activities (
      user_id, title, description, start_time, end_time,
      completed, type, category, emoji, recurring, exam_subject
    )
    VALUES (
      ${userId},
      ${activity.title},
      ${activity.description || null},
      ${activity.startTime},
      ${activity.endTime},
      ${activity.completed ? true : false},
      ${activity.type || 'scheduled'},
      ${activity.category || null},
      ${activity.emoji || null},
      ${activity.recurring ? JSON.stringify(activity.recurring) : null},
      ${activity.examSubject || null}
    )
    RETURNING id
  `;
  
  return { id: result.rows[0].id, lastInsertRowid: result.rows[0].id };
}

export async function updateActivity(id: number, userId: number, updates: Record<string, any>) {
  await initializeDatabase();
  
  const entries = Object.entries(updates);
  if (entries.length === 0) return { changes: 0 };
  
  const setClauses: string[] = [];
  const values: any[] = [];
  
  entries.forEach(([key, value], index) => {
    setClauses.push(`${key} = $${index + 1}`);
    values.push(value);
  });
  
  values.push(id, userId);
  
  const query = `
    UPDATE activities
    SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${values.length - 1} AND user_id = $${values.length}
  `;
  
  await sql.query(query, values);
  return { changes: 1 };
}

export async function deleteActivity(id: number, userId: number) {
  await initializeDatabase();
  await sql`DELETE FROM activities WHERE id = ${id} AND user_id = ${userId}`;
  return { changes: 1 };
}

// ============================================================================
// STREAKS FUNCTIONS
// ============================================================================

export async function getUserStreak(userId: number) {
  await initializeDatabase();
  
  const result = await sql`SELECT * FROM streaks WHERE user_id = ${userId}`;
  let streak = result.rows[0];

  if (!streak) {
    // Create streak record if doesn't exist
    const insertResult = await sql`
      INSERT INTO streaks (user_id, current, best, total_points)
      VALUES (${userId}, 0, 0, 0)
      RETURNING *
    `;
    streak = insertResult.rows[0];
  }

  return streak;
}

export async function updateStreak(userId: number, updates: Record<string, any>) {
  await initializeDatabase();
  
  const entries = Object.entries(updates);
  if (entries.length === 0) return { changes: 0 };
  
  const setClauses: string[] = [];
  const values: any[] = [];
  
  entries.forEach(([key, value], index) => {
    setClauses.push(`${key} = $${index + 1}`);
    values.push(value);
  });
  
  values.push(userId);
  
  const query = `
    UPDATE streaks
    SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $${values.length}
  `;
  
  await sql.query(query, values);
  return { changes: 1 };
}
