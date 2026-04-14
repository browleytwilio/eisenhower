import type { Quadrant } from "@/types";

export const QUADRANTS: Record<
  Quadrant,
  {
    label: string;
    description: string;
    icon: string;
    colorClass: string;
    emptyMessage: string;
  }
> = {
  do_first: {
    label: "Do First",
    description: "Urgent & Important",
    icon: "Flame",
    colorClass: "q1",
    emptyMessage: "Nothing urgent right now. Nice work!",
  },
  schedule: {
    label: "Schedule",
    description: "Important, Not Urgent",
    icon: "CalendarClock",
    colorClass: "q2",
    emptyMessage: "Plan ahead - add important tasks here.",
  },
  delegate: {
    label: "Delegate",
    description: "Urgent, Not Important",
    icon: "Users",
    colorClass: "q3",
    emptyMessage: "Nothing to hand off right now.",
  },
  eliminate: {
    label: "Eliminate",
    description: "Neither Urgent nor Important",
    icon: "Trash2",
    colorClass: "q4",
    emptyMessage: "Keep this quadrant empty if you can.",
  },
} as const;

export const QUADRANT_ORDER: Quadrant[] = [
  "do_first",
  "schedule",
  "delegate",
  "eliminate",
];
