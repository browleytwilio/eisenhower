import { z } from "zod";

export const quadrantSchema = z.enum([
  "do_first",
  "schedule",
  "delegate",
  "eliminate",
]);

export const taskIdSchema = z.string().uuid();

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(500, "Title too long"),
  quadrant: quadrantSchema,
  description: z.string().max(5000).optional(),
  dueDate: z.string().datetime().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(500).optional(),
  description: z.string().max(5000).nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  tags: z.array(z.string().max(50)).max(20).nullable().optional(),
});

export const reorderTaskSchema = z.object({
  taskId: taskIdSchema,
  targetQuadrant: quadrantSchema,
  newPosition: z.number().int().min(0),
});

export const restoreTaskSchema = z.object({
  title: z.string().trim().min(1).max(500),
  quadrant: quadrantSchema,
  description: z.string().max(5000).nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  tags: z.array(z.string().max(50)).max(20).nullable().optional(),
});

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
