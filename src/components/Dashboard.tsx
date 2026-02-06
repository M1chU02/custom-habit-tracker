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
  Target,
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
    <div className="min-h-screen">
      <div className="bg-mesh-gradient" />

      <div className="max-w-4xl mx-auto px-4 py-8 md:py-16">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-5">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-lg shadow-primary/10">
              <img
                src={user?.photoURL || ""}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Cześć, {user?.displayName?.split(" ")[0]}!
              </h2>
              <p className="text-text-dim text-sm font-medium">
                {format(new Date(), "EEEE, d MMMM", { locale: pl })}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={logout}
            className="p-2.5 rounded-xl bg-white/5 border border-white/5">
            <LogOut size={20} />
          </Button>
        </header>

        {/* Stats Overview */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card
            glass
            className="flex flex-col justify-between border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between mb-6">
              <span className="text-text-muted text-sm font-semibold uppercase tracking-wider">
                Postęp dnia
              </span>
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-bold font-heading">
                {progressPercent}%
              </span>
              <span className="text-text-dim text-sm font-medium">
                {completedCount}/{activeHabits.length}
              </span>
            </div>
            <div className="mt-5 h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-primary shadow-[0_0_12px_rgba(139,92,246,0.5)]"
              />
            </div>
          </Card>

          <Card glass className="flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6">
              <span className="text-text-muted text-sm font-semibold uppercase tracking-wider">
                Streak
              </span>
              <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-bold font-heading text-secondary">
                7 dni
              </span>
              <span className="text-secondary text-xs bg-secondary/10 px-2.5 py-1 rounded-full font-bold">
                Rekord!
              </span>
            </div>
            <p className="mt-5 text-text-dim text-xs font-medium">
              Prawie tam! Jeszcze 3 dni do odznaki.
            </p>
          </Card>

          <Card glass className="flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6">
              <span className="text-text-muted text-sm font-semibold uppercase tracking-wider">
                Aktywne
              </span>
              <div className="p-2 bg-accent/10 rounded-lg text-accent">
                <Calendar size={18} />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-bold font-heading text-accent">
                {activeHabits.length}
              </span>
              <span className="text-text-dim text-sm font-medium italic">
                nawyki
              </span>
            </div>
            <p className="mt-5 text-text-dim text-xs font-medium">
              Zorganizuj swój dzień lepiej.
            </p>
          </Card>
        </section>

        {/* Habits List */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold tracking-tight">Twoje Nawyki</h3>
            <Button
              size="sm"
              onClick={() => setIsAddingHabit(true)}
              className="gap-2 rounded-xl px-4">
              <Plus size={18} />
              Nowy nawyk
            </Button>
          </div>

          <AnimatePresence mode="wait">
            {isAddingHabit && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-6">
                <Card className="p-4 border-primary/30 bg-primary/5">
                  <form onSubmit={handleAddHabit} className="flex gap-3">
                    <input
                      autoFocus
                      type="text"
                      value={newHabitName}
                      onChange={(e) => setNewHabitName(e.target.value)}
                      placeholder="Co chcesz śledzić?"
                      className="flex-1"
                    />
                    <Button type="submit">Dodaj</Button>
                    <Button
                      variant="ghost"
                      onClick={() => setIsAddingHabit(false)}>
                      Anuluj
                    </Button>
                  </form>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div layout className="space-y-4">
            {activeHabits.length === 0 && !isAddingHabit && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 border-2 border-dashed border-border rounded-3xl">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                  <Target className="text-text-dim" size={32} />
                </div>
                <p className="text-text-dim mb-6 font-medium">
                  Nie masz jeszcze żadnych aktywnych nawyków.
                </p>
                <Button
                  variant="secondary"
                  onClick={() => setIsAddingHabit(true)}
                  className="rounded-xl">
                  Stwórz pierwszy nawyk
                </Button>
              </motion.div>
            )}

            <AnimatePresence>
              {activeHabits.map((habit) => {
                const isCompleted = dayData?.checks[habit.id] || false;
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={habit.id}
                    className={clsx(
                      "group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300",
                      isCompleted
                        ? "bg-primary/[0.08] border-primary/30 shadow-[0_0_20px_rgba(139,92,246,0.1)]"
                        : "bg-bg-card border-border hover:border-border-hover hover:bg-bg-card-hover shadow-sm",
                    )}>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleHabit(habit.id)}
                      className={clsx(
                        "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                        isCompleted
                          ? "bg-primary text-white shadow-lg shadow-primary/30"
                          : "bg-white/5 text-text-dim group-hover:bg-white/10 group-hover:text-text-muted",
                      )}>
                      {isCompleted ? (
                        <CheckCircle2 size={22} />
                      ) : (
                        <Circle size={22} className="opacity-50" />
                      )}
                    </motion.button>

                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => toggleHabit(habit.id)}>
                      <h4
                        className={clsx(
                          "text-lg font-semibold transition-all duration-300",
                          isCompleted
                            ? "text-primary/60 line-through italic"
                            : "text-text-main",
                        )}>
                        {habit.name}
                      </h4>
                    </div>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <button
                        onClick={() => toggleArchive(habit)}
                        className="p-2.5 text-text-dim hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        title="Archiwizuj">
                        <Archive size={18} />
                      </button>
                      <button
                        onClick={() => deleteHabit(habit.id)}
                        className="p-2.5 text-text-dim hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                        title="Usuń">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* Archive Section */}
        {archivedHabits.length > 0 && (
          <section className="mt-12 pt-8 border-t border-border">
            <button className="flex items-center gap-2 text-text-dim hover:text-text-muted transition-colors mb-6 text-sm font-semibold uppercase tracking-wider">
              <Archive size={16} />
              Zarchiwizowane ({archivedHabits.length})
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {archivedHabits.map((habit) => (
                <motion.div
                  layout
                  key={habit.id}
                  className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl text-sm border border-border/50 group">
                  <span className="text-text-dim font-medium">
                    {habit.name}
                  </span>
                  <button
                    onClick={() => toggleArchive(habit)}
                    className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity bg-primary/10 px-3 py-1.5 rounded-lg">
                    Przywróć
                  </button>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
