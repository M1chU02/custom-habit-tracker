import {
  collection,
  doc,
  setDoc,
  updateDoc,
  query,
  onSnapshot,
  deleteDoc,
  orderBy,
  getDoc,
  getDocs,
  where,
  documentId,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Habit, DayCompletion } from "../types";

export const habitService = {
  subscribeToHabits: (userId: string, callback: (habits: Habit[]) => void) => {
    const habitsRef = collection(db, "users", userId, "habits");
    const q = query(habitsRef, orderBy("order", "asc"));

    return onSnapshot(q, (snapshot) => {
      const habits = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Habit,
      );
      callback(habits);
    });
  },

  addHabit: async (
    userId: string,
    name: string,
    order: number,
    description?: string,
    reminderTime?: string,
  ) => {
    const habitsRef = collection(db, "users", userId, "habits");
    const newHabitRef = doc(habitsRef);
    await setDoc(newHabitRef, {
      name,
      order,
      description: description || null,
      reminderTime: reminderTime || null,
      isArchived: false,
      createdAt: Date.now(),
    });
  },

  updateHabit: async (
    userId: string,
    habitId: string,
    updates: Partial<Habit>,
  ) => {
    const habitRef = doc(db, "users", userId, "habits", habitId);
    await updateDoc(habitRef, updates);
  },

  deleteHabit: async (userId: string, habitId: string) => {
    const habitRef = doc(db, "users", userId, "habits", habitId);
    await deleteDoc(habitRef);
  },

  subscribeToDay: (
    userId: string,
    date: string,
    callback: (completion: DayCompletion | null) => void,
  ) => {
    const dayRef = doc(db, "users", userId, "days", date);

    return onSnapshot(dayRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as DayCompletion);
      } else {
        callback(null);
      }
    });
  },

  toggleHabit: async (
    userId: string,
    date: string,
    habitId: string,
    completed: boolean,
  ) => {
    const dayRef = doc(db, "users", userId, "days", date);
    const dayDoc = await getDoc(dayRef);

    if (!dayDoc.exists()) {
      await setDoc(dayRef, {
        checks: { [habitId]: completed },
        updatedAt: Date.now(),
      });
    } else {
      await updateDoc(dayRef, {
        [`checks.${habitId}`]: completed,
        updatedAt: Date.now(),
      });
    }
  },

  calculateStreak: async (
    userId: string,
    activeHabitIds: string[],
  ): Promise<number> => {
    // If no active habits, streak is 0
    if (activeHabitIds.length === 0) {
      return 0;
    }

    let streak = 0;
    const today = new Date();

    // Check if today is a perfect day
    const todayString = today.toISOString().split("T")[0];
    const todayRef = doc(db, "users", userId, "days", todayString);
    const todayDoc = await getDoc(todayRef);
    const todayComplete =
      todayDoc.exists() &&
      activeHabitIds.every(
        (habitId) =>
          (todayDoc.data() as DayCompletion).checks[habitId] === true,
      );

    // If today is complete, start counting from today (i=0).
    // If today is not yet complete (day in progress), start counting from yesterday (i=1)
    // so that a mid-day check doesn't break an ongoing streak.
    const startOffset = todayComplete ? 0 : 1;

    // Check backwards
    for (let i = startOffset; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateString = checkDate.toISOString().split("T")[0];

      const dayRef = doc(db, "users", userId, "days", dateString);
      const dayDoc = await getDoc(dayRef);

      if (!dayDoc.exists()) {
        // No data for this day means streak is broken
        break;
      }

      const dayData = dayDoc.data() as DayCompletion;
      const allCompleted = activeHabitIds.every(
        (habitId) => dayData.checks[habitId] === true,
      );

      if (allCompleted) {
        streak++;
      } else {
        // Streak is broken
        break;
      }
    }

    return streak;
  },

  getExtendedStats: async (
    userId: string,
    activeHabitIds: string[],
    daysBack: number = 30,
  ): Promise<{
    completionRate: number;
    perfectDays: number;
  }> => {
    if (activeHabitIds.length === 0) {
      return { completionRate: 0, perfectDays: 0 };
    }

    let totalPossibleCompletions = 0;
    let actualCompletions = 0;
    let perfectDays = 0;
    const today = new Date();

    for (let i = 0; i < daysBack; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateString = checkDate.toISOString().split("T")[0];

      const dayRef = doc(db, "users", userId, "days", dateString);
      const dayDoc = await getDoc(dayRef);

      if (dayDoc.exists()) {
        const dayData = dayDoc.data() as DayCompletion;
        let dayCompletions = 0;

        activeHabitIds.forEach((habitId) => {
          totalPossibleCompletions++;
          if (dayData.checks[habitId] === true) {
            actualCompletions++;
            dayCompletions++;
          }
        });

        // Check if all habits were completed on this day
        if (dayCompletions === activeHabitIds.length) {
          perfectDays++;
        }
      } else {
        // No data for this day, count as 0 completions
        totalPossibleCompletions += activeHabitIds.length;
      }
    }

    const completionRate =
      totalPossibleCompletions > 0
        ? Math.round((actualCompletions / totalPossibleCompletions) * 100)
        : 0;

    return { completionRate, perfectDays };
  },

  getYearlyHistory: async (
    userId: string,
    _activeHabitIds: string[],
  ): Promise<Record<string, number>> => {
    // Return a map of date -> count of completed habits
    // We count ALL checked habits stored for each day (not filtered by current active list),
    // so historical days before a habit was added still show correct activity.
    const history: Record<string, number> = {};
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setDate(today.getDate() - 365);

    const daysRef = collection(db, "users", userId, "days");
    const startId = oneYearAgo.toISOString().split("T")[0];
    const endId = today.toISOString().split("T")[0];

    const q = query(
      daysRef,
      where(documentId(), ">=", startId),
      where(documentId(), "<=", endId),
    );

    const snapshot = await getDocs(q);

    snapshot.docs.forEach((doc) => {
      const data = doc.data() as DayCompletion;
      // Count all habits that were checked true on this day
      const count = Object.values(data.checks || {}).filter(
        (v) => v === true,
      ).length;
      if (count > 0) {
        history[doc.id] = count;
      }
    });

    return history;
  },
};
