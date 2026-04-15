"use server";

import { headers } from "next/headers";
import { eq, and, gte, sql } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/db";
import { tasks } from "@/db/schema";
import type { Quadrant } from "@/types";

async function getSession() {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });
  if (!session) throw new Error("Unauthorized");
  return session;
}

export type AnalyticsData = {
  dailyCompletions: { date: string; count: number; quadrant: Quadrant }[];
  streak: number;
  tasksThisWeek: number;
  completionRate: number;
  totalActive: number;
  quadrantDistribution: Record<Quadrant, number>;
};

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const session = await getSession();
  const db = getDb();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [dailyRows, activeRows, weekCount] = await Promise.all([
    db
      .select({
        date: sql<string>`date(${tasks.completedAt})`.as("date"),
        quadrant: tasks.quadrant,
        count: sql<number>`count(*)::int`.as("count"),
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, session.user.id),
          eq(tasks.completed, true),
          gte(tasks.completedAt, thirtyDaysAgo)
        )
      )
      .groupBy(sql`date(${tasks.completedAt})`, tasks.quadrant),

    db
      .select({
        quadrant: tasks.quadrant,
        total: sql<number>`count(*)::int`.as("total"),
        done: sql<number>`sum(case when ${tasks.completed} then 1 else 0 end)::int`.as("done"),
      })
      .from(tasks)
      .where(
        and(eq(tasks.userId, session.user.id), eq(tasks.archived, false))
      )
      .groupBy(tasks.quadrant),

    db
      .select({
        count: sql<number>`count(*)::int`.as("count"),
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, session.user.id),
          eq(tasks.completed, true),
          gte(tasks.completedAt, sevenDaysAgo)
        )
      ),
  ]);

  // Build daily completions
  const dailyCompletions = dailyRows.map((r) => ({
    date: r.date,
    count: Number(r.count),
    quadrant: r.quadrant,
  }));

  // Quadrant distribution + completion rate
  const quadrantDistribution: Record<Quadrant, number> = {
    do_first: 0,
    schedule: 0,
    delegate: 0,
    eliminate: 0,
  };
  let totalActive = 0;
  let totalDone = 0;

  for (const row of activeRows) {
    quadrantDistribution[row.quadrant] = Number(row.total);
    totalActive += Number(row.total);
    totalDone += Number(row.done);
  }

  const completionRate = totalActive > 0 ? totalDone / totalActive : 0;
  const tasksThisWeek = Number(weekCount[0]?.count ?? 0);

  // Calculate streak: consecutive days with at least one completion ending today (or yesterday)
  const completionDates = new Set(dailyRows.map((r) => r.date));
  let streak = 0;
  const day = new Date();
  day.setHours(0, 0, 0, 0);
  const todayStr = day.toISOString().slice(0, 10);

  // Check if today or yesterday has a completion to start counting
  if (!completionDates.has(todayStr)) {
    day.setDate(day.getDate() - 1);
    const yesterdayStr = day.toISOString().slice(0, 10);
    if (!completionDates.has(yesterdayStr)) {
      return {
        dailyCompletions,
        streak: 0,
        tasksThisWeek,
        completionRate,
        totalActive,
        quadrantDistribution,
      };
    }
  }

  // Count consecutive days backward
  const cursor = new Date(day);
  for (let i = 0; i < 30; i++) {
    const dateStr = cursor.toISOString().slice(0, 10);
    if (completionDates.has(dateStr)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    dailyCompletions,
    streak,
    tasksThisWeek,
    completionRate,
    totalActive,
    quadrantDistribution,
  };
}
