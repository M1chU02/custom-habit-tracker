import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { habitService } from "../services/habitService";
import type { Habit, DayCompletion } from "../types";
import Button from "./Button";
import Card from "./Card";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { pl } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
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
  Award,
  BarChart3,
  GripVertical,
  Bell,
  Clock,
  AlignLeft,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Toaster, toast } from "sonner";
import NotificationManager from "./NotificationManager";
import ContributionGraph from "./ContributionGraph";

interface SortableHabitItemProps {
  habit: Habit;
  isCompleted: boolean;
  isEditing: boolean;
  editingName: string;
  onToggle: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditNameChange: (name: string) => void;
  onArchive: () => void;
  onDelete: () => void;
}

const SortableHabitItem: React.FC<SortableHabitItemProps> = ({
  habit,
  isCompleted,
  isEditing,
  editingName,
  onToggle,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditNameChange,
  onArchive,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={clsx(
        "group flex items-center gap-6 p-5 rounded-3xl border transition-all duration-500 glass-premium",
        isCompleted
          ? "bg-primary/[0.05] border-primary/30 shadow-[0_0_30px_rgba(139,92,246,0.15)]"
          : "bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]",
      )}>
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 p-2 text-text-dim hover:text-text-main cursor-grab active:cursor-grabbing transition-colors"
        title="Przeciągnij aby zmienić kolejność">
        <GripVertical size={20} />
      </button>

      {/* Checkbox */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.1 }}
        onClick={onToggle}
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

      {/* Habit Name - Editable */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            autoFocus
            type="text"
            value={editingName}
            onChange={(e) => onEditNameChange(e.target.value)}
            onBlur={onSaveEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveEdit();
              if (e.key === "Escape") onCancelEdit();
            }}
            className="w-full bg-white/10 border border-primary/30 rounded-xl px-4 py-2 text-xl font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        ) : (
          <>
            <h4
              onClick={onStartEdit}
              className={clsx(
                "text-xl font-bold transition-all duration-300 cursor-pointer hover:text-primary",
                isCompleted
                  ? "text-text-muted line-through opacity-50"
                  : "text-text-main",
              )}>
              {habit.name}
            </h4>
            {(habit.description || habit.reminderTime) && (
              <div className="flex items-center gap-3 mt-1 text-text-dim text-sm">
                {habit.reminderTime && (
                  <span className="flex items-center gap-1 text-accent font-medium bg-accent/10 px-2 py-0.5 rounded-md">
                    <Bell size={12} />
                    {habit.reminderTime}
                  </span>
                )}
                {habit.description && (
                  <span className="flex items-center gap-1 opacity-70 truncate max-w-[200px]">
                    <AlignLeft size={12} />
                    {habit.description}
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
        <motion.button
          whileHover={{ scale: 1.15, y: -2 }}
          whileTap={{ scale: 0.9 }}
          onClick={onArchive}
          className="p-4 text-text-dim hover:text-primary hover:bg-primary/10 rounded-2xl transition-all"
          title="Archiwizuj">
          <Archive size={20} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.15, y: -2 }}
          whileTap={{ scale: 0.9 }}
          onClick={onDelete}
          className="p-4 text-text-dim hover:text-error hover:bg-error/10 rounded-2xl transition-all"
          title="Usuń">
          <Trash2 size={20} />
        </motion.button>
      </div>
    </motion.div>
  );
};

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [dayData, setDayData] = useState<DayCompletion | null>(null);
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitDescription, setNewHabitDescription] = useState("");
  const [newHabitTime, setNewHabitTime] = useState("");
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editingHabitName, setEditingHabitName] = useState("");
  const [stats7Days, setStats7Days] = useState({
    completionRate: 0,
    perfectDays: 0,
  });
  const [stats30Days, setStats30Days] = useState({
    completionRate: 0,
    perfectDays: 0,
  });
  const [yearlyHistory, setYearlyHistory] = useState<Record<string, number>>(
    {},
  );

  const [selectedDate, setSelectedDate] = useState(new Date());

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const formattedSelectedDate = format(selectedDate, "yyyy-MM-dd");
  const isTodaySelected = isSameDay(selectedDate, new Date());

  const goToPreviousDay = () => setSelectedDate((prev) => subDays(prev, 1));
  const goToNextDay = () => {
    if (!isTodaySelected) {
      setSelectedDate((prev) => addDays(prev, 1));
    }
  };
  const goToToday = () => setSelectedDate(new Date());

  useEffect(() => {
    if (!user) return;

    const unsubscribeHabits = habitService.subscribeToHabits(
      user.uid,
      setHabits,
    );
    const unsubscribeDay = habitService.subscribeToDay(
      user.uid,
      formattedSelectedDate,
      setDayData,
    );

    return () => {
      unsubscribeHabits();
      unsubscribeDay();
    };
  }, [user, formattedSelectedDate]);

  // Calculate streak and extended stats when habits change
  useEffect(() => {
    if (!user) return;

    const activeHabitIds = habits.filter((h) => !h.isArchived).map((h) => h.id);

    habitService
      .calculateStreak(user.uid, activeHabitIds)
      .then(setCurrentStreak);

    // Get 7-day stats
    habitService
      .getExtendedStats(user.uid, activeHabitIds, 7)
      .then(setStats7Days);

    // Get 30-day stats
    habitService
      .getExtendedStats(user.uid, activeHabitIds, 30)
      .then(setStats30Days);

    // Get yearly history
    habitService
      .getYearlyHistory(user.uid, activeHabitIds)
      .then(setYearlyHistory);
  }, [user, habits, dayData]);

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newHabitName.trim()) return;

    try {
      await habitService.addHabit(
        user.uid,
        newHabitName.trim(),
        habits.length,
        newHabitDescription.trim() || undefined,
        newHabitTime || undefined,
      );
      setNewHabitName("");
      setNewHabitDescription("");
      setNewHabitTime("");
      setIsAddingHabit(false);
      toast.success("Nawyk dodany pomyślnie!");
    } catch (error) {
      console.error("Error adding habit", error);
      toast.error("Wystąpił błąd podczas dodawania nawyku");
    }
  };

  const toggleHabit = async (habitId: string) => {
    if (!user) return;
    const isCompleted = dayData?.checks[habitId] || false;
    await habitService.toggleHabit(
      user.uid,
      formattedSelectedDate,
      habitId,
      !isCompleted,
    );
    if (!isCompleted) {
      toast.success("Nawyk wykonany! Brawo!", {
        icon: "👏",
      });
    }
  };

  const toggleArchive = async (habit: Habit) => {
    if (!user) return;
    await habitService.updateHabit(user.uid, habit.id, {
      isArchived: !habit.isArchived,
    });
    toast.info(
      habit.isArchived ? "Nawyk przywrócony" : "Nawyk przeniesiony do archiwum",
    );
  };

  const deleteHabit = async (habitId: string) => {
    if (!user || !window.confirm("Czy na pewno chcesz usunąć ten nawyk?"))
      return;
    await habitService.deleteHabit(user.uid, habitId);
    toast.error("Nawyk usunięty");
  };

  const startEditingHabit = (habit: Habit) => {
    setEditingHabitId(habit.id);
    setEditingHabitName(habit.name);
  };

  const saveEditingHabit = async () => {
    if (!user || !editingHabitId || !editingHabitName.trim()) return;
    await habitService.updateHabit(user.uid, editingHabitId, {
      name: editingHabitName.trim(),
    });
    setEditingHabitId(null);
    setEditingHabitName("");
  };

  const cancelEditingHabit = () => {
    setEditingHabitId(null);
    setEditingHabitName("");
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!user || !over || active.id === over.id) return;

    const oldIndex = activeHabits.findIndex((h) => h.id === active.id);
    const newIndex = activeHabits.findIndex((h) => h.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedHabits = arrayMove(activeHabits, oldIndex, newIndex);

      // Update order in Firestore
      for (let i = 0; i < reorderedHabits.length; i++) {
        await habitService.updateHabit(user.uid, reorderedHabits[i].id, {
          order: i,
        });
      }
    }
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
      <Toaster position="top-center" richColors theme="dark" closeButton />
      <NotificationManager habits={habits} dayData={dayData} />
      <div className="bg-mesh-premium" />

      <div className="max-w-[1400px] mx-auto px-6 py-10 relative z-10">
        {/* Header — full width */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-5">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-primary/30 shadow-2xl shadow-primary/20 flex-shrink-0 bg-primary/10 flex items-center justify-center text-primary font-black text-2xl">
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
                className="text-3xl font-black tracking-tight mb-0.5">
                Cześć,{" "}
                <span className="text-gradient-vibrant">
                  {user?.displayName?.split(" ")[0]}
                </span>
                !
              </motion.h2>
              <p className="text-text-dim text-base font-semibold flex items-center gap-2">
                <Calendar size={16} className="text-primary" />
                {format(selectedDate, "EEEE, d MMMM", { locale: pl })}
                {!isTodaySelected && (
                  <span className="text-xs font-black uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-md ml-2 border border-primary/20">
                    Tryb Historii
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white/5 p-1 rounded-2xl border border-white/10 shadow-xl overflow-hidden backdrop-blur-xl">
              <motion.button
                whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                whileTap={{ scale: 0.95 }}
                onClick={goToPreviousDay}
                className="p-2.5 text-text-dim hover:text-white transition-colors"
                title="Poprzedni dzień">
                <ChevronLeft size={22} />
              </motion.button>

              {!isTodaySelected && (
                <motion.button
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goToToday}
                  className="px-4 py-2 text-xs font-black uppercase tracking-wider text-primary border-l border-r border-white/5 flex items-center gap-2"
                  title="Wróć do dziś">
                  <RotateCcw size={14} />
                  Dziś
                </motion.button>
              )}

              <motion.button
                whileHover={{
                  backgroundColor: isTodaySelected
                    ? "transparent"
                    : "rgba(255,255,255,0.05)",
                }}
                whileTap={{ scale: isTodaySelected ? 1 : 0.95 }}
                onClick={goToNextDay}
                disabled={isTodaySelected}
                className={clsx(
                  "p-2.5 transition-colors",
                  isTodaySelected
                    ? "text-white/10 cursor-not-allowed"
                    : "text-text-dim hover:text-white",
                )}
                title="Następny dzień">
                <ChevronRight size={22} />
              </motion.button>
            </div>
            <Button
              variant="secondary"
              onClick={logout}
              className="border-white/10 shadow-xl">
              <LogOut size={18} />
              Wyloguj
            </Button>
          </div>
        </header>

        {/* Main horizontal grid: left = habits, right = stats */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-8 items-start">
          {/* LEFT COLUMN — Habits */}
          <div className="space-y-6">
            {/* Habits List */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black tracking-tight text-gradient">
                  Twoje Nawyki
                </h3>
                <Button
                  variant="primary"
                  onClick={() => setIsAddingHabit(true)}
                  className="rounded-2xl shadow-primary-glow">
                  <Plus size={18} />
                  Nowy nawyk
                </Button>
              </div>

              <AnimatePresence mode="wait">
                {isAddingHabit && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mb-6">
                    <Card className="glass-premium p-6 border-primary/30 bg-primary/5">
                      <form
                        onSubmit={handleAddHabit}
                        className="flex flex-col gap-4">
                        <div>
                          <input
                            autoFocus
                            type="text"
                            value={newHabitName}
                            onChange={(e) => setNewHabitName(e.target.value)}
                            placeholder="Co chcesz śledzić? (np. Bieganie 5km)"
                            className="w-full text-lg font-bold bg-transparent border-0 border-b-2 border-white/10 focus:border-primary px-0 py-2 placeholder-white/20 focus:ring-0 transition-colors"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="relative">
                            <AlignLeft
                              className="absolute left-3 top-3 text-text-dim"
                              size={18}
                            />
                            <input
                              type="text"
                              value={newHabitDescription}
                              onChange={(e) =>
                                setNewHabitDescription(e.target.value)
                              }
                              placeholder="Dodaj krótki opis lub motywację..."
                              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary/50 transition-colors"
                            />
                          </div>
                          <div className="relative">
                            <Clock
                              className="absolute left-3 top-3 text-text-dim"
                              size={18}
                            />
                            <input
                              type="time"
                              value={newHabitTime}
                              onChange={(e) => setNewHabitTime(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary/50 transition-colors [color-scheme:dark]"
                            />
                          </div>
                        </div>

                        <div className="flex gap-3 mt-2 justify-end">
                          <Button
                            variant="ghost"
                            type="button"
                            onClick={() => setIsAddingHabit(false)}>
                            Anuluj
                          </Button>
                          <Button
                            type="submit"
                            className="px-8 shadow-primary-glow">
                            <Plus size={18} />
                            Dodaj nawyk
                          </Button>
                        </div>
                      </form>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}>
                <SortableContext
                  items={activeHabits.map((h) => h.id)}
                  strategy={verticalListSortingStrategy}>
                  <motion.div layout className="space-y-3">
                    {activeHabits.length === 0 && !isAddingHabit && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-20 glass-premium rounded-[3rem] border-dashed border-white/10">
                        <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-2xl animate-float">
                          <Target className="text-primary" size={40} />
                        </div>
                        <h4 className="text-xl font-black mb-2">
                          Zacznij swoją podróż
                        </h4>
                        <p className="text-text-dim mb-8 max-w-xs mx-auto font-medium text-sm">
                          Nie masz jeszcze żadnych aktywnych nawyków. Pora to
                          zmienić!
                        </p>
                        <Button
                          variant="primary"
                          onClick={() => setIsAddingHabit(true)}
                          className="rounded-2xl px-10 shadow-primary-glow">
                          Stwórz pierwszy nawyk
                        </Button>
                      </motion.div>
                    )}

                    <AnimatePresence>
                      {activeHabits.map((habit) => {
                        const isCompleted = dayData?.checks[habit.id] || false;
                        const isEditing = editingHabitId === habit.id;
                        return (
                          <SortableHabitItem
                            key={habit.id}
                            habit={habit}
                            isCompleted={isCompleted}
                            isEditing={isEditing}
                            editingName={editingHabitName}
                            onToggle={() => toggleHabit(habit.id)}
                            onStartEdit={() => startEditingHabit(habit)}
                            onSaveEdit={saveEditingHabit}
                            onCancelEdit={cancelEditingHabit}
                            onEditNameChange={setEditingHabitName}
                            onArchive={() => toggleArchive(habit)}
                            onDelete={() => deleteHabit(habit.id)}
                          />
                        );
                      })}
                    </AnimatePresence>
                  </motion.div>
                </SortableContext>
              </DndContext>
            </section>

            {/* Archives (left column, below habits) */}
            {archivedHabits.length > 0 && (
              <section>
                <h3 className="text-base font-black mb-4 text-text-dim uppercase tracking-widest px-2">
                  Zarchiwizowane
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {archivedHabits.map((habit) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={habit.id}
                      className="group flex items-center justify-between p-4 px-6 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all">
                      <span className="text-text-dim font-bold">
                        {habit.name}
                      </span>
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

          {/* RIGHT COLUMN — Stats & Graph */}
          <div className="space-y-5 xl:sticky xl:top-8">
            {/* Day Progress */}
            <Card
              glass
              className="glass-premium card-hover flex flex-col justify-between p-6 border-primary/20 bg-primary/5">
              <div className="flex items-center justify-between mb-5">
                <span className="text-text-muted text-xs font-black uppercase tracking-[0.2em]">
                  Postęp dnia
                </span>
                <div className="p-2.5 bg-primary/20 rounded-xl text-primary shadow-inner shadow-white/10">
                  <CheckCircle2 size={20} />
                </div>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-black font-heading text-gradient">
                  {progressPercent}%
                </span>
                <span className="text-text-dim text-sm font-bold bg-white/5 px-3 py-1 rounded-lg">
                  {completedCount}/{activeHabits.length}
                </span>
              </div>
              <div className="mt-5 h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[2px]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full shadow-[0_0_20px_var(--primary-glow)]"
                />
              </div>
            </Card>

            {/* Streak + Active row */}
            <div className="grid grid-cols-2 gap-4">
              <Card
                glass
                className="glass-premium card-hover flex flex-col justify-between p-5 border-secondary/20 bg-secondary/5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-text-muted text-xs font-black uppercase tracking-[0.15em]">
                    Streak
                  </span>
                  <div className="p-2 bg-secondary/20 rounded-xl text-secondary">
                    <TrendingUp size={18} />
                  </div>
                </div>
                <span className="text-3xl font-black font-heading text-gradient-vibrant">
                  {currentStreak}
                </span>
                <p className="mt-3 text-text-dim text-xs font-semibold leading-snug">
                  {currentStreak === 1 ? "dzień" : "dni"}{" "}
                  {currentStreak >= 7 && (
                    <span className="text-secondary font-black">
                      🔥 Rekord!
                    </span>
                  )}
                </p>
              </Card>

              <Card
                glass
                className="glass-premium card-hover flex flex-col justify-between p-5 border-accent/20 bg-accent/5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-text-muted text-xs font-black uppercase tracking-[0.15em]">
                    Aktywne
                  </span>
                  <div className="p-2 bg-accent/20 rounded-xl text-accent">
                    <Calendar size={18} />
                  </div>
                </div>
                <span className="text-3xl font-black font-heading text-gradient">
                  {activeHabits.length}
                </span>
                <p className="mt-3 text-text-dim text-xs font-semibold">
                  nawyki
                </p>
              </Card>
            </div>

            {/* Contribution Graph */}
            <Card
              glass
              className="glass-premium p-5 border-primary/20 bg-primary/5 overflow-hidden">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-2 bg-primary/20 rounded-xl text-primary">
                  <Calendar size={18} />
                </div>
                <h3 className="text-base font-black tracking-tight text-white">
                  Aktywność w ostatnim roku
                </h3>
              </div>
              <ContributionGraph
                data={yearlyHistory}
                totalHabits={activeHabits.length}
              />
            </Card>

            {/* Extended stats row */}
            <div className="grid grid-cols-3 gap-3">
              <Card
                glass
                className="glass-premium card-hover flex flex-col p-4 border-success/20 bg-success/5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-text-muted text-[10px] font-black uppercase tracking-wider">
                    7 dni
                  </span>
                  <div className="p-1.5 bg-success/20 rounded-lg text-success">
                    <BarChart3 size={14} />
                  </div>
                </div>
                <span className="text-2xl font-black font-heading text-gradient">
                  {stats7Days.completionRate}%
                </span>
                <p className="mt-2 text-text-dim text-[10px] font-semibold leading-tight opacity-70">
                  Tydzień
                </p>
              </Card>

              <Card
                glass
                className="glass-premium card-hover flex flex-col p-4 border-accent/20 bg-accent/5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-text-muted text-[10px] font-black uppercase tracking-wider">
                    30 dni
                  </span>
                  <div className="p-1.5 bg-accent/20 rounded-lg text-accent">
                    <BarChart3 size={14} />
                  </div>
                </div>
                <span className="text-2xl font-black font-heading text-gradient">
                  {stats30Days.completionRate}%
                </span>
                <p className="mt-2 text-text-dim text-[10px] font-semibold leading-tight opacity-70">
                  Miesiąc
                </p>
              </Card>

              <Card
                glass
                className="glass-premium card-hover flex flex-col p-4 border-warning/20 bg-warning/5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-text-muted text-[10px] font-black uppercase tracking-wider">
                    Perf.
                  </span>
                  <div className="p-1.5 bg-warning/20 rounded-lg text-warning">
                    <Award size={14} />
                  </div>
                </div>
                <span className="text-2xl font-black font-heading text-gradient-vibrant">
                  {stats30Days.perfectDays}
                </span>
                <p className="mt-2 text-text-dim text-[10px] font-semibold leading-tight opacity-70">
                  Dni
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
