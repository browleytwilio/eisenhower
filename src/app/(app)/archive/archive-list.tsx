"use client";

import Link from "next/link";
import { RotateCcw, Archive } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QUADRANTS } from "@/lib/constants";
import { restoreArchivedTask } from "@/actions/task-actions";
import type { Quadrant } from "@/types";

type ArchivedTask = {
  id: string;
  title: string;
  quadrant: Quadrant;
  completedAt: Date | null;
};

export function ArchiveList({
  tasks,
  nextCursor,
}: {
  tasks: ArchivedTask[];
  nextCursor: string | null;
}) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <Archive className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">
          No archived tasks yet. Complete and archive tasks from your matrix.
        </p>
      </div>
    );
  }

  async function handleRestore(taskId: string) {
    const result = await restoreArchivedTask(taskId);
    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success("Task restored");
    }
  }

  return (
    <div className="space-y-1">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"
        >
          <span className="flex-1 line-through text-muted-foreground">
            {task.title}
          </span>
          <Badge
            variant="outline"
            className="text-xs shrink-0"
            style={{ borderColor: `var(--${QUADRANTS[task.quadrant].colorClass})` }}
          >
            {QUADRANTS[task.quadrant].label}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            title="Restore"
            onClick={() => handleRestore(task.id)}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      {nextCursor && (
        <div className="pt-4 text-center">
          <Button variant="outline" size="sm" render={<Link href={`/archive?cursor=${encodeURIComponent(nextCursor)}`} />}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
