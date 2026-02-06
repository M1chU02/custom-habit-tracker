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
    <div className="min-h-screen relative overflow-hidden">
      <div className="bg-mesh-premium" />

      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 relative z-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
          <div className="flex items-center gap-6">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-20 h-20 rounded-3xl overflow-hidden border-2 border-primary/30 shadow-2xl shadow-primary/20 flex-shrink-0 bg-primary/10 flex items-center justify-center text-primary font-black text-3xl">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{user?.displayName?.charAt(0)}</span>
              )}
            </motion.div>
            <div>
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-4xl font-black tracking-tight mb-1">
                Cześć,{" "}
                <span className="text-gradient-vibrant">
                  {user?.displayName?.split(" ")[0]}
                </span>
                !
              </motion.h2>
              <p className="text-text-dim text-lg font-semibold flex items-center gap-2">
                <Calendar size={18} className="text-primary" />
                {format(new Date(), "EEEE, d MMMM", { locale: pl })}
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={logout}
            className="self-start md:self-center border-white/10 shadow-xl">
            <LogOut size={20} />
            Wyloguj
          </Button>
        </header>

        {/* Stats Overview */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card
            glass
            className="glass-premium card-hover flex flex-col justify-between p-8 border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between mb-8">
              <span className="text-text-muted text-xs font-black uppercase tracking-[0.2em]">
                Postęp dnia
              </span>
              <div className="p-3 bg-primary/20 rounded-2xl text-primary shadow-inner shadow-white/10">
                <CheckCircle2 size={22} />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-5xl font-black font-heading text-gradient">
                {progressPercent}%
              </span>
              <span className="text-text-dim text-sm font-bold bg-white/5 px-3 py-1 rounded-lg">
                {completedCount}/{activeHabits.length}
              </span>
            </div>
            <div className="mt-8 h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[2px]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full shadow-[0_0_20px_var(--primary-glow)]"
              />
            </div>
          </Card>

          <Card
            glass
            className="glass-premium card-hover flex flex-col justify-between p-8 border-secondary/20 bg-secondary/5">
            <div className="flex items-center justify-between mb-8">
              <span className="text-text-muted text-xs font-black uppercase tracking-[0.2em]">
                Streak
              </span>
              <div className="p-3 bg-secondary/20 rounded-2xl text-secondary shadow-inner shadow-white/10">
                <TrendingUp size={22} />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div className="flex flex-col">
                <span className="text-5xl font-black font-heading text-gradient-vibrant">
                  7 dni
                </span>
              </div>
              <span className="text-white text-[10px] bg-secondary px-3 py-1 rounded-full font-black uppercase tracking-wider shadow-lg shadow-secondary/30">
                Rekord!
              </span>
            </div>
            <p className="mt-8 text-text-dim text-sm font-semibold leading-snug">
              Prawie tam! Jeszcze 3 dni do odznaki.
            </p>
          </Card>

          <Card
            glass
            className="glass-premium card-hover flex flex-col justify-between p-8 border-accent/20 bg-accent/5">
            <div className="flex items-center justify-between mb-8">
              <span className="text-text-muted text-xs font-black uppercase tracking-[0.2em]">
                Aktywne
              </span>
              <div className="p-3 bg-accent/20 rounded-2xl text-accent shadow-inner shadow-white/10">
                <Calendar size={22} />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-5xl font-black font-heading text-gradient">
                {activeHabits.length}
              </span>
              <span className="text-text-dim text-sm font-bold italic opacity-60">
                nawyki
              </span>
            </div>
            <p className="mt-8 text-text-dim text-sm font-semibold leading-snug">
              Zorganizuj swój dzień lepiej.
            </p>
          </Card>
        </section>

        {/* Habits List */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-3xl font-black tracking-tight text-gradient">
              Twoje Nawyki
            </h3>
            <Button
              variant="primary"
              onClick={() => setIsAddingHabit(true)}
              className="rounded-2xl shadow-primary-glow">
              <Plus size={20} />
              Nowy nawyk
            </Button>
          </div>

          <AnimatePresence mode="wait">
            {isAddingHabit && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-8">
                <Card className="glass-premium p-6 border-primary/30 bg-primary/5">
                  <form
                    onSubmit={handleAddHabit}
                    className="flex flex-col md:flex-row gap-4">
                    <input
                      autoFocus
                      type="text"
                      value={newHabitName}
                      onChange={(e) => setNewHabitName(e.target.value)}
                      placeholder="Co chcesz śledzić?"
                      className="flex-1"
                    />
                    <div className="flex gap-3">
                      <Button type="submit" className="flex-1 md:flex-none">
                        Dodaj
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setIsAddingHabit(false)}>
                        Anuluj
                      </Button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div layout className="space-y-4">
            {activeHabits.length === 0 && !isAddingHabit && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-24 glass-premium rounded-[3rem] border-dashed border-white/10">
                <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-white/10 shadow-2xl animate-float">
                  <Target className="text-primary" size={48} />
                </div>
                <h4 className="text-2xl font-black mb-3">
                  Zacznij swoją podróż
                </h4>
                <p className="text-text-dim mb-10 max-w-xs mx-auto font-medium">
                  Nie masz jeszcze żadnych aktywnych nawyków. Pora to zmienić!
                </p>
                <Button
                  variant="primary"
                  onClick={() => setIsAddingHabit(true)}
                  className="rounded-2xl px-12 shadow-primary-glow">
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
                      "group flex items-center gap-6 p-5 rounded-3xl border transition-all duration-500 glass-premium",
                      isCompleted
                        ? "bg-primary/[0.05] border-primary/30 shadow-[0_0_30px_rgba(139,92,246,0.15)]"
                        : "bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]",
                    )}>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      whileHover={{ scale: 1.1 }}
                      onClick={() => toggleHabit(habit.id)}
                      className={clsx(
                        "flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl",
                        isCompleted
                          ? "bg-primary text-white shadow-primary/30"
                          : "bg-white/5 text-text-dim border border-white/10 hover:border-white/20 hover:bg-white/10",
                      )}>
                      {isCompleted ? (
                        <CheckCircle2 size={28} />
                      ) : (
                        <Circle size={28} className="opacity-30" />
                      )}
                    </motion.button>

                    <div className="flex-1 min-w-0">
                      <h4
                        className={clsx(
                          "text-xl font-bold transition-all duration-300",
                          isCompleted
                            ? "text-text-muted line-through opacity-50"
                            : "text-text-main",
                        )}>
                        {habit.name}
                      </h4>
                    </div>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                      <motion.button
                        whileHover={{ scale: 1.15, y: -2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleArchive(habit)}
                        className="p-4 text-text-dim hover:text-primary hover:bg-primary/10 rounded-2xl transition-all"
                        title="Archiwizuj">
                        <Archive size={20} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.15, y: -2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => deleteHabit(habit.id)}
                        className="p-4 text-text-dim hover:text-error hover:bg-error/10 rounded-2xl transition-all"
                        title="Usuń">
                        <Trash2 size={20} />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* Archives Section */}
        {archivedHabits.length > 0 && (
          <section className="mb-20">
            <h3 className="text-xl font-black mb-6 text-text-dim uppercase tracking-widest px-2">
              Zarchiwizowane
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {archivedHabits.map((habit) => (
                <motion.div
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={habit.id}
                  className="group flex items-center justify-between p-4 px-6 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all">
                  <span className="text-text-dim font-bold">{habit.name}</span>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleArchive(habit)}
                    className="text-xs font-black text-primary opacity-0 group-hover:opacity-100 transition-all bg-primary/10 px-5 py-2.5 rounded-xl border border-primary/20 hover:bg-primary hover:text-white shadow-lg shadow-primary/20">
                    Przywróć
                  </motion.button>
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
