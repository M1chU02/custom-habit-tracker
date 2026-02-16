import { useEffect, useRef } from "react";
import type { Habit, DayCompletion } from "../types";
import { format } from "date-fns";

interface NotificationManagerProps {
  habits: Habit[];
  dayData: DayCompletion | null;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({
  habits,
  dayData,
}) => {
  const lastCheckedMinute = useRef<string>("");

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentMinute = format(now, "HH:mm");

      // Only check once per minute
      if (currentMinute === lastCheckedMinute.current) return;
      lastCheckedMinute.current = currentMinute;

      habits.forEach((habit) => {
        if (
          !habit.isArchived &&
          habit.reminderTime === currentMinute &&
          Notification.permission === "granted"
        ) {
          // Check if already completed today
          const isCompleted = dayData?.checks[habit.id];

          if (!isCompleted) {
            new Notification(`Czas na nawyk: ${habit.name}`, {
              body: habit.description || "Pamiętaj o swoim celu!",
              icon: "/pwa-192x192.png", // Assuming PWA icon exists, or generic
            });
          }
        }
      });
    };

    // Check immediately and then every interval
    const intervalId = setInterval(checkReminders, 10000); // Check every 10 seconds to be safe
    checkReminders();

    return () => clearInterval(intervalId);
  }, [habits, dayData]);

  return null; // This component handles side effects only
};

export default NotificationManager;
