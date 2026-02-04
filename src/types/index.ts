export interface Habit {
  id: string;
  name: string;
  order: number;
  isArchived: boolean;
  createdAt: number;
}

export interface DayCompletion {
  id: string; // YYYY-MM-DD
  checks: Record<string, boolean>; // habitId -> completed
  updatedAt: number;
}

export interface HabitStats {
  streak: number;
  totalCompletions: number;
  completionRate: number;
}
