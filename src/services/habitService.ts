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

  addHabit: async (userId: string, name: string, order: number) => {
    const habitsRef = collection(db, "users", userId, "habits");
    const newHabitRef = doc(habitsRef);
    await setDoc(newHabitRef, {
      name,
      order,
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

    // Check backwards from today
    for (let i = 0; i < 365; i++) {
      // Limit to 1 year
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
};
