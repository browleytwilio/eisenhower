"use client";

import { QUADRANT_ORDER } from "@/lib/constants";
import type { Quadrant, Task } from "@/types";

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isOverdue(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return d < now;
}

export function StatsBar({
  tasksByQuadrant,
}: {
  tasksByQuadrant: Record<Quadrant, Task[]>;
}) {
  let totalActive = 0;
  let completedToday = 0;
  let overdueCount = 0;

  for (const q of QUADRANT_ORDER) {
    for (const task of tasksByQuadrant[q]) {
      totalActive++;
      if (task.completed && task.completedAt && isToday(task.completedAt)) {
        completedToday++;
      }
      if (
        !task.completed &&
        task.dueDate &&
        isOverdue(task.dueDate)
      ) {
        overdueCount++;
      }
    }
  }

  const stats = [
    { label: "Active", value: totalActive },
    { label: "Done today", value: completedToday },
    { label: "Overdue", value: overdueCount, warn: overdueCount > 0 },
  ];

  return (
    <div className="flex gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-baseline gap-1.5 rounded-md border bg-card px-3 py-1.5 text-sm"
        >
          <span
            className={`font-semibold tabular-nums ${
              stat.warn ? "text-destructive" : "text-foreground"
            }`}
          >
            {stat.value}
          </span>
          <span className="text-muted-foreground">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
