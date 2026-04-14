"use client";

import { useState, type RefObject } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QUADRANTS, QUADRANT_ORDER } from "@/lib/constants";
import type { Quadrant } from "@/types";

export function QuickAddBar({
  onCreate,
  inputRef,
}: {
  onCreate: (title: string, quadrant: Quadrant) => Promise<void>;
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  const [title, setTitle] = useState("");
  const [selectedQuadrant, setSelectedQuadrant] = useState<Quadrant>("do_first");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    setTitle("");
    await onCreate(trimmed, selectedQuadrant);
    inputRef?.current?.focus();
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="relative flex-1">
        <Input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task..."
          className="pr-10"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="flex gap-1">
        {QUADRANT_ORDER.map((q) => {
          const meta = QUADRANTS[q];
          const isSelected = q === selectedQuadrant;
          return (
            <Button
              key={q}
              type="button"
              variant="outline"
              size="sm"
              className={`h-8 px-2 text-xs transition-all ${
                isSelected
                  ? "ring-2 ring-offset-1 ring-offset-background"
                  : "opacity-60 hover:opacity-100"
              }`}
              style={{
                borderColor: `var(--${meta.colorClass})`,
                color: isSelected ? `var(--${meta.colorClass})` : undefined,
                ...(isSelected
                  ? { boxShadow: `0 0 0 2px var(--${meta.colorClass})` }
                  : {}),
              }}
              onClick={() => setSelectedQuadrant(q)}
              title={meta.label}
            >
              {meta.label.charAt(0)}
              <span className="hidden sm:inline">{meta.label.slice(1)}</span>
            </Button>
          );
        })}
      </div>
    </form>
  );
}
