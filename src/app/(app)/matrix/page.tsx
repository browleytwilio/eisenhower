import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq, and, asc } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/db";
import { tasks } from "@/db/schema";
import { MatrixBoard } from "@/components/matrix/matrix-board";
import { AppHeader } from "@/components/layout/app-header";
import type { Quadrant, Task } from "@/types";

function serializeTask(task: typeof tasks.$inferSelect): Task {
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
  };
}

export default async function MatrixPage() {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/sign-in");

  const db = getDb();
  const rawTasks = await db
    .select()
    .from(tasks)
    .where(
      and(eq(tasks.userId, session.user.id), eq(tasks.archived, false))
    )
    .orderBy(asc(tasks.position));

  const serialized = rawTasks.map(serializeTask);

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
