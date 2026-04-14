"use client";

import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { QUADRANTS, QUADRANT_ORDER } from "@/lib/constants";
import type { Quadrant, Task } from "@/types";

export function CommandSearch({
  tasksByQuadrant,
  open,
  onOpenChange,
  onSelectTask,
}: {
  tasksByQuadrant: Record<Quadrant, Task[]>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTask: (task: Task) => void;
}) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search tasks..." />
      <CommandList>
        <CommandEmpty>No tasks found.</CommandEmpty>
        {QUADRANT_ORDER.map((quadrant) => {
          const tasks = tasksByQuadrant[quadrant];
          if (tasks.length === 0) return null;
          const meta = QUADRANTS[quadrant];
          return (
            <CommandGroup key={quadrant} heading={meta.label}>
              {tasks.map((task) => (
                <CommandItem
                  key={task.id}
                  value={task.title}
                  onSelect={() => {
                    onSelectTask(task);
                    onOpenChange(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: `var(--${meta.colorClass})` }}
                  />
                  <span className={task.completed ? "line-through text-muted-foreground" : ""}>
                    {task.title}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
