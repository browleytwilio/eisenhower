import { headers } from "next/headers";
import { eq, asc, and } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/db";
import { tasks } from "@/db/schema";

export async function GET(request: Request) {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format");
  if (format !== "csv" && format !== "json") {
    return new Response("Invalid format. Use ?format=csv or ?format=json", {
      status: 400,
    });
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, session.user.id), eq(tasks.archived, false)))
    .orderBy(asc(tasks.quadrant), asc(tasks.position));

  const date = new Date().toISOString().slice(0, 10);

  if (format === "json") {
    const data = rows.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      quadrant: t.quadrant,
      completed: t.completed,
      completedAt: t.completedAt?.toISOString() ?? null,
      dueDate: t.dueDate?.toISOString() ?? null,
      tags: t.tags,
      createdAt: t.createdAt.toISOString(),
    }));

    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="eisenhower-tasks-${date}.json"`,
      },
    });
  }

  const escape = (v: string) =>
    `"${v.replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;

  const header = "Title,Quadrant,Completed,Due Date,Tags,Description,Created";
  const csvRows = rows.map((t) =>
    [
      escape(t.title),
      escape(t.quadrant),
      escape(t.completed ? "Yes" : "No"),
      escape(t.dueDate?.toISOString().slice(0, 10) ?? ""),
      escape((t.tags ?? []).join("; ")),
      escape(t.description ?? ""),
      escape(t.createdAt.toISOString().slice(0, 10)),
    ].join(",")
  );

  const csv = [header, ...csvRows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="eisenhower-tasks-${date}.csv"`,
    },
  });
}
