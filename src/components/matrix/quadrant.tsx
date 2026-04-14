"use client";

import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { AnimatePresence, motion } from "framer-motion";
import {
  Flame,
  CalendarClock,
  Users,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TaskCard } from "./task-card";
import { EmptyQuadrant } from "./empty-quadrant";
import { QUADRANTS } from "@/lib/constants";
import type { Quadrant, Task } from "@/types";

const ICONS: Record<string, LucideIcon> = {
  Flame,
  CalendarClock,
  Users,
  Trash2,
};

export function QuadrantColumn({
  quadrant,
  tasks,
  onComplete,
  onDelete,
  onUpdate,
}: {
  quadrant: Quadrant;
  tasks: Task[];
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string) => Promise<unknown>;
  onUpdate: (
    taskId: string,
    data: {
      title?: string;
      description?: string | null;
      dueDate?: string | null;
      tags?: string[] | null;
    }
  ) => Promise<void>;
}) {
  const meta = QUADRANTS[quadrant];
  const Icon = ICONS[meta.icon];
  const taskIds = tasks.map((t) => t.id);

  const { setNodeRef, isOver } = useDroppable({
    id: quadrant,
    data: { type: "quadrant", quadrant },
  });

  return (
    <Card
      role="region"
      aria-label={`${meta.label} — ${meta.description}, ${tasks.length} task${tasks.length === 1 ? "" : "s"}`}
      className={`flex flex-col overflow-hidden border-t-[3px] transition-colors ${
        isOver ? "ring-2 ring-ring/50" : ""
      }`}
      style={{
        borderTopColor: `var(--${meta.colorClass})`,
        backgroundColor: isOver
          ? `var(--${meta.colorClass}-bg)`
          : undefined,
      }}
    >
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2 pt-4 px-4">
        <Icon
          className="h-4 w-4 shrink-0"
          style={{ color: `var(--${meta.colorClass})` }}
        />
        <CardTitle className="text-sm font-semibold">{meta.label}</CardTitle>
        <span className="text-xs text-muted-foreground">{meta.description}</span>
        <Badge
          variant="secondary"
          className="ml-auto tabular-nums text-xs"
        >
          {tasks.length}
        </Badge>
      </CardHeader>
      <CardContent className="flex-1 px-2 pb-2" ref={setNodeRef}>
        <SortableContext
          items={taskIds}
          strategy={verticalListSortingStrategy}
          id={quadrant}
        >
          <ScrollArea className="h-[280px] md:h-[340px]">
            <div className="space-y-1.5 p-1">
              {tasks.length === 0 ? (
                <EmptyQuadrant quadrant={quadrant} />
              ) : (
                <AnimatePresence mode="popLayout" initial={false}>
                  {tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      <TaskCard
                        task={task}
                        onComplete={onComplete}
                        onDelete={onDelete}
                        onUpdate={onUpdate}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </ScrollArea>
        </SortableContext>
      </CardContent>
    </Card>
  );
}
