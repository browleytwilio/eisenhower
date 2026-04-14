"use client";

import { useState, useRef, useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MoreHorizontal, Pencil, Trash2, Calendar } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Button } from "@/components/ui/button";
import { restoreTask } from "@/actions/task-actions";
import { AnimatedCheckbox } from "./animated-checkbox";
import { TaskDetailsSheet } from "./task-details-sheet";
import type { Task } from "@/types";

function formatRelativeDate(iso: string): { label: string; variant: "destructive" | "secondary" | "outline" } {
  const date = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.floor((target.getTime() - today.getTime()) / 86400000);

  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, variant: "destructive" };
  if (diff === 0) return { label: "Today", variant: "destructive" };
  if (diff === 1) return { label: "Tomorrow", variant: "secondary" };
  if (diff <= 7) return { label: `${diff}d`, variant: "outline" };
  return { label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), variant: "outline" };
}

export function TaskCard({
  task,
  onComplete,
  onDelete,
  onUpdate,
  isOverlay = false,
}: {
  task: Task;
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
  isOverlay?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const checkboxRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { quadrant: task.quadrant },
    disabled: isOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDoubleClick = useCallback(() => {
    setEditing(true);
    setEditValue(task.title);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [task.title]);

  const handleEditSubmit = useCallback(async () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== task.title) {
      await onUpdate(task.id, { title: trimmed });
    }
    setEditing(false);
  }, [editValue, task.id, task.title, onUpdate]);

  const handleDelete = useCallback(async () => {
    const deleted = await onDelete(task.id);
    if (deleted) {
      const d = deleted as Task;
      toast("Task deleted", {
        action: {
          label: "Undo",
          onClick: () => {
            restoreTask({
              title: d.title,
              quadrant: d.quadrant,
              description: d.description,
              dueDate: d.dueDate,
              tags: d.tags,
            });
          },
        },
        duration: 5000,
      });
    }
  }, [task.id, onDelete]);

  const dueBadge = task.dueDate && !task.completed
    ? formatRelativeDate(task.dueDate)
    : null;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`group flex items-start gap-1.5 rounded-md border bg-card px-2 py-1.5 text-sm transition-colors hover:bg-accent/50 ${
          isDragging ? "opacity-30 border-dashed" : ""
        } ${task.completed ? "opacity-60" : ""} ${
          isOverlay ? "shadow-lg border-border" : ""
        }`}
      >
        <button
          className="mt-0.5 cursor-grab touch-none opacity-60 transition-opacity md:opacity-0 md:group-hover:opacity-60 md:focus:opacity-60"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>

        <div ref={checkboxRef} className="mt-0.5 shrink-0">
          <AnimatedCheckbox
            checked={task.completed}
            onCheckedChange={() => {
              if (!task.completed && checkboxRef.current) {
                const rect = checkboxRef.current.getBoundingClientRect();
                confetti({
                  particleCount: 15,
                  spread: 50,
                  startVelocity: 15,
                  gravity: 0.8,
                  scalar: 0.6,
                  origin: {
                    x: rect.left / window.innerWidth,
                    y: rect.top / window.innerHeight,
                  },
                });
              }
              onComplete(task.id);
            }}
            aria-label={`Mark "${task.title}" as ${task.completed ? "incomplete" : "complete"}`}
          />
        </div>

        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleEditSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleEditSubmit();
                if (e.key === "Escape") setEditing(false);
              }}
              className="w-full bg-transparent text-sm outline-none"
            />
          ) : (
            <span
              onDoubleClick={handleDoubleClick}
              title="Double-click to edit"
              className={`cursor-default select-none leading-5 ${
                task.completed ? "line-through text-muted-foreground" : ""
              }`}
            >
              {task.title}
              {!task.completed && (
                <Pencil className="ml-1 inline h-3 w-3 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/50" />
              )}
            </span>
          )}
          {(dueBadge || (task.tags && task.tags.length > 0)) && (
            <div className="mt-0.5 flex flex-wrap items-center gap-1">
              {dueBadge && (
                <>
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <Badge variant={dueBadge.variant} className="text-[10px] px-1 py-0 h-4">
                    {dueBadge.label}
                  </Badge>
                </>
              )}
              {task.tags?.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-[10px] px-1 py-0 h-4"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label="Task actions"
                className="h-6 w-6 shrink-0 opacity-60 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
              />
            }
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => setSheetOpen(true)}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <TaskDetailsSheet
        task={task}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onUpdate={onUpdate}
      />
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &ldquo;{task.title}&rdquo;? You can undo this from the toast notification.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
