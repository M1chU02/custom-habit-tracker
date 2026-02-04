import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { habitService } from "../services/habitService";
import type { Habit, DayCompletion } from "../types";
import Button from "./Button";
import Card from "./Card";
import {
  Plus,
  LogOut,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Circle,
  Archive,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [dayData, setDayData] = useState<DayCompletion | null>(null);
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");

  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    if (!user) return;

    const unsubscribeHabits = habitService.subscribeToHabits(
      user.uid,
      setHabits,
    );
    const unsubscribeDay = habitService.subscribeToDay(
      user.uid,
      today,
      setDayData,
    );

    return () => {
      unsubscribeHabits();
      unsubscribeDay();
    };
  }, [user, today]);

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newHabitName.trim()) return;

    try {
      await habitService.addHabit(user.uid, newHabitName.trim(), habits.length);
      setNewHabitName("");
      setIsAddingHabit(false);
    } catch (error) {
      console.error("Error adding habit", error);
    }
  };

  const toggleHabit = async (habitId: string) => {
    if (!user) return;
    const isCompleted = dayData?.checks[habitId] || false;
    await habitService.toggleHabit(user.uid, today, habitId, !isCompleted);
  };

  const toggleArchive = async (habit: Habit) => {
    if (!user) return;
    await habitService.updateHabit(user.uid, habit.id, {
      isArchived: !habit.isArchived,
    });
  };

  const deleteHabit = async (habitId: string) => {
    if (!user || !window.confirm("Czy na pewno chcesz usunąć ten nawyk?"))
      return;
    await habitService.deleteHabit(user.uid, habitId);
  };

  const activeHabits = habits.filter((h) => !h.isArchived);
  const archivedHabits = habits.filter((h) => h.isArchived);

  const completedCount = activeHabits.filter(
    (h) => dayData?.checks[h.id],
  ).length;
  const progressPercent =
    activeHabits.length > 0
      ? Math.round((completedCount / activeHabits.length) * 100)
      : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <header className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20">
            <img src={user?.photoURL || ""} alt="Avatar" />
          </div>
          <div>
            <h2 className="text-xl font-heading font-bold">
              Cześć, {user?.displayName?.split(" ")[0]}!
            </h2>
            <p className="text-text-dim text-sm">
              {format(new Date(), "EEEE, d MMMM", { locale: pl })}
            </p>
          </div>
        </div>
        <Button variant="ghost" onClick={logout} className="p-2">
          <LogOut size={20} />
        </Button>
      </header>

      {/* Stats Overview */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <Card glass className="bg-primary/5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-text-muted text-sm font-medium">
              Postęp dnia
            </span>
            <CheckCircle2 className="text-primary" size={20} />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-heading font-bold">
              {progressPercent}%
            </span>
            <span className="text-text-dim text-sm">
              {completedCount}/{activeHabits.length}
            </span>
          </div>
          <div className="mt-4 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className="h-full bg-primary"
            />
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-text-muted text-sm font-medium">
              Bieżący Streak
            </span>
            <TrendingUp className="text-secondary" size={20} />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-heading font-bold">7 dni</span>
            <span className="text-secondary text-xs bg-secondary/10 px-2 py-0.5 rounded-full font-bold">
              Rekord!
            </span>
          </div>
          <p className="mt-4 text-text-dim text-xs">
            Prawie tam! Jeszcze 3 dni do odznaki.
          </p>
        </Card>

        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-text-muted text-sm font-medium">Nawyki</span>
            <Calendar className="text-accent" size={20} />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-heading font-bold">
              {activeHabits.length}
            </span>
            <span className="text-text-dim text-sm">Aktywne</span>
          </div>
          <p className="mt-4 text-text-dim text-xs">
            Zorganizuj swój dzień lepiej.
          </p>
        </Card>
      </section>

      {/* Habits List */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-heading">Twoje Nawyki</h3>
          <Button
            size="sm"
            onClick={() => setIsAddingHabit(true)}
            className="gap-2">
            <Plus size={18} />
            Dodaj
          </Button>
        </div>

        <AnimatePresence>
          {isAddingHabit && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4">
              <form onSubmit={handleAddHabit} className="flex gap-2">
                <input
                  autoFocus
                  type="text"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="Co chcesz śledzić?"
                  className="flex-1 bg-bg-card-hover"
                />
                <Button type="submit">Dodaj</Button>
                <Button variant="ghost" onClick={() => setIsAddingHabit(false)}>
                  Anuluj
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          {activeHabits.length === 0 && !isAddingHabit && (
            <div className="text-center py-12 border border-dashed border-border rounded-2xl">
              <p className="text-text-dim mb-4">
                Nie masz jeszcze żadnych aktywnych nawyków.
              </p>
              <Button
                variant="secondary"
                onClick={() => setIsAddingHabit(true)}>
                Zacznij tutaj
              </Button>
            </div>
          )}

          {activeHabits.map((habit) => {
            const isCompleted = dayData?.checks[habit.id] || false;
            return (
              <motion.div
                layout
                key={habit.id}
                className={clsx(
                  "group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300",
                  isCompleted
                    ? "bg-primary/5 border-primary/20"
                    : "bg-bg-card border-border hover:border-border-hover shadow-sm",
                )}>
                <button
                  onClick={() => toggleHabit(habit.id)}
                  className={clsx(
                    "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                    isCompleted
                      ? "bg-primary text-white scale-110"
                      : "bg-white/5 text-text-dim hover:text-white",
                  )}>
                  {isCompleted ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    <Circle size={20} />
                  )}
                </button>

                <div className="flex-1" onClick={() => toggleHabit(habit.id)}>
                  <h4
                    className={clsx(
                      "font-medium transition-all",
                      isCompleted
                        ? "text-primary/70 line-through"
                        : "text-text-main",
                    )}>
                    {habit.name}
                  </h4>
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => toggleArchive(habit)}
                    className="p-2 text-text-dim hover:text-white transition-colors"
                    title="Archiwizuj">
                    <Archive size={16} />
                  </button>
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    className="p-2 text-text-dim hover:text-error transition-colors"
                    title="Usuń">
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Archive Section */}
      {archivedHabits.length > 0 && (
        <section>
          <button className="flex items-center gap-2 text-text-dim hover:text-text-main transition-colors mb-4 text-sm font-medium">
            <Archive size={16} />
            Archiwum ({archivedHabits.length})
          </button>
          <div className="space-y-2 opacity-60">
            {archivedHabits.map((habit) => (
              <div
                key={habit.id}
                className="flex items-center justify-between p-3 bg-white/5 rounded-xl text-sm border border-transparent">
                <span>{habit.name}</span>
                <button
                  onClick={() => toggleArchive(habit)}
                  className="text-text-dim hover:text-white">
                  Przywróć
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Dashboard;
