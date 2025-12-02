import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Activity {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  completed: boolean;
  type: 'scheduled' | 'suggested' | 'routine' | 'exam';
  category?: string;
  emoji?: string;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval?: number; // es. ogni 2 settimane
    endDate?: Date;
  };
  examSubject?: string; // Per verifiche/interrogazioni
}

export interface UserProfile {
  name: string;
  interests: string[];
  goals: string[];
  onboardingCompleted: boolean;
  isStudent?: boolean | null;
  weekType?: 'short' | 'long' | null;
  schoolHours?: { start: string; end: string };
  dayHours?: { start: string; end: string };
}

export interface Streak {
  current: number;
  best: number;
  totalPoints: number;
  lastCompletedDate: string | null;
}

interface AppState {
  // User
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;

  // Activities
  activities: Activity[];
  setActivities: (activities: Activity[]) => void;
  addActivity: (activity: Activity) => void;
  toggleActivityComplete: (id: string) => void;
  updateActivity: (id: string, updates: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;

  // Streak
  streak: Streak;
  incrementStreak: () => void;
  addPoints: (points: number) => void;

  // Navigation
  currentSection: string;
  setCurrentSection: (section: string) => void;

  // AI
  aiSuggestions: string[];
  setAiSuggestions: (suggestions: string[]) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // User
      user: null,
      setUser: (user) => set({ user }),

      // Activities
      activities: [],
      setActivities: (activities) => set({ activities }),
      addActivity: (activity) =>
        set((state) => ({ activities: [...state.activities, activity] })),

      toggleActivityComplete: (id) => {
        set((state) => {
          const activities = state.activities.map((activity) =>
            activity.id === id
              ? { ...activity, completed: !activity.completed }
              : activity
          );

          // Check if we completed an activity today
          const completedToday = activities.filter(
            (a) => a.completed &&
            new Date(a.endTime).toDateString() === new Date().toDateString()
          );

          return { activities };
        });
      },

      updateActivity: (id, updates) =>
        set((state) => ({
          activities: state.activities.map((activity) =>
            activity.id === id ? { ...activity, ...updates } : activity
          ),
        })),

      deleteActivity: (id) =>
        set((state) => ({
          activities: state.activities.filter((activity) => activity.id !== id),
        })),

      // Streak
      streak: {
        current: 0,
        best: 0,
        totalPoints: 0,
        lastCompletedDate: null,
      },

      incrementStreak: () =>
        set((state) => {
          const today = new Date().toDateString();
          const lastDate = state.streak.lastCompletedDate;

          if (lastDate === today) {
            return state; // Already updated today
          }

          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const wasYesterday = lastDate === yesterday.toDateString();

          const newCurrent = wasYesterday ? state.streak.current + 1 : 1;
          const newBest = Math.max(newCurrent, state.streak.best);

          return {
            streak: {
              ...state.streak,
              current: newCurrent,
              best: newBest,
              lastCompletedDate: today,
            },
          };
        }),

      addPoints: (points) =>
        set((state) => ({
          streak: {
            ...state.streak,
            totalPoints: state.streak.totalPoints + points,
          },
        })),

      // Navigation
      currentSection: 'calendar',
      setCurrentSection: (section) => set({ currentSection: section }),

      // AI
      aiSuggestions: [],
      setAiSuggestions: (suggestions) => set({ aiSuggestions: suggestions }),
    }),
    {
      name: 'kalendary-storage',
    }
  )
);
