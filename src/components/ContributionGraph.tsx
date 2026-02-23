import React, { useMemo } from "react";
import {
  format,
  subDays,
  eachDayOfInterval,
  startOfWeek,
  getDay,
} from "date-fns";
import { pl } from "date-fns/locale";

interface ContributionGraphProps {
  data: Record<string, number>; // "YYYY-MM-DD" -> count
  totalHabits: number;
}

const DAY_LABELS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];
const CELL_SIZE = 11;
const CELL_GAP = 2;
const STEP = CELL_SIZE + CELL_GAP;
const DAY_LABEL_WIDTH = 22;

const ContributionGraph: React.FC<ContributionGraphProps> = ({
  data,
  totalHabits,
}) => {
  const today = new Date();

  // Start from the beginning of the week 52 weeks ago, so we always get exactly 53 columns
  const periodEnd = today;
  const periodStart = startOfWeek(subDays(today, 364), { weekStartsOn: 1 }); // Monday-based

  const allDays = useMemo(
    () => eachDayOfInterval({ start: periodStart, end: periodEnd }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Group days into weeks (columns), each week starts on Monday
  const weeks = useMemo(() => {
    const result: Date[][] = [];
    let week: Date[] = [];
    allDays.forEach((date) => {
      // getDay: 0=Sun,1=Mon...6=Sat — convert to 0=Mon..6=Sun
      const dow = (getDay(date) + 6) % 7; // Mon=0 … Sun=6
      if (dow === 0 && week.length > 0) {
        result.push(week);
        week = [];
      }
      week.push(date);
    });
    if (week.length > 0) result.push(week);
    return result;
  }, [allDays]);

  // Month labels: find first week where the 1st of a new month appears
  const monthLabels = useMemo(() => {
    const labels: { text: string; colIndex: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, colIndex) => {
      week.forEach((date) => {
        const m = date.getMonth();
        if (m !== lastMonth) {
          labels.push({
            text: format(date, "MMM", { locale: pl }),
            colIndex,
          });
          lastMonth = m;
        }
      });
    });
    return labels;
  }, [weeks]);

  const getIntensity = (count: number): 0 | 1 | 2 | 3 | 4 => {
    if (!count || count === 0) return 0;
    if (totalHabits === 0) return 1;
    const pct = count / totalHabits;
    if (pct <= 0.25) return 1;
    if (pct <= 0.5) return 2;
    if (pct <= 0.75) return 3;
    return 4;
  };

  const intensityColor: Record<0 | 1 | 2 | 3 | 4, string> = {
    0: "rgba(255,255,255,0.04)",
    1: "rgba(139,92,246,0.25)",
    2: "rgba(139,92,246,0.45)",
    3: "rgba(139,92,246,0.70)",
    4: "rgba(139,92,246,1)",
  };

  const totalWidth = DAY_LABEL_WIDTH + weeks.length * STEP;
  const headerHeight = 20;
  const gridHeight = 7 * STEP;
  const svgHeight = headerHeight + gridHeight;

  return (
    <div className="w-full overflow-x-auto pb-2">
      <svg
        width={totalWidth}
        height={svgHeight + 30}
        style={{ display: "block", overflow: "visible" }}>
        {/* Month labels */}
        {monthLabels.map((label, i) => (
          <text
            key={i}
            x={DAY_LABEL_WIDTH + label.colIndex * STEP}
            y={12}
            fontSize={10}
            fill="rgba(255,255,255,0.35)"
            fontFamily="inherit">
            {label.text}
          </text>
        ))}

        {/* Day-of-week labels */}
        {DAY_LABELS.map((label, row) => (
          <text
            key={row}
            x={0}
            y={headerHeight + row * STEP + CELL_SIZE - 1}
            fontSize={9}
            fill="rgba(255,255,255,0.30)"
            fontFamily="inherit">
            {/* show only Mon, Wed, Fri */}
            {row % 2 === 0 ? label : ""}
          </text>
        ))}

        {/* Grid cells */}
        {weeks.map((week, colIndex) =>
          week.map((date) => {
            const dow = (getDay(date) + 6) % 7; // Mon=0
            const dateStr = format(date, "yyyy-MM-dd");
            const count = data[dateStr] ?? 0;
            const intensity = getIntensity(count);
            const x = DAY_LABEL_WIDTH + colIndex * STEP;
            const y = headerHeight + dow * STEP;
            const isToday = dateStr === format(today, "yyyy-MM-dd");

            return (
              <g key={dateStr}>
                <rect
                  x={x}
                  y={y}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  rx={2}
                  ry={2}
                  fill={intensityColor[intensity]}
                  stroke={
                    isToday ? "rgba(139,92,246,0.9)" : "rgba(255,255,255,0.04)"
                  }
                  strokeWidth={isToday ? 1.5 : 0.5}>
                  <title>
                    {format(date, "d MMMM yyyy", { locale: pl })}: {count}{" "}
                    ukończonych nawyków
                  </title>
                </rect>
              </g>
            );
          }),
        )}

        {/* Legend */}
        <g transform={`translate(${totalWidth - 110}, ${svgHeight + 16})`}>
          <text
            x={0}
            y={9}
            fontSize={9}
            fill="rgba(255,255,255,0.35)"
            fontFamily="inherit">
            Mniej
          </text>
          {([0, 1, 2, 3, 4] as const).map((lvl, i) => (
            <rect
              key={lvl}
              x={32 + i * (CELL_SIZE + 2)}
              y={0}
              width={CELL_SIZE}
              height={CELL_SIZE}
              rx={2}
              fill={intensityColor[lvl]}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth={0.5}
            />
          ))}
          <text
            x={103}
            y={9}
            fontSize={9}
            fill="rgba(255,255,255,0.35)"
            fontFamily="inherit">
            Więcej
          </text>
        </g>
      </svg>
    </div>
  );
};

export default ContributionGraph;
