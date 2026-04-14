"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and, sql, gt, lt, gte, lte, max, desc } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/db";
import { tasks } from "@/db/schema";
import {
  createTaskSchema,
  updateTaskSchema,
  taskIdSchema,
  reorderTaskSchema,
  restoreTaskSchema,
  type ActionResult,
} from "@/lib/validations";
import type { Task } from "@/types";

function serializeTask(row: typeof tasks.$inferSelect): Task {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    description: row.description,
    quadrant: row.quadrant,
    position: row.position,
    dueDate: row.dueDate?.toISOString() ?? null,
    tags: row.tags,
    completed: row.completed,
    completedAt: row.completedAt?.toISOString() ?? null,
    archived: row.archived,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function getSession() {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function createTask(data: {
  title: string;
  quadrant: string;
  description?: string;
  dueDate?: string;
}): Promise<ActionResult<Task>> {
  try {
    const parsed = createTaskSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const session = await getSession();
    const db = getDb();

    const [maxPos] = await db
      .select({ maxPosition: max(tasks.position) })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, session.user.id),
          eq(tasks.quadrant, parsed.data.quadrant),
          eq(tasks.archived, false)
        )
      );

    const position = (maxPos?.maxPosition ?? -1) + 1;

    const [task] = await db
      .insert(tasks)
      .values({
        userId: session.user.id,
        title: parsed.data.title,
        quadrant: parsed.data.quadrant,
        position,
        description: parsed.data.description ?? null,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      })
      .returning();

    revalidatePath("/matrix");
    return { success: true, data: serializeTask(task) };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to create task" };
  }
}

export async function updateTask(
  taskId: string,
  data: {
    title?: string;
    description?: string | null;
    dueDate?: string | null;
    tags?: string[] | null;
  }
): Promise<ActionResult> {
  try {
    const idParsed = taskIdSchema.safeParse(taskId);
    if (!idParsed.success) return { success: false, error: "Invalid task ID" };

    const dataParsed = updateTaskSchema.safeParse(data);
    if (!dataParsed.success) {
      return { success: false, error: dataParsed.error.issues[0].message };
    }

    const session = await getSession();
    const db = getDb();

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    const d = dataParsed.data;

    if (d.title !== undefined) updateData.title = d.title;
    if (d.description !== undefined) updateData.description = d.description;
    if (d.dueDate !== undefined)
      updateData.dueDate = d.dueDate ? new Date(d.dueDate) : null;
    if (d.tags !== undefined) updateData.tags = d.tags;

    await db
      .update(tasks)
      .set(updateData)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.user.id)));

    revalidatePath("/matrix");
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update task" };
  }
}

export async function deleteTask(taskId: string): Promise<ActionResult<Task>> {
  try {
    const idParsed = taskIdSchema.safeParse(taskId);
    if (!idParsed.success) return { success: false, error: "Invalid task ID" };

    const session = await getSession();
    const db = getDb();

    const [deleted] = await db
      .delete(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.user.id)))
      .returning();

    if (!deleted) {
      return { success: false, error: "Task not found" };
    }

    await db
      .update(tasks)
      .set({ position: sql`${tasks.position} - 1` })
      .where(
        and(
          eq(tasks.userId, session.user.id),
          eq(tasks.quadrant, deleted.quadrant),
          gt(tasks.position, deleted.position),
          eq(tasks.archived, false)
        )
      );

    revalidatePath("/matrix");
    return { success: true, data: serializeTask(deleted) };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete task" };
  }
}

export async function completeTask(taskId: string): Promise<ActionResult> {
  try {
    const idParsed = taskIdSchema.safeParse(taskId);
    if (!idParsed.success) return { success: false, error: "Invalid task ID" };

    const session = await getSession();
    const db = getDb();

    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.user.id)));

    if (!task) return { success: false, error: "Task not found" };

    await db
      .update(tasks)
      .set({
        completed: !task.completed,
        completedAt: task.completed ? null : new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, taskId));

    revalidatePath("/matrix");
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update task" };
  }
}

export async function restoreTask(data: {
  title: string;
  quadrant: string;
  description?: string | null;
  dueDate?: string | null;
  tags?: string[] | null;
}): Promise<ActionResult> {
  try {
    const parsed = restoreTaskSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const session = await getSession();
    const db = getDb();

    const [maxPos] = await db
      .select({ maxPosition: max(tasks.position) })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, session.user.id),
          eq(tasks.quadrant, parsed.data.quadrant),
          eq(tasks.archived, false)
        )
      );

    const position = (maxPos?.maxPosition ?? -1) + 1;

    await db.insert(tasks).values({
      userId: session.user.id,
      title: parsed.data.title,
      quadrant: parsed.data.quadrant,
      position,
      description: parsed.data.description ?? null,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      tags: parsed.data.tags ?? null,
    });

    revalidatePath("/matrix");
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to restore task" };
  }
}

