import { Flame, CalendarClock, Users, Trash2, type LucideIcon } from "lucide-react";
import { QUADRANTS } from "@/lib/constants";
import type { Quadrant } from "@/types";

const ICONS: Record<string, LucideIcon> = {
  Flame,
  CalendarClock,
  Users,
  Trash2,
};

export function EmptyQuadrant({ quadrant }: { quadrant: Quadrant }) {
  const meta = QUADRANTS[quadrant];
  const Icon = ICONS[meta.icon];

  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <Icon
        className="h-8 w-8 opacity-20"
        style={{ color: `var(--${meta.colorClass})` }}
      />
      <p className="text-xs text-muted-foreground">{meta.emptyMessage}</p>
    </div>
  );
}
