"use client";

import { useOptimistic, useCallback, useState, useRef } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensors,
  useSensor,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Archive, CheckSquare, Trash2, ArrowRight, X } from "lucide-react";
import { QuadrantColumn } from "./quadrant";
import { TaskCard } from "./task-card";
import { QuickAddBar } from "./quick-add-bar";
import { StatsBar } from "./stats-bar";
import { OnboardingPrompt } from "./onboarding-prompt";
import { CommandSearch } from "@/components/search/command-search";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { TaskDetailsSheet } from "./task-details-sheet";
import { CompletionConfetti } from "./completion-confetti";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  reorderTasks,
  archiveCompletedTasks,
} from "@/actions/task-actions";
import { bulkComplete, bulkDelete, bulkMove } from "@/actions/bulk-actions";
import { QUADRANT_ORDER, QUADRANTS } from "@/lib/constants";
import type { Quadrant, Task } from "@/types";

type OptimisticAction =
  | { type: "add"; task: Task }
  | { type: "delete"; taskId: string }
  | { type: "complete"; taskId: string }
  | { type: "update"; taskId: string; data: Partial<Task> }
  | { type: "move"; taskId: string; targetQuadrant: Quadrant; newPosition: number };

function optimisticReducer(
  state: Record<Quadrant, Task[]>,
  action: OptimisticAction
): Record<Quadrant, Task[]> {
  const next = { ...state };
  for (const q of QUADRANT_ORDER) {
    next[q] = [...state[q]];
  }

  switch (action.type) {
    case "add": {
      next[action.task.quadrant].push(action.task);
      return next;
    }
    case "delete": {
      for (const q of QUADRANT_ORDER) {
        next[q] = next[q].filter((t) => t.id !== action.taskId);
      }
      return next;
    }
    case "complete": {
      for (const q of QUADRANT_ORDER) {
        next[q] = next[q].map((t) =>
          t.id === action.taskId
            ? {
                ...t,
                completed: !t.completed,
                completedAt: t.completed ? null : new Date().toISOString(),
              }
            : t
        );
      }
      return next;
    }
    case "update": {
      for (const q of QUADRANT_ORDER) {
        next[q] = next[q].map((t) =>
          t.id === action.taskId ? { ...t, ...action.data } : t
        );
      }
      return next;
    }
    case "move": {
      let task: Task | undefined;
      for (const q of QUADRANT_ORDER) {
        const idx = next[q].findIndex((t) => t.id === action.taskId);
        if (idx !== -1) {
          task = next[q][idx];
          next[q].splice(idx, 1);
          break;
        }
      }
      if (task) {
        task = { ...task, quadrant: action.targetQuadrant };
        next[action.targetQuadrant].splice(action.newPosition, 0, task);
      }
      return next;
    }
  }
}

