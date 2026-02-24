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
    <div className="h-screen w-screen overflow-hidden relative flex bg-mesh-premium">
      <Toaster position="top-center" richColors theme="dark" closeButton />
      <NotificationManager habits={habits} dayData={dayData} />

      {/* COLUMN 1: SIDEBAR (User, Navigation, & Logout) */}
      <aside className="relative z-20 w-80 flex-shrink-0 flex flex-col border-r border-white/5 bg-black/20 backdrop-blur-2xl">
        <div className="p-8 flex flex-col h-full">
          {/* User Profile */}
          <div className="flex flex-col items-center text-center mb-10">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 2 }}
              className="w-24 h-24 rounded-[2rem] overflow-hidden border-2 border-primary/30 bg-primary/10 flex items-center justify-center text-primary font-black text-3xl shadow-2xl mb-5">
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
            <h2 className="text-2xl font-black tracking-tight leading-tight mb-1">
              Cześć, <br />
              <span className="text-gradient-vibrant">
                {user?.displayName?.split(" ")[0]}
              </span>
            </h2>
            <p className="text-text-dim text-sm font-semibold opacity-60">
              Miło Cię widzieć!
            </p>
          </div>

          {/* Date Selection */}
          <div className="flex flex-col gap-4 mb-auto">
            <div className="bg-white/5 rounded-3xl border border-white/10 p-2">
              <div className="flex items-center justify-between mb-2 px-2 pt-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-text-dim">
                  Data
                </span>
                {!isTodaySelected && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={goToToday}
                    className="text-[10px] font-black uppercase tracking-tight text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                    Wróć do dziś
                  </motion.button>
                )}
              </div>
              <div className="flex items-center justify-between gap-1">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={goToPreviousDay}
                  className="p-3 text-text-dim hover:text-white hover:bg-white/5 rounded-2xl transition-colors">
                  <ChevronLeft size={20} />
                </motion.button>
                <div className="flex-1 text-center">
                  <div className="text-lg font-bold text-white leading-none mb-1">
                    {format(selectedDate, "d MMMM", { locale: pl })}
                  </div>
                  <div className="text-[11px] font-bold text-text-dim uppercase tracking-wider">
                    {format(selectedDate, "EEEE", { locale: pl })}
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: isTodaySelected ? 1 : 0.9 }}
                  onClick={goToNextDay}
                  disabled={isTodaySelected}
                  className={clsx(
                    "p-3 rounded-2xl transition-colors",
                    isTodaySelected
                      ? "text-white/10 cursor-not-allowed"
                      : "text-text-dim hover:text-white hover:bg-white/5",
                  )}>
                  <ChevronRight size={20} />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Logout */}
          <Button
            variant="secondary"
            onClick={logout}
            className="w-full justify-start rounded-2xl border-white/5 hover:border-white/20 px-6 py-4">
            <LogOut size={18} className="mr-3" />
            Wyloguj się
          </Button>
        </div>
      </aside>

      {/* COLUMN 2: MAIN CONTENT (Habits) */}
      <main className="relative z-10 flex-1 flex flex-col min-w-0 bg-white/[0.01]">
        <div className="flex flex-col h-full p-10">
          {/* Header Area */}
          <div className="flex items-center justify-between mb-8 flex-shrink-0">
            <div>
              <h3 className="text-4xl font-black tracking-tight text-gradient mb-1">
                Twoje Nawyki
              </h3>
              <p className="text-text-muted font-medium">
                {activeHabits.length} aktywnych nawyków na dzisiaj
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => setIsAddingHabit(true)}
              className="rounded-[1.25rem] shadow-primary-glow px-8 h-14">
              <Plus size={22} className="mr-2" />
              Nowy nawyk
            </Button>
          </div>

          {/* Add Habit Form */}
          <AnimatePresence mode="wait">
            {isAddingHabit && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-8 flex-shrink-0">
                <Card className="glass-premium p-8 border-primary/20 bg-primary/5 rounded-[2.5rem]">
                  <form
                    onSubmit={handleAddHabit}
                    className="flex flex-col gap-6">
                    <input
                      autoFocus
                      type="text"
                      value={newHabitName}
                      onChange={(e) => setNewHabitName(e.target.value)}
                      placeholder="Co chcesz śledzić? (np. Bieganie 5km)"
                      className="w-full text-2xl font-bold bg-transparent border-0 border-b-2 border-white/10 focus:border-primary px-0 py-3 placeholder-white/10 focus:ring-0 transition-all"
                    />
                    <div className="grid grid-cols-2 gap-6">
                      <div className="relative">
                        <AlignLeft
                          className="absolute left-4 top-4 text-text-dim"
                          size={18}
                        />
                        <input
                          type="text"
                          value={newHabitDescription}
                          onChange={(e) =>
                            setNewHabitDescription(e.target.value)
                          }
                          placeholder="Opis lub motywacja..."
                          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-base text-text-main focus:outline-none focus:border-primary/50 transition-colors"
                        />
                      </div>
                      <div className="relative">
                        <Clock
                          className="absolute left-4 top-4 text-text-dim"
                          size={18}
                        />
                        <input
                          type="time"
                          value={newHabitTime}
                          onChange={(e) => setNewHabitTime(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-base text-text-main focus:outline-none focus:border-primary/50 transition-colors [color-scheme:dark]"
                        />
                      </div>
                    </div>
                    <div className="flex gap-4 justify-end mt-2">
                      <Button
                        variant="ghost"
                        type="button"
                        onClick={() => setIsAddingHabit(false)}
                        className="px-8">
                        Anuluj
                      </Button>
                      <Button
                        type="submit"
                        className="px-10 shadow-primary-glow">
                        <Plus size={20} className="mr-2" />
                        Dodaj Nawyk
                      </Button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Habits Scrollable Area */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-4 -mr-4 scrollbar-premium">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}>
              <SortableContext
                items={activeHabits.map((h) => h.id)}
                strategy={verticalListSortingStrategy}>
                <motion.div layout className="space-y-4">
                  {activeHabits.length === 0 && !isAddingHabit && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-24 glass-premium rounded-[3rem] border-dashed border-white/10 bg-white/[0.01]">
                      <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-white/10 shadow-2xl animate-float">
                        <Target className="text-primary" size={48} />
                      </div>
                      <h4 className="text-3xl font-black mb-4">
                        Zacznij swoją podróż
                      </h4>
                      <p className="text-text-muted mb-10 max-w-sm mx-auto font-medium">
                        Nie masz jeszcze żadnych aktywnych nawyków. Dodaj
                        pierwszy, aby zacząć budować lepszą wersję siebie.
                      </p>
                      <Button
                        variant="primary"
                        onClick={() => setIsAddingHabit(true)}
                        className="rounded-2xl px-12 h-16 text-lg shadow-primary-glow">
                        Stwórz pierwszy nawyk
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
                    <div className="pt-10">
                      <div className="flex items-center gap-4 mb-6">
                        <h3 className="text-xs font-black text-text-dim uppercase tracking-[0.3em] whitespace-nowrap">
                          Zarchiwizowane
                        </h3>
                        <div className="h-px w-full bg-white/5" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {archivedHabits.map((habit) => (
                          <motion.div
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            key={habit.id}
                            className="group flex items-center justify-between p-4 px-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                            <span className="text-text-dim font-bold">
                              {habit.name}
                            </span>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => toggleArchive(habit)}
                              className="text-[10px] font-black text-primary opacity-0 group-hover:opacity-100 transition-all bg-primary/10 px-4 py-2 rounded-xl border border-primary/20 hover:bg-primary hover:text-white uppercase tracking-widest">
                              Przywróć
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
      <aside className="relative z-10 w-96 flex-shrink-0 flex flex-col border-l border-white/5 bg-black/10 backdrop-blur-xl">
        <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 scrollbar-premium">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/20 rounded-xl text-primary">
              <BarChart3 size={18} />
            </div>
            <h3 className="text-lg font-black tracking-tight text-white uppercase tracking-[0.1em]">
              Statystyki
            </h3>
          </div>

          {/* Row 1: Day Progress */}
          <Card
            glass
            className="glass-premium p-6 border-primary/20 bg-primary/5 rounded-[2rem]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-text-muted text-[11px] font-black uppercase tracking-[0.2em]">
                Postęp dnia
              </span>
              <div className="p-2 bg-primary/20 rounded-xl text-primary">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="flex items-end justify-between mb-4">
              <span className="text-5xl font-black font-heading text-gradient">
                {progressPercent}%
              </span>
              <span className="text-text-dim text-sm font-bold bg-white/5 px-4 py-1.5 rounded-xl border border-white/5">
                {completedCount}/{activeHabits.length}
              </span>
            </div>
            <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="h-full bg-gradient-to-r from-primary via-secondary to-accent rounded-full shadow-[0_0_20px_var(--primary-glow)]"
              />
            </div>
          </Card>

          {/* Row 2: Secondary Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Card
              glass
              className="glass-premium card-hover p-6 border-secondary/20 bg-secondary/5 rounded-[2rem]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-text-muted text-[10px] font-black uppercase tracking-widest">
                  Streak
                </span>
                <div className="p-2 bg-secondary/20 rounded-xl text-secondary">
                  <TrendingUp size={18} />
                </div>
              </div>
              <span className="text-4xl font-black font-heading text-gradient-vibrant">
                {currentStreak}
              </span>
              <p className="mt-2 text-text-dim text-xs font-bold uppercase tracking-widest">
                {currentStreak === 1 ? "Dzień" : "Dni"}
                {currentStreak >= 3 && (
                  <span className="text-secondary ml-2">🔥</span>
                )}
              </p>
            </Card>

            <Card
              glass
              className="glass-premium card-hover p-6 border-accent/20 bg-accent/5 rounded-[2rem]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-text-muted text-[10px] font-black uppercase tracking-widest">
                  Idealne dni
                </span>
                <div className="p-2 bg-accent/20 rounded-xl text-accent">
                  <Award size={18} />
                </div>
              </div>
              <span className="text-4xl font-black font-heading text-gradient">
                {stats30Days.perfectDays}
              </span>
              <p className="mt-2 text-text-dim text-xs font-bold uppercase tracking-widest">
                w ty miesiącu
              </p>
            </Card>
          </div>

          {/* Row 3: Contribution Graph */}
          <Card
            glass
            className="glass-premium p-6 border-white/5 bg-white/[0.02] rounded-[2rem] overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-xl text-text-muted">
                  <Calendar size={18} />
                </div>
                <h3 className="text-xs font-black tracking-widest text-white uppercase">
                  Aktywność (rok)
                </h3>
              </div>
            </div>
            <div className="px-1">
              <ContributionGraph
                data={yearlyHistory}
                totalHabits={activeHabits.length}
              />
            </div>
          </Card>

          {/* Row 4: Detailed Rates */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between p-5 glass-premium bg-success/5 border-success/20 rounded-2xl">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-success/70 block mb-1">
                  Średnia 7 dni
                </span>
                <span className="text-2xl font-black text-white">
                  {stats7Days.completionRate}%
                </span>
              </div>
              <div className="w-12 h-12 bg-success/20 rounded-xl flex items-center justify-center text-success">
                <BarChart3 size={20} />
              </div>
            </div>

            <div className="flex items-center justify-between p-5 glass-premium bg-accent/5 border-accent/20 rounded-2xl">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent/70 block mb-1">
                  Średnia 30 dni
                </span>
                <span className="text-2xl font-black text-white">
                  {stats30Days.completionRate}%
                </span>
              </div>
              <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center text-accent">
                <BarChart3 size={20} />
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Dashboard;
