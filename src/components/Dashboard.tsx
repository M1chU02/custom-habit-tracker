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
    <div className="h-screen w-screen overflow-hidden relative flex selection:bg-primary/30">
      {/* BACKGROUND LAYER - Fixed background mesh that doesn't block interactions */}
      <div className="fixed inset-0 z-0 bg-mesh-premium" />

      <Toaster position="top-center" richColors theme="dark" closeButton />
      <NotificationManager habits={habits} dayData={dayData} />

      {/* COLUMN 1: SIDEBAR (User, Navigation, & Logout) */}
      <aside className="relative z-20 w-80 flex-shrink-0 flex flex-col border-r border-white/5 bg-black/40 backdrop-blur-3xl">
        <div className="p-10 flex flex-col h-full">
          {/* Logo/Brand Area */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
              <Award className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-black tracking-tight text-white uppercase italic">
              Habitu
            </h1>
          </div>

          {/* User Profile */}
          <div className="flex flex-col items-center text-center mb-12">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 2 }}
              className="w-28 h-28 rounded-[2.5rem] overflow-hidden border-2 border-primary/30 bg-primary/10 flex items-center justify-center text-primary font-black text-4xl shadow-2xl mb-6 ring-4 ring-white/5">
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
            <h2 className="text-2xl font-black tracking-tight leading-tight mb-2">
              Cześć, <br />
              <span className="text-gradient-vibrant">
                {user?.displayName?.split(" ")[0]}
              </span>
            </h2>
            <div className="flex items-center gap-2 text-text-dim text-sm font-bold opacity-60 bg-white/5 py-1 px-3 rounded-full">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Online
            </div>
          </div>

          {/* Date Selection */}
          <div className="flex flex-col gap-4 mb-auto">
            <div className="bg-white/5 rounded-[2rem] border border-white/10 p-3 shadow-inner">
              <div className="flex items-center justify-between mb-4 px-3 pt-1">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-dim">
                    Data dzisiejsza
                  </span>
                </div>
                {!isTodaySelected && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={goToToday}
                    className="text-[10px] font-black uppercase tracking-tight text-primary bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20 hover:bg-primary/20 transition-colors">
                    Dziś
                  </motion.button>
                )}
              </div>
              <div className="flex items-center justify-between gap-1">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={goToPreviousDay}
                  className="p-3 text-text-dim hover:text-white hover:bg-white/10 rounded-2xl transition-all">
                  <ChevronLeft size={20} />
                </motion.button>
                <div className="flex-1 text-center">
                  <div className="text-xl font-black text-white leading-none mb-1">
                    {format(selectedDate, "d MMMM", { locale: pl })}
                  </div>
                  <div className="text-[11px] font-bold text-text-muted uppercase tracking-widest">
                    {format(selectedDate, "EEEE", { locale: pl })}
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: isTodaySelected ? 1 : 0.9 }}
                  onClick={goToNextDay}
                  disabled={isTodaySelected}
                  className={clsx(
                    "p-3 rounded-2xl transition-all",
                    isTodaySelected
                      ? "text-white/10 cursor-not-allowed"
                      : "text-text-dim hover:text-white hover:bg-white/10",
                  )}>
                  <ChevronRight size={20} />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Logout */}
          <Button
            variant="ghost"
            onClick={logout}
            className="w-full justify-start rounded-2xl hover:bg-error/10 hover:text-error px-6 py-4 opacity-70 hover:opacity-100 transition-all border-dashed border-white/10">
            <LogOut size={18} className="mr-3" />
            Wyloguj się
          </Button>
        </div>
      </aside>

      {/* COLUMN 2: MAIN CONTENT (Habits) */}
      <main className="relative z-10 flex-1 flex flex-col min-w-0 bg-transparent">
        <div className="flex flex-col h-full p-12 lg:px-16">
          {/* Header Area */}
          <div className="flex items-end justify-between mb-12 flex-shrink-0">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="px-3 py-1 bg-primary/15 text-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20 shadow-sm shadow-primary/10">
                  Dzisiejsza lista
                </div>
              </div>
              <h1 className="text-5xl font-black tracking-tighter text-gradient leading-tight">
                Twoje Nawyki
              </h1>
            </div>
            <Button
              variant="primary"
              onClick={() => setIsAddingHabit(true)}
              className="rounded-2xl shadow-primary-glow px-8 h-16 text-md border-0 bg-gradient-to-r from-primary to-primary-deep group">
              <Plus
                size={24}
                className="mr-2 group-hover:rotate-90 transition-transform"
              />
              Nowy nawyk
            </Button>
          </div>

          {/* Add Habit Form */}
          <AnimatePresence mode="wait">
            {isAddingHabit && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-10 flex-shrink-0">
                <Card className="glass-premium p-10 border-primary/20 bg-primary/5 rounded-[3rem] shadow-2xl">
                  <form
                    onSubmit={handleAddHabit}
                    className="flex flex-col gap-8">
                    <input
                      autoFocus
                      type="text"
                      value={newHabitName}
                      onChange={(e) => setNewHabitName(e.target.value)}
                      placeholder="Co chcesz śledzić?"
                      className="w-full text-3xl font-black bg-transparent border-0 border-b-2 border-white/10 focus:border-primary px-0 py-4 placeholder-white/5 focus:ring-0 transition-all"
                    />
                    <div className="grid grid-cols-2 gap-8">
                      <div className="relative group">
                        <AlignLeft
                          className="absolute left-5 top-5 text-text-dim group-focus-within:text-primary transition-colors"
                          size={18}
                        />
                        <input
                          type="text"
                          value={newHabitDescription}
                          onChange={(e) =>
                            setNewHabitDescription(e.target.value)
                          }
                          placeholder="Opisz swój cel..."
                          className="w-full bg-white/[0.03] border border-white/10 rounded-[1.5rem] pl-14 pr-6 py-5 text-base text-text-main focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all"
                        />
                      </div>
                      <div className="relative group">
                        <Clock
                          className="absolute left-5 top-5 text-text-dim group-focus-within:text-primary transition-colors"
                          size={18}
                        />
                        <input
                          type="time"
                          value={newHabitTime}
                          onChange={(e) => setNewHabitTime(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/10 rounded-[1.5rem] pl-14 pr-6 py-5 text-base text-text-main focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all [color-scheme:dark]"
                        />
                      </div>
                    </div>
                    <div className="flex gap-4 justify-end">
                      <button
                        type="button"
                        onClick={() => setIsAddingHabit(false)}
                        className="px-8 py-4 font-black text-text-dim hover:text-white transition-colors">
                        Anuluj
                      </button>
                      <Button
                        type="submit"
                        className="px-12 h-16 shadow-primary-glow border-0 bg-primary text-white font-black text-lg">
                        Dodaj Teraz
                      </Button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Habits Scrollable Area */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-6 -mr-6 scrollbar-premium">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}>
              <SortableContext
                items={activeHabits.map((h) => h.id)}
                strategy={verticalListSortingStrategy}>
                <motion.div layout className="space-y-5 pb-10">
                  {activeHabits.length === 0 && !isAddingHabit && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-24 glass-premium rounded-[3rem] border-dashed border-white/10 bg-white/[0.01]">
                      <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-white/10 shadow-2xl animate-float">
                        <Target className="text-primary" size={48} />
                      </div>
                      <h4 className="text-3xl font-black mb-4">
                        Czas na nowe wyzwania
                      </h4>
                      <p className="text-text-muted mb-10 max-w-sm mx-auto font-medium leading-relaxed">
                        Nie masz jeszcze żadnych aktywnych nawyków. Dodaj
                        pierwszy, aby zacząć budować lepszą wersję siebie.
                      </p>
                      <Button
                        variant="primary"
                        onClick={() => setIsAddingHabit(true)}
                        className="rounded-3xl px-12 h-20 text-xl font-black shadow-primary-glow border-0">
                        Zacznij Już Dziś
                      </Button>
                    </motion.div>
                  )}
                  <AnimatePresence mode="popLayout">
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

                  {/* Archived Area */}
                  {archivedHabits.length > 0 && (
                    <div className="pt-20">
                      <div className="flex items-center gap-6 mb-8">
                        <h3 className="text-[10px] font-black text-text-dim/60 uppercase tracking-[0.5em] whitespace-nowrap">
                          Archiwum Nawyki
                        </h3>
                        <div className="h-px w-full bg-white/5" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {archivedHabits.map((habit) => (
                          <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            key={habit.id}
                            className="group flex flex-col items-start gap-4 p-6 rounded-3xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10 transition-all">
                            <span className="text-text-dim/80 font-black text-lg truncate w-full">
                              {habit.name}
                            </span>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => toggleArchive(habit)}
                              className="w-full text-[10px] font-black text-primary bg-primary/10 px-4 py-3 rounded-2xl border border-primary/20 hover:bg-primary hover:text-white uppercase tracking-[0.2em] transition-all">
                              Odarchiwizuj
                            </motion.button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </main>

      {/* COLUMN 3: STATS PANEL */}
      <aside className="relative z-10 w-[26rem] flex-shrink-0 flex flex-col border-l border-white/5 bg-black/30 backdrop-blur-2xl">
        <div className="flex-1 overflow-y-auto p-10 flex flex-col gap-8 scrollbar-premium">
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/20 rounded-2xl text-primary shadow-lg shadow-primary/10 ring-1 ring-primary/30">
                <BarChart3 size={20} />
              </div>
              <h3 className="text-xl font-black tracking-tight text-white uppercase italic tracking-wider">
                Progress
              </h3>
            </div>
          </div>

          {/* Row 1: Day Progress */}
          <Card
            glass
            className="glass-premium p-8 border-primary/20 bg-primary/5 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <CheckCircle2 size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <span className="text-text-muted text-[11px] font-black uppercase tracking-[0.3em]">
                  Dzisiejszy Cel
                </span>
                <div className="px-3 py-1 bg-white/5 rounded-full text-text-muted text-xs font-bold border border-white/5">
                  Live
                </div>
              </div>
              <div className="flex items-baseline justify-between mb-6">
                <span className="text-6xl font-black font-heading text-primary text-glow">
                  {progressPercent}%
                </span>
                <span className="text-text-dim text-lg font-black bg-white/5 px-4 py-1.5 rounded-2xl border border-white/5">
                  {completedCount}/{activeHabits.length}
                </span>
              </div>
              <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/5 p-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full bg-gradient-to-r from-primary via-secondary to-accent rounded-full shadow-[0_0_25px_var(--primary-glow)] relative">
                  <div className="absolute inset-0 bg-white/20 animate-pulse opacity-50" />
                </motion.div>
              </div>
            </div>
          </Card>

          {/* Row 2: Secondary Stats Grid */}
          <div className="grid grid-cols-2 gap-5">
            <Card
              glass
              className="glass-premium card-hover p-8 border-secondary/20 bg-secondary/5 rounded-[2.5rem]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em]">
                  Streak
                </span>
                <TrendingUp size={20} className="text-secondary opacity-50" />
              </div>
              <span className="text-5xl font-black font-heading text-secondary text-glow">
                {currentStreak}
              </span>
              <p className="mt-2 text-text-dim text-[10px] font-black uppercase tracking-[0.4em]">
                {currentStreak === 1 ? "Dzień" : "Dni"}
                {currentStreak >= 3 && (
                  <span className="text-secondary ml-2">🔥</span>
                )}
              </p>
            </Card>

            <Card
              glass
              className="glass-premium card-hover p-8 border-accent/20 bg-accent/5 rounded-[2.5rem]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em]">
                  Perf.
                </span>
                <Award size={20} className="text-accent opacity-50" />
              </div>
              <span className="text-5xl font-black font-heading text-accent text-glow">
                {stats30Days.perfectDays}
              </span>
              <p className="mt-2 text-text-dim text-[10px] font-black uppercase tracking-[0.4em]">
                Dni (30d)
              </p>
            </Card>
          </div>

          {/* Row 3: Contribution Graph */}
          <Card
            glass
            className="glass-premium p-8 border-white/5 bg-white/[0.02] rounded-[3rem] overflow-hidden flex flex-col justify-center min-h-[220px]">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/5 rounded-2xl text-text-muted border border-white/10">
                  <BarChart3 size={18} />
                </div>
                <h3 className="text-xs font-black tracking-[0.4em] text-white uppercase italic">
                  Activity
                </h3>
              </div>
              <div className="text-[10px] font-black text-text-dim uppercase tracking-widest">
                Last 365 days
              </div>
            </div>
            <div className="scale-[1.05] origin-center">
              <ContributionGraph
                data={yearlyHistory}
                totalHabits={activeHabits.length}
              />
            </div>
          </Card>

          {/* Row 4: Detailed Rates */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-7 glass-premium bg-gradient-to-br from-success/5 to-transparent border-success/20 rounded-[2rem] group hover:scale-[1.02] transition-transform">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-success/70 block mb-2">
                  Last 7 Days
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white italic">
                    {stats7Days.completionRate}%
                  </span>
                  <span className="text-success text-xs font-black">
                    Average
                  </span>
                </div>
              </div>
              <div className="w-16 h-16 bg-success/15 rounded-3xl flex items-center justify-center text-success shadow-lg shadow-success/10 border border-success/20 group-hover:bg-success/25 transition-colors">
                <Target size={24} />
              </div>
            </div>

            <div className="flex items-center justify-between p-7 glass-premium bg-gradient-to-br from-accent/5 to-transparent border-accent/20 rounded-[2rem] group hover:scale-[1.02] transition-transform">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent/70 block mb-2">
                  Last 30 Days
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white italic">
                    {stats30Days.completionRate}%
                  </span>
                  <span className="text-accent text-xs font-black">
                    Average
                  </span>
                </div>
              </div>
              <div className="w-16 h-16 bg-accent/15 rounded-3xl flex items-center justify-center text-accent shadow-lg shadow-accent/10 border border-accent/20 group-hover:bg-accent/25 transition-colors">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Dashboard;