export function MatrixBoard({
  tasksByQuadrant,
}: {
  tasksByQuadrant: Record<Quadrant, Task[]>;
}) {
  const [optimistic, addOptimistic] = useOptimistic(
    tasksByQuadrant,
    optimisticReducer
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const quickAddRef = useRef<HTMLInputElement>(null);

  useKeyboardShortcuts({
    onQuickAdd: () => quickAddRef.current?.focus(),
    onSearch: () => setSearchOpen(true),
    onToggleSelect: () => {
      setSelectionMode((prev) => {
        if (prev) setSelectedIds(new Set());
        return !prev;
      });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeTask = activeId
    ? QUADRANT_ORDER.reduce<Task | undefined>(
        (found, q) => found ?? optimistic[q].find((t) => t.id === activeId),
        undefined
      )
    : undefined;

  const totalTasks = QUADRANT_ORDER.reduce(
    (sum, q) => sum + optimistic[q].length,
    0
  );

  const completedCount = QUADRANT_ORDER.reduce(
    (sum, q) => sum + optimistic[q].filter((t) => t.completed).length,
    0
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over) return;

      const activeTaskId = active.id as string;
      const overData = over.data.current;

      let targetQuadrant: Quadrant;
      let newPosition: number;

      if (overData?.type === "quadrant") {
        targetQuadrant = overData.quadrant as Quadrant;
        newPosition = optimistic[targetQuadrant].length;
      } else if (overData?.sortable) {
        targetQuadrant = overData.sortable.containerId as Quadrant;
        const overIndex = optimistic[targetQuadrant].findIndex(
          (t) => t.id === over.id
        );
        newPosition = overIndex >= 0 ? overIndex : optimistic[targetQuadrant].length;
      } else {
        return;
      }

      let sourceQuadrant: Quadrant | undefined;
      let sourceIndex = -1;
      for (const q of QUADRANT_ORDER) {
        const idx = optimistic[q].findIndex((t) => t.id === activeTaskId);
        if (idx !== -1) {
          sourceQuadrant = q;
          sourceIndex = idx;
          break;
        }
      }

      if (!sourceQuadrant) return;
      if (sourceQuadrant === targetQuadrant && sourceIndex === newPosition) return;

      addOptimistic({
        type: "move",
        taskId: activeTaskId,
        targetQuadrant,
        newPosition,
      });

      const result = await reorderTasks({
        taskId: activeTaskId,
        targetQuadrant,
        newPosition,
      });
      if (!result.success) toast.error(result.error);
    },
    [optimistic, addOptimistic]
  );

  const handleCreate = useCallback(
    async (
      title: string,
      quadrant: Quadrant,
      extra?: { dueDate?: string; tags?: string[] }
    ) => {
      const tempId = `temp-${Date.now()}`;
      const tempTask: Task = {
        id: tempId,
        userId: "",
        title,
        description: null,
        quadrant,
        position: optimistic[quadrant].length,
        dueDate: extra?.dueDate ?? null,
        tags: extra?.tags ?? null,
        completed: false,
        completedAt: null,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addOptimistic({ type: "add", task: tempTask });
      const result = await createTask({
        title,
        quadrant,
        dueDate: extra?.dueDate,
        tags: extra?.tags,
      });
      if (!result.success) toast.error(result.error);
    },
    [optimistic, addOptimistic]
  );

  const handleDelete = useCallback(
    async (taskId: string) => {
      addOptimistic({ type: "delete", taskId });
      return deleteTask(taskId);
    },
    [addOptimistic]
  );

  const handleComplete = useCallback(
    async (taskId: string) => {
      addOptimistic({ type: "complete", taskId });
      const result = await completeTask(taskId);
      if (!result.success) toast.error(result.error);
    },
    [addOptimistic]
  );

  const handleUpdate = useCallback(
    async (
      taskId: string,
      data: {
        title?: string;
        description?: string | null;
        dueDate?: string | null;
        tags?: string[] | null;
      }
    ) => {
      addOptimistic({ type: "update", taskId, data });
      const result = await updateTask(taskId, data);
      if (!result.success) toast.error(result.error);
    },
    [addOptimistic]
  );

  const handleToggleSelection = useCallback(
    (taskId: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(taskId)) next.delete(taskId);
        else next.add(taskId);
        return next;
      });
    },
    []
  );

  const handleBulkComplete = useCallback(async () => {
    const ids = Array.from(selectedIds);
    const result = await bulkComplete(ids);
    if (result.success) {
      toast.success(`Completed ${result.data.count} task${result.data.count === 1 ? "" : "s"}`);
    } else {
      toast.error(result.error);
    }
    setSelectedIds(new Set());
    setSelectionMode(false);
  }, [selectedIds]);

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds);
    const result = await bulkDelete(ids);
    if (result.success) {
      toast.success(`Deleted ${result.data.count} task${result.data.count === 1 ? "" : "s"}`);
    } else {
      toast.error(result.error);
    }
    setSelectedIds(new Set());
    setSelectionMode(false);
  }, [selectedIds]);

  const handleBulkMove = useCallback(
    async (quadrant: Quadrant) => {
      const ids = Array.from(selectedIds);
      const result = await bulkMove(ids, quadrant);
      if (result.success) {
        toast.success(`Moved ${result.data.count} task${result.data.count === 1 ? "" : "s"}`);
      } else {
        toast.error(result.error);
      }
      setSelectedIds(new Set());
      setSelectionMode(false);
    },
    [selectedIds]
  );

  const handleCreateSamples = useCallback(async () => {
    const samples: { title: string; quadrant: Quadrant }[] = [
      { title: "Finish urgent report", quadrant: "do_first" },
      { title: "Plan next week's goals", quadrant: "schedule" },
      { title: "Reply to routine emails", quadrant: "delegate" },
      { title: "Reorganize old bookmarks", quadrant: "eliminate" },
    ];
    for (const s of samples) {
      await handleCreate(s.title, s.quadrant);
    }
  }, [handleCreate]);

  const handleArchiveCompleted = useCallback(async () => {
    setArchiveDialogOpen(false);
    const result = await archiveCompletedTasks();
    if (result.success) {
      toast.success(`Archived ${result.data.count} task${result.data.count === 1 ? "" : "s"}`);
    } else {
      toast.error(result.error);
    }
  }, []);

  return (
    <div className="space-y-4">
      <StatsBar tasksByQuadrant={optimistic} />
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <QuickAddBar onCreate={handleCreate} inputRef={quickAddRef} />
        </div>
        {completedCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={() => setArchiveDialogOpen(true)}
          >
            <Archive className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Archive</span>
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {completedCount}
            </Badge>
          </Button>
        )}
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {totalTasks === 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
            <OnboardingPrompt
              onFocusInput={() => quickAddRef.current?.focus()}
              onCreateSamples={handleCreateSamples}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
            {QUADRANT_ORDER.map((quadrant) => (
              <QuadrantColumn
                key={quadrant}
                quadrant={quadrant}
                tasks={optimistic[quadrant]}
                onComplete={handleComplete}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                onToggleSelection={handleToggleSelection}
              />
            ))}
          </div>
        )}
        <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
          {activeTask ? (
            <motion.div
              initial={{ scale: 1, rotate: 0 }}
              animate={{ scale: 1.03, rotate: 2 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="opacity-90"
              style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}
            >
              <TaskCard
                task={activeTask}
                onComplete={() => {}}
                onDelete={() => Promise.resolve({ success: true as const, data: activeTask })}
                onUpdate={() => Promise.resolve()}
                isOverlay
              />
            </motion.div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <CompletionConfetti tasks={optimistic.do_first} />
      <CommandSearch
        tasksByQuadrant={optimistic}
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSelectTask={setSelectedTask}
      />
      {selectedTask && (
        <TaskDetailsSheet
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(open) => {
            if (!open) setSelectedTask(null);
          }}
          onUpdate={handleUpdate}
        />
      )}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Archive completed tasks</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive {completedCount} completed task{completedCount === 1 ? "" : "s"}.
              You can restore them from the archive later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveCompleted}>
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {selectionMode && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-lg border bg-card px-4 py-2 shadow-lg">
          <Badge variant="secondary" className="text-xs">
            {selectedIds.size} selected
          </Badge>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={selectedIds.size === 0}
            onClick={handleBulkComplete}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            Complete
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={selectedIds.size === 0}
                />
              }
            >
              <ArrowRight className="h-3.5 w-3.5" />
              Move to...
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {QUADRANT_ORDER.map((q) => (
                <DropdownMenuItem key={q} onClick={() => handleBulkMove(q)}>
                  {QUADRANTS[q].label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-destructive hover:text-destructive"
            disabled={selectedIds.size === 0}
            onClick={handleBulkDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="ml-1"
            onClick={() => {
              setSelectionMode(false);
              setSelectedIds(new Set());
            }}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
