"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and, max, gt, asc, sql } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/db";
import { tasks, subtasks } from "@/db/schema";
import {
  addSubtaskSchema,
  subtaskIdSchema,
  type ActionResult,
} from "@/lib/validations";
import type { Subtask } from "@/types";

async function getSession() {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });
  if (!session) throw new Error("Unauthorized");
  return session;
}

function serializeSubtask(row: typeof subtasks.$inferSelect): Subtask {
  return {
    id: row.id,
    taskId: row.taskId,
    title: row.title,
    completed: row.completed,
    position: row.position,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getSubtasks(taskId: string): Promise<Subtask[]> {
  const session = await getSession();
  const db = getDb();

  const [task] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.user.id)));

  if (!task) return [];

  const rows = await db
    .select()
    .from(subtasks)
    .where(eq(subtasks.taskId, taskId))
    .orderBy(asc(subtasks.position));

  return rows.map(serializeSubtask);
}

export async function addSubtask(data: {
  taskId: string;
  title: string;
}): Promise<ActionResult<Subtask>> {
  try {
    const parsed = addSubtaskSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const session = await getSession();
    const db = getDb();

    const [task] = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.id, parsed.data.taskId), eq(tasks.userId, session.user.id)));

    if (!task) return { success: false, error: "Task not found" };

    const [maxPos] = await db
      .select({ maxPosition: max(subtasks.position) })
      .from(subtasks)
      .where(eq(subtasks.taskId, parsed.data.taskId));

    const position = (maxPos?.maxPosition ?? -1) + 1;

    const [subtask] = await db
      .insert(subtasks)
      .values({
        taskId: parsed.data.taskId,
        title: parsed.data.title,
        position,
      })
      .returning();

    revalidatePath("/matrix");
    return { success: true, data: serializeSubtask(subtask) };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to add subtask" };
  }
}

export async function toggleSubtask(subtaskId: string): Promise<ActionResult> {
  try {
    const idParsed = subtaskIdSchema.safeParse(subtaskId);
    if (!idParsed.success) return { success: false, error: "Invalid subtask ID" };

    const session = await getSession();
    const db = getDb();

    const [subtask] = await db
      .select({ id: subtasks.id, taskId: subtasks.taskId, completed: subtasks.completed })
      .from(subtasks)
      .innerJoin(tasks, eq(subtasks.taskId, tasks.id))
      .where(and(eq(subtasks.id, subtaskId), eq(tasks.userId, session.user.id)));

    if (!subtask) return { success: false, error: "Subtask not found" };

    await db
      .update(subtasks)
      .set({ completed: !subtask.completed })
      .where(eq(subtasks.id, subtaskId));

    revalidatePath("/matrix");
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to toggle subtask" };
  }
}

export async function deleteSubtask(subtaskId: string): Promise<ActionResult> {
  try {
    const idParsed = subtaskIdSchema.safeParse(subtaskId);
    if (!idParsed.success) return { success: false, error: "Invalid subtask ID" };

    const session = await getSession();
    const db = getDb();

    const [subtask] = await db
      .select({ id: subtasks.id, taskId: subtasks.taskId, position: subtasks.position })
      .from(subtasks)
      .innerJoin(tasks, eq(subtasks.taskId, tasks.id))
      .where(and(eq(subtasks.id, subtaskId), eq(tasks.userId, session.user.id)));

    if (!subtask) return { success: false, error: "Subtask not found" };

    await db.delete(subtasks).where(eq(subtasks.id, subtaskId));

    await db
      .update(subtasks)
      .set({ position: sql`${subtasks.position} - 1` })
      .where(
        and(
          eq(subtasks.taskId, subtask.taskId),
          gt(subtasks.position, subtask.position)
        )
      );

    revalidatePath("/matrix");
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete subtask" };
  }
}
