"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  getSubtasks,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
} from "@/actions/subtask-actions";
import type { Subtask } from "@/types";

export function SubtaskList({ taskId }: { taskId: string }) {
  const [items, setItems] = useState<Subtask[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getSubtasks(taskId).then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, [taskId]);

  const doneCount = items.filter((s) => s.completed).length;

  const handleAdd = useCallback(async () => {
    const title = inputValue.trim();
    if (!title) return;

    setInputValue("");
    const tempId = `temp-${Date.now()}`;
    const temp: Subtask = {
      id: tempId,
      taskId,
      title,
      completed: false,
      position: items.length,
      createdAt: new Date().toISOString(),
    };
    setItems((prev) => [...prev, temp]);

    const result = await addSubtask({ taskId, title });
    if (result.success) {
      setItems((prev) =>
        prev.map((s) => (s.id === tempId ? result.data : s))
      );
    } else {
      setItems((prev) => prev.filter((s) => s.id !== tempId));
      toast.error(result.error);
    }
  }, [inputValue, taskId, items.length]);

  const handleToggle = useCallback(async (subtaskId: string) => {
    setItems((prev) =>
      prev.map((s) =>
        s.id === subtaskId ? { ...s, completed: !s.completed } : s
      )
    );
    const result = await toggleSubtask(subtaskId);
    if (!result.success) toast.error(result.error);
  }, []);

  const handleDelete = useCallback(async (subtaskId: string) => {
    setItems((prev) => prev.filter((s) => s.id !== subtaskId));
    const result = await deleteSubtask(subtaskId);
    if (!result.success) toast.error(result.error);
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        <div className="h-8 w-full animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Subtasks{" "}
        {items.length > 0 && (
          <span className="font-medium text-foreground">
            {doneCount}/{items.length}
          </span>
        )}
      </p>
      <AnimatePresence mode="popLayout" initial={false}>
        {items.map((subtask) => (
          <motion.div
            key={subtask.id}
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2"
          >
            <Checkbox
              checked={subtask.completed}
              onCheckedChange={() => handleToggle(subtask.id)}
              className="shrink-0"
            />
            <span
              className={`flex-1 text-sm ${
                subtask.completed ? "line-through text-muted-foreground" : ""
              }`}
            >
              {subtask.title}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 opacity-0 hover:opacity-100 focus:opacity-100 group-hover/subtask:opacity-60"
              onClick={() => handleDelete(subtask.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>
      <input
        ref={inputRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleAdd();
          }
        }}
        placeholder="Add subtask..."
        className="w-full rounded-md border bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}
