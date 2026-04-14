"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import type { Task } from "@/types";

export function CompletionConfetti({ tasks }: { tasks: Task[] }) {
  const prevAllCompleted = useRef(false);

  useEffect(() => {
    if (tasks.length === 0) {
      prevAllCompleted.current = false;
      return;
    }

    const allCompleted = tasks.every((t) => t.completed);

    if (allCompleted && !prevAllCompleted.current) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { x: 0.25, y: 0.4 },
        colors: ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"],
      });
    }

    prevAllCompleted.current = allCompleted;
  }, [tasks]);

  return null;
}