export async function archiveCompletedTasks(): Promise<ActionResult<{ count: number }>> {
  try {
    const session = await getSession();
    const db = getDb();

    const result = await db
      .update(tasks)
      .set({ archived: true, updatedAt: new Date() })
      .where(
        and(
          eq(tasks.userId, session.user.id),
          eq(tasks.completed, true),
          eq(tasks.archived, false)
        )
      )
      .returning({ id: tasks.id });

    revalidatePath("/matrix");
    return { success: true, data: { count: result.length } };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to archive tasks" };
  }
}

export async function reorderTasks(data: {
  taskId: string;
  targetQuadrant: string;
  newPosition: number;
}): Promise<ActionResult> {
  try {
    const parsed = reorderTaskSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const session = await getSession();
    const db = getDb();

    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, parsed.data.taskId), eq(tasks.userId, session.user.id)));

    if (!task) return { success: false, error: "Task not found" };

    const sameQuadrant = task.quadrant === parsed.data.targetQuadrant;

    if (sameQuadrant) {
      const oldPos = task.position;
      const newPos = parsed.data.newPosition;

      if (oldPos === newPos) return { success: true, data: undefined };

      if (oldPos < newPos) {
        await db
          .update(tasks)
          .set({ position: sql`${tasks.position} - 1` })
          .where(
            and(
              eq(tasks.userId, session.user.id),
              eq(tasks.quadrant, parsed.data.targetQuadrant),
              gt(tasks.position, oldPos),
              lte(tasks.position, newPos),
              eq(tasks.archived, false)
            )
          );
      } else {
        await db
          .update(tasks)
          .set({ position: sql`${tasks.position} + 1` })
          .where(
            and(
              eq(tasks.userId, session.user.id),
              eq(tasks.quadrant, parsed.data.targetQuadrant),
              gte(tasks.position, newPos),
              lt(tasks.position, oldPos),
              eq(tasks.archived, false)
            )
          );
      }

      await db
        .update(tasks)
        .set({ position: newPos, updatedAt: new Date() })
        .where(eq(tasks.id, parsed.data.taskId));
    } else {
      await db
        .update(tasks)
        .set({ position: sql`${tasks.position} - 1` })
        .where(
          and(
            eq(tasks.userId, session.user.id),
            eq(tasks.quadrant, task.quadrant),
            gt(tasks.position, task.position),
            eq(tasks.archived, false)
          )
        );

      await db
        .update(tasks)
        .set({ position: sql`${tasks.position} + 1` })
        .where(
          and(
            eq(tasks.userId, session.user.id),
            eq(tasks.quadrant, parsed.data.targetQuadrant),
            gte(tasks.position, parsed.data.newPosition),
            eq(tasks.archived, false)
          )
        );

      await db
        .update(tasks)
        .set({
          quadrant: parsed.data.targetQuadrant,
          position: parsed.data.newPosition,
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, parsed.data.taskId));
    }

    revalidatePath("/matrix");
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to reorder tasks" };
  }
}

export async function getArchivedTasks(cursor?: string, limit = 20) {
  const session = await getSession();
  const db = getDb();

  const conditions = [
    eq(tasks.userId, session.user.id),
    eq(tasks.archived, true),
  ];

  if (cursor) {
    conditions.push(lt(tasks.completedAt, new Date(cursor)));
  }

  const rows = await db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(desc(tasks.completedAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore && items[items.length - 1].completedAt
    ? items[items.length - 1].completedAt!.toISOString()
    : null;

  return { tasks: items, nextCursor };
}

export async function restoreArchivedTask(taskId: string): Promise<ActionResult> {
  try {
    const idParsed = taskIdSchema.safeParse(taskId);
    if (!idParsed.success) return { success: false, error: "Invalid task ID" };

    const session = await getSession();
    const db = getDb();

    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.user.id)));

    if (!task) return { success: false, error: "Task not found" };

    const [maxPos] = await db
      .select({ maxPosition: max(tasks.position) })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, session.user.id),
          eq(tasks.quadrant, task.quadrant),
          eq(tasks.archived, false)
        )
      );

    const position = (maxPos?.maxPosition ?? -1) + 1;

    await db
      .update(tasks)
      .set({
        archived: false,
        completed: false,
        completedAt: null,
        position,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, taskId));

    revalidatePath("/matrix");
    revalidatePath("/archive");
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to restore task" };
  }
}
