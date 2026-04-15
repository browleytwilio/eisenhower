import type { Quadrant } from "@/types";

type ParsedQuickAdd = {
  title: string;
  dueDate?: string;
  tags?: string[];
  quadrant?: Quadrant;
};

const QUADRANT_MAP: Record<string, Quadrant> = {
  "1": "do_first",
  "2": "schedule",
  "3": "delegate",
  "4": "eliminate",
};

export function parseQuickAdd(input: string): ParsedQuickAdd {
  let remaining = input;
  const tags: string[] = [];
  let dueDate: string | undefined;
  let quadrant: Quadrant | undefined;

  // Extract !1-!4 for quadrant
  remaining = remaining.replace(/(?:^|\s)!([1-4])\b/g, (_, n) => {
    quadrant = QUADRANT_MAP[n];
    return "";
  });

  // Extract due:YYYY-MM-DD or due:tomorrow or due:today
  remaining = remaining.replace(/\s?due:(\S+)/gi, (_, val: string) => {
    const lower = val.toLowerCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (lower === "today") {
      dueDate = today.toISOString();
    } else if (lower === "tomorrow") {
      today.setDate(today.getDate() + 1);
      dueDate = today.toISOString();
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      const d = new Date(val + "T00:00:00.000Z");
      if (!isNaN(d.getTime())) dueDate = d.toISOString();
    }
    return "";
  });

  // Extract #tag tokens
  remaining = remaining.replace(/\s?#(\S+)/g, (_, tag: string) => {
    const cleaned = tag.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (cleaned && !tags.includes(cleaned)) tags.push(cleaned);
    return "";
  });

  return {
    title: remaining.trim(),
    ...(dueDate ? { dueDate } : {}),
    ...(tags.length > 0 ? { tags } : {}),
    ...(quadrant ? { quadrant } : {}),
  };
}
