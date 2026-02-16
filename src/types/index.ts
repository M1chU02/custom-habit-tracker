export interface Habit {
  id: string;
  name: string;
  order: number;
  isArchived: boolean;
  createdAt: number;
  description?: string;
  reminderTime?: string; // HH:mm
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
  completionRate7Days: number;
  completionRate30Days: number;
  perfectDays: number;
}
