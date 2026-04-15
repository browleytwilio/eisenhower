"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and, inArray, sql } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/db";
import { tasks } from "@/db/schema";
import { z } from "zod";
import { quadrantSchema, type ActionResult } from "@/lib/validations";

async function getSession() {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });
  if (!session) throw new Error("Unauthorized");
  return session;
}

const bulkIdsSchema = z.array(z.string().uuid()).min(1).max(100);

export async function bulkComplete(
  ids: string[]
): Promise<ActionResult<{ count: number }>> {
  try {
    const parsed = bulkIdsSchema.safeParse(ids);
    if (!parsed.success) return { success: false, error: "Invalid task IDs" };

    const session = await getSession();
    const db = getDb();

    const result = await db
      .update(tasks)
      .set({ completed: true, completedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(tasks.userId, session.user.id),
          inArray(tasks.id, parsed.data),
          eq(tasks.completed, false)
        )
      )
      .returning({ id: tasks.id });

    revalidatePath("/matrix");
    return { success: true, data: { count: result.length } };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to complete tasks",
    };
  }
}

export async function bulkDelete(
  ids: string[]
): Promise<ActionResult<{ count: number }>> {
  try {
    const parsed = bulkIdsSchema.safeParse(ids);
    if (!parsed.success) return { success: false, error: "Invalid task IDs" };

    const session = await getSession();
    const db = getDb();

    const result = await db
      .delete(tasks)
      .where(
        and(eq(tasks.userId, session.user.id), inArray(tasks.id, parsed.data))
      )
      .returning({ id: tasks.id });

    revalidatePath("/matrix");
    return { success: true, data: { count: result.length } };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to delete tasks",
    };
  }
}

export async function bulkMove(
  ids: string[],
  targetQuadrant: string
): Promise<ActionResult<{ count: number }>> {
  try {
    const parsed = bulkIdsSchema.safeParse(ids);
    if (!parsed.success) return { success: false, error: "Invalid task IDs" };

    const qParsed = quadrantSchema.safeParse(targetQuadrant);
    if (!qParsed.success) return { success: false, error: "Invalid quadrant" };

    const session = await getSession();
    const db = getDb();

    const result = await db
      .update(tasks)
      .set({
        quadrant: qParsed.data,
        updatedAt: new Date(),
      })
      .where(
        and(eq(tasks.userId, session.user.id), inArray(tasks.id, parsed.data))
      )
      .returning({ id: tasks.id });

    revalidatePath("/matrix");
    return { success: true, data: { count: result.length } };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to move tasks",
    };
  }
}
