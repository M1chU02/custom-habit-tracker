import React, { useMemo } from "react";
import {
  format,
  subDays,
  eachDayOfInterval,
  startOfWeek,
  getMonth,
} from "date-fns";
import { pl } from "date-fns/locale";
import { clsx } from "clsx";

interface ContributionGraphProps {
  data: Record<string, number>; // date "YYYY-MM-DD" -> count
  totalHabits: number;
}

const ContributionGraph: React.FC<ContributionGraphProps> = ({
  data,
  totalHabits,
}) => {
  const today = new Date();
  // Generate last 365 days roughly, aligned to weeks
  const endDate = today;
  const startDate = subDays(today, 365);

  // Align start date to the beginning of the week (Monday)
  // 1 = Monday
  const gridStartDate = startOfWeek(startDate, { weekStartsOn: 1 });

  const dates = useMemo(() => {
    return eachDayOfInterval({
      start: gridStartDate,
      end: endDate,
    });
  }, [gridStartDate, endDate]);

  // Group by weeks for columns
  const weeks = useMemo(() => {
    const weeksArray: Date[][] = [];
    let currentWeek: Date[] = [];

    dates.forEach((date) => {
      currentWeek.push(date);
      if (currentWeek.length === 7) {
        weeksArray.push(currentWeek);
        currentWeek = [];
      }
    });

    // Push last partial week if any
    if (currentWeek.length > 0) {
      weeksArray.push(currentWeek);
    }

    return weeksArray;
  }, [dates]);

  const getIntensity = (count: number) => {
    if (count === 0) return 0;
    if (totalHabits === 0) return 0;

    const percentage = count / totalHabits;

    if (percentage <= 0.25) return 1;
    if (percentage <= 0.5) return 2;
    if (percentage <= 0.75) return 3;
    return 4;
  };

  const getIntensityClass = (level: number) => {
    switch (level) {
      case 0:
        return "bg-white/[0.03] border-white/5";
      case 1:
        return "bg-primary/20 border-primary/30";
      case 2:
        return "bg-primary/40 border-primary/50";
      case 3:
        return "bg-primary/70 border-primary/80";
      case 4:
        return "bg-primary border-primary shadow-[0_0_10px_rgba(139,92,246,0.5)]";
      default:
        return "bg-white/[0.03]";
    }
  };

  // Month labels logic
  const monthLabels = useMemo(() => {
    const labels: { text: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    weeks.forEach((week, index) => {
      const firstDayOfWeek = week[0];
      const month = getMonth(firstDayOfWeek);

      // Show label if month changes or it's the first week (and reasonable space)
      if (month !== lastMonth) {
        // Should verify if the first week of the month actually has enough days in this month to label it here
        // Github logic is a bit complex, but simple "first week of month" usually works
        labels.push({
          text: format(firstDayOfWeek, "MMM", { locale: pl }),
          weekIndex: index,
        });
        lastMonth = month;
      }
    });
    return labels;
  }, [weeks]);

  return (
    <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      <div className="min-w-fit pr-4">
        {/* Month labels */}
        <div className="flex text-[10px] text-text-dim mb-2 h-4 relative">
          {monthLabels.map((label, i) => (
            <div
              key={i}
              className="absolute"
              style={{ left: `${label.weekIndex * 14}px` }} // 10px box + 4px gap approx
            >
              {label.text}
            </div>
          ))}
        </div>

        <div className="flex gap-1">
          {/* Day labels (Mon, Wed, Fri) */}
          <div className="flex flex-col gap-1 text-[10px] text-text-dim mr-2 pt-[14px]">
            <div className="h-[10px]">Pn</div>
            <div className="h-[10px]"></div>
            <div className="h-[10px]">Śr</div>
            <div className="h-[10px]"></div>
            <div className="h-[10px]">Pt</div>
            <div className="h-[10px]"></div>
            <div className="h-[10px]"></div>
          </div>

          {/* Grid */}
          <div className="flex gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((date: Date) => {
                  const dateStr = format(date, "yyyy-MM-dd");
                  const count = data[dateStr] || 0;
                  const intensity = getIntensity(count);

                  return (
                    <div
                      key={dateStr}
                      className={clsx(
                        "w-[10px] h-[10px] rounded-sm border transition-colors duration-200",
                        getIntensityClass(intensity),
                      )}
                      title={`${format(date, "d MMMM yyyy", { locale: pl })}: ${count} ukończonych nawyków`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-4 text-[10px] text-text-dim justify-end">
          <span>Mniej</span>
          <div
            className={clsx(
              "w-[10px] h-[10px] rounded-sm border",
              getIntensityClass(0),
            )}
          />
          <div
            className={clsx(
              "w-[10px] h-[10px] rounded-sm border",
              getIntensityClass(1),
            )}
          />
          <div
            className={clsx(
              "w-[10px] h-[10px] rounded-sm border",
              getIntensityClass(2),
            )}
          />
          <div
            className={clsx(
              "w-[10px] h-[10px] rounded-sm border",
              getIntensityClass(3),
            )}
          />
          <div
            className={clsx(
              "w-[10px] h-[10px] rounded-sm border",
              getIntensityClass(4),
            )}
          />
          <span>Więcej</span>
        </div>
      </div>
    </div>
  );
};

export default ContributionGraph;
