"use client";

import { Flame, CalendarClock, Users, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Quadrant } from "@/types";

const QUADRANT_INFO: {
  quadrant: Quadrant;
  label: string;
  description: string;
  icon: typeof Flame;
  example: string;
}[] = [
  {
    quadrant: "do_first",
    label: "Do First",
    description: "Urgent & Important",
    icon: Flame,
    example: "Fix production bug",
  },
  {
    quadrant: "schedule",
    label: "Schedule",
    description: "Important, Not Urgent",
    icon: CalendarClock,
    example: "Plan quarterly review",
  },
  {
    quadrant: "delegate",
    label: "Delegate",
    description: "Urgent, Not Important",
    icon: Users,
    example: "Reply to routine emails",
  },
  {
    quadrant: "eliminate",
    label: "Eliminate",
    description: "Neither Urgent nor Important",
    icon: Trash2,
    example: "Organize old bookmarks",
  },
];

export function OnboardingPrompt({
  onFocusInput,
  onCreateSamples,
}: {
  onFocusInput: () => void;
  onCreateSamples: () => void;
}) {
  return (
    <Card className="col-span-full">
      <CardContent className="flex flex-col items-center gap-6 py-10 text-center">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">
            Welcome to Eisenhower
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Prioritize your tasks using the Eisenhower Matrix. Place each task
            in the quadrant that fits its urgency and importance.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
          {QUADRANT_INFO.map((q) => (
            <div
              key={q.quadrant}
              className="flex items-start gap-2 rounded-md border p-3 text-left"
            >
              <q.icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight">{q.label}</p>
                <p className="text-[11px] text-muted-foreground">
                  {q.description}
                </p>
                <p className="text-[11px] text-muted-foreground/70 italic mt-0.5">
                  e.g. {q.example}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button onClick={onFocusInput}>Create your first task</Button>
          <Button variant="outline" onClick={onCreateSamples}>
            Add sample tasks
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
