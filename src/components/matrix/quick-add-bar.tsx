"use client";

import { useState, useMemo, type RefObject } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QUADRANTS, QUADRANT_ORDER } from "@/lib/constants";
import { parseQuickAdd } from "@/lib/parse-quick-add";
import type { Quadrant } from "@/types";

export function QuickAddBar({
  onCreate,
  inputRef,
}: {
  onCreate: (
    title: string,
    quadrant: Quadrant,
    extra?: { dueDate?: string; tags?: string[] }
  ) => Promise<void>;
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  const [title, setTitle] = useState("");
  const [selectedQuadrant, setSelectedQuadrant] = useState<Quadrant>("do_first");

  const parsed = useMemo(() => parseQuickAdd(title), [title]);

  const effectiveQuadrant = parsed.quadrant ?? selectedQuadrant;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalTitle = parsed.title.trim();
    if (!finalTitle) return;
    setTitle("");
    await onCreate(finalTitle, effectiveQuadrant, {
      dueDate: parsed.dueDate,
      tags: parsed.tags,
    });
    inputRef?.current?.focus();
  }

  const hasParsedTokens = parsed.dueDate || parsed.tags || parsed.quadrant;

  return (
    <div className="space-y-1">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a task... (#tag due:tomorrow !1)"
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
            const isSelected = q === effectiveQuadrant;
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
      {hasParsedTokens && title.trim() && (
        <div className="flex flex-wrap items-center gap-1 pl-1">
          {parsed.quadrant && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
              {QUADRANTS[parsed.quadrant].label}
            </Badge>
          )}
          {parsed.dueDate && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
              {new Date(parsed.dueDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </Badge>
          )}
          {parsed.tags?.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-5"
            >
              #{tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
