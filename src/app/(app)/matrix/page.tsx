import { headers } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { eq, and, asc, sql } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/db";
import { tasks, subtasks } from "@/db/schema";
import { MatrixBoard } from "@/components/matrix/matrix-board";
import { AppHeader } from "@/components/layout/app-header";
import type { Quadrant, Task } from "@/types";

function serializeTask(
  task: typeof tasks.$inferSelect,
  counts?: { total: number; done: number }
): Task {
  return {
    id: task.id,
    userId: task.userId,
    title: task.title,
    description: task.description,
    quadrant: task.quadrant,
    position: task.position,
    dueDate: task.dueDate?.toISOString() ?? null,
    tags: task.tags,
    completed: task.completed,
    completedAt: task.completedAt?.toISOString() ?? null,
    archived: task.archived,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    subtaskCount: counts?.total ?? 0,
    subtaskDoneCount: counts?.done ?? 0,
  };
}

export default async function MatrixPage() {
  await connection();
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/sign-in");

  const db = getDb();
  const rawTasks = await db
    .select({
      task: tasks,
      subtaskTotal: sql<number>`coalesce((select count(*) from subtasks where subtasks.task_id = ${tasks.id}), 0)`.as("subtask_total"),
      subtaskDone: sql<number>`coalesce((select count(*) from subtasks where subtasks.task_id = ${tasks.id} and subtasks.completed = true), 0)`.as("subtask_done"),
    })
    .from(tasks)
    .where(
      and(eq(tasks.userId, session.user.id), eq(tasks.archived, false))
    )
    .orderBy(asc(tasks.position));

  const serialized = rawTasks.map((row) =>
    serializeTask(row.task, {
      total: Number(row.subtaskTotal),
      done: Number(row.subtaskDone),
    })
  );

  const tasksByQuadrant: Record<Quadrant, Task[]> = {
    do_first: [],
    schedule: [],
    delegate: [],
    eliminate: [],
  };

  for (const task of serialized) {
    tasksByQuadrant[task.quadrant].push(task);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader userName={session.user.name} />
      <main className="flex-1 p-4 md:p-6">
        <MatrixBoard tasksByQuadrant={tasksByQuadrant} />
      </main>
    </div>
  );
}
