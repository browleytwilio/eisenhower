"use client";

import { useEffect } from "react";

export function useKeyboardShortcuts({
  onQuickAdd,
  onSearch,
  onToggleSelect,
}: {
  onQuickAdd: () => void;
  onSearch: () => void;
  onToggleSelect?: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onSearch();
        return;
      }

      if (isInput) return;

      if (e.key === "S" && e.shiftKey && onToggleSelect) {
        e.preventDefault();
        onToggleSelect();
        return;
      }

      if (e.key === "n") {
        e.preventDefault();
        onQuickAdd();
        return;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onQuickAdd, onSearch, onToggleSelect]);
}
