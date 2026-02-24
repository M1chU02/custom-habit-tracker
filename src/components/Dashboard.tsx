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
      {/* BACKGROUND LAYER */}
      <div className="fixed inset-0 z-0 bg-mesh-premium" />

      <Toaster position="top-center" richColors theme="dark" closeButton />
      <NotificationManager habits={habits} dayData={dayData} />

      {/* COLUMN 1: SIDEBAR (User & Nav) */}
      <aside className="relative z-20 w-72 flex-shrink-0 flex flex-col border-r border-white/5 bg-black/40 backdrop-blur-3xl">
        <div className="p-8 flex flex-col h-full">
          {/* Logo Area */}
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
              <Award className="text-white" size={16} />
            </div>
            <h1 className="text-lg font-black tracking-tight text-white italic uppercase">
              Habitu
            </h1>
          </div>

          {/* User Profile */}
          <div className="flex flex-col items-center text-center mb-10">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 1 }}
              className="w-20 h-20 rounded-[2rem] overflow-hidden border border-white/10 bg-primary/10 flex items-center justify-center text-primary font-black text-2xl shadow-xl mb-4 ring-2 ring-white/5">
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
            <h2 className="text-xl font-black tracking-tight leading-tight mb-1.5">
              Cześć,{" "}
              <span className="text-gradient-vibrant">
                {user?.displayName?.split(" ")[0]}
              </span>
            </h2>
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-text-dim/60 bg-white/5 py-1 px-2.5 rounded-full border border-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Online
            </div>
          </div>

          {/* Date Picker */}
          <div className="flex flex-col gap-3 mb-auto">
            <div className="bg-white/5 rounded-[1.5rem] border border-white/10 p-3 shadow-sm px-4">
              <div className="flex items-center justify-between mb-3 pt-0.5">
                <div className="flex items-center gap-2">
                  <Calendar size={12} className="text-primary opacity-50" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-text-dim/60">
                    Kalendarz
                  </span>
                </div>
                {!isTodaySelected && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={goToToday}
                    className="text-[9px] font-black uppercase tracking-tight text-primary hover:text-white transition-colors">
                    Dzisiaj
                  </motion.button>
                )}
              </div>
              <div className="flex items-center justify-between">
                <button
                  onClick={goToPreviousDay}
                  className="p-1.5 text-text-dim hover:text-white transition-colors">
                  <ChevronLeft size={18} />
                </button>
                <div className="flex-1 text-center">
                  <div className="text-sm font-black text-white leading-none mb-0.5">
                    {format(selectedDate, "d MMMM", { locale: pl })}
                  </div>
                  <div className="text-[10px] font-bold text-text-dim/40 uppercase">
                    {format(selectedDate, "EEEE", { locale: pl })}
                  </div>
                </div>
                <button
                  onClick={goToNextDay}
                  disabled={isTodaySelected}
                  className={clsx(
                    "p-1.5 transition-colors",
                    isTodaySelected
                      ? "text-white/5"
                      : "text-text-dim hover:text-white",
                  )}>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Logout */}
          <Button
            variant="ghost"
            onClick={logout}
            className="w-full justify-start rounded-xl h-12 px-5 opacity-50 hover:opacity-100 hover:bg-error/5 hover:text-error transition-all">
            <LogOut size={16} className="mr-3" />
            <span className="text-xs font-bold">Wyloguj</span>
          </Button>
        </div>
      </aside>

      {/* COLUMN 2: HABITS (Main Content) */}
      <main className="relative z-10 flex-1 flex flex-col min-w-0">
        <div className="flex flex-col h-full p-10 lg:p-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-10 flex-shrink-0">
            <div>
              <div className="px-2.5 py-1 bg-white/5 rounded-lg inline-block border border-white/10 mb-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-primary">
                  Twoja lista
                </span>
              </div>
              <h1 className="text-4xl font-black tracking-tighter text-gradient leading-tight">
                Twoje Nawyki
              </h1>
            </div>
            <Button
              variant="primary"
              onClick={() => setIsAddingHabit(true)}
              className="rounded-xl px-6 h-12 text-sm shadow-primary-glow border-0">
              <Plus size={18} className="mr-2" />
              Nowy nawyk
            </Button>
          </div>

          <AnimatePresence>
            {isAddingHabit && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="mb-8">
                <Card className="glass-premium p-8 border-primary/20 bg-primary/5 rounded-[2rem]">
                  <form
                    onSubmit={handleAddHabit}
                    className="flex flex-col gap-6">
                    <input
                      autoFocus
                      type="text"
                      className="w-full text-2xl font-black bg-transparent border-0 border-b border-white/10 focus:border-primary px-0 py-2 focus:ring-0 placeholder-white/5"
                      placeholder="Co chcesz śledzić?"
                      value={newHabitName}
                      onChange={(e) => setNewHabitName(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <AlignLeft
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
                          size={16}
                        />
                        <input
                          type="text"
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50"
                          placeholder="Opis (opcjonalnie)"
                          value={newHabitDescription}
                          onChange={(e) =>
                            setNewHabitDescription(e.target.value)
                          }
                        />
                      </div>
                      <div className="relative">
                        <Clock
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
                          size={16}
                        />
                        <input
                          type="time"
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50 [color-scheme:dark]"
                          value={newHabitTime}
                          onChange={(e) => setNewHabitTime(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setIsAddingHabit(false)}
                        className="px-4 text-xs font-bold text-text-dim hover:text-white">
                        Anuluj
                      </button>
                      <Button type="submit" className="px-6 h-10 text-xs">
                        Dodaj
                      </Button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* List Area */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-2 scrollbar-premium">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}>
              <SortableContext
                items={activeHabits.map((h) => h.id)}
                strategy={verticalListSortingStrategy}>
                <div className="space-y-3 pb-10">
                  {activeHabits.length === 0 && !isAddingHabit && (
                    <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[2.5rem]">
                      <Target
                        className="mx-auto text-white/10 mb-4"
                        size={40}
                      />
                      <p className="text-text-dim text-sm font-medium">
                        Lista jest pusta. Pora coś dodać!
                      </p>
                    </div>
                  )}
                  <AnimatePresence mode="popLayout">
                    {activeHabits.map((habit) => (
                      <SortableHabitItem
                        key={habit.id}
                        habit={habit}
                        isCompleted={dayData?.checks[habit.id] || false}
                        isEditing={editingHabitId === habit.id}
                        editingName={editingHabitName}
                        onToggle={() => toggleHabit(habit.id)}
                        onStartEdit={() => startEditingHabit(habit)}
                        onSaveEdit={saveEditingHabit}
                        onCancelEdit={cancelEditingHabit}
                        onEditNameChange={setEditingHabitName}
                        onArchive={() => toggleArchive(habit)}
                        onDelete={() => deleteHabit(habit.id)}
                      />
                    ))}
                  </AnimatePresence>

                  {archivedHabits.length > 0 && (
                    <div className="pt-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-px flex-1 bg-white/5" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-text-dim/50">
                          Archiwum
                        </span>
                        <div className="h-px flex-1 bg-white/5" />
                      </div>
                      <div className="grid grid-cols-2 gap-3 opacity-60">
                        {archivedHabits.map((habit) => (
                          <div
                            key={habit.id}
                            className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-between">
                            <span className="text-sm font-bold text-text-dim">
                              {habit.name}
                            </span>
                            <button
                              onClick={() => toggleArchive(habit)}
                              className="text-[10px] font-black text-primary uppercase">
                              Przywróć
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </main>

      {/* COLUMN 3: STATS PANEL */}
      <aside className="relative z-10 w-96 flex-shrink-0 flex flex-col border-l border-white/5 bg-black/20 backdrop-blur-3xl">
        <div className="flex-1 overflow-y-auto p-8 lg:p-10 flex flex-col gap-6 scrollbar-premium">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-primary/20 rounded-lg text-primary">
              <BarChart3 size={16} />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest">
              Statystyki
            </h3>
          </div>

          <Card className="glass-premium p-6 border-primary/20 bg-primary/5 rounded-[2rem]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-text-dim/60">
                Dziś
              </span>
              <CheckCircle2 size={16} className="text-primary opacity-50" />
            </div>
            <div className="flex items-end justify-between mb-4">
              <span className="text-4xl font-black text-gradient leading-none">
                {progressPercent}%
              </span>
              <span className="text-xs font-bold text-text-dim bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                {completedCount}/{activeHabits.length}
              </span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full shadow-[0_0_10px_var(--primary-glow)]"
              />
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card className="glass-premium p-5 border-secondary/20 bg-secondary/5 rounded-[1.5rem] card-hover">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-text-dim/60 mb-2">
                  Streak
                </span>
                <span className="text-3xl font-black text-secondary">
                  {currentStreak}
                </span>
                <span className="text-[10px] font-bold text-text-dim/40 uppercase mt-1">
                  Dni 🔥
                </span>
              </div>
            </Card>
            <Card className="glass-premium p-5 border-accent/20 bg-accent/5 rounded-[1.5rem] card-hover">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-text-dim/60 mb-2">
                  Idealne
                </span>
                <span className="text-3xl font-black text-accent">
                  {stats30Days.perfectDays}
                </span>
                <span className="text-[10px] font-bold text-text-dim/40 uppercase mt-1">
                  Dni (30d)
                </span>
              </div>
            </Card>
          </div>

          <Card className="glass-premium p-6 border-white/5 bg-white/[0.02] rounded-[2rem] overflow-hidden">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-text-dim/60 mb-6">
              Aktywność roczna
            </h4>
            <div className="px-1 scale-[1.02]">
              <ContributionGraph
                data={yearlyHistory}
                totalHabits={activeHabits.length}
              />
            </div>
          </Card>

          <div className="flex flex-col gap-3">
            <div className="p-4 glass-premium bg-success/5 border-success/20 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-success/60 block mb-0.5">
                  Ostatnie 7 dni
                </span>
                <span className="text-xl font-black text-white">
                  {stats7Days.completionRate}%
                </span>
              </div>
              <Target size={20} className="text-success opacity-50" />
            </div>
            <div className="p-4 glass-premium bg-accent/5 border-accent/20 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-accent/60 block mb-0.5">
                  Ostatnie 30 dni
                </span>
                <span className="text-xl font-black text-white">
                  {stats30Days.completionRate}%
                </span>
              </div>
              <TrendingUp size={20} className="text-accent opacity-50" />
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Dashboard;
