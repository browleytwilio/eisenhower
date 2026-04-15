"use client";

import { Flame, CheckCircle2, TrendingUp, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyticsData } from "@/actions/analytics-actions";
import type { Quadrant } from "@/types";

const QUADRANT_LABELS: Record<Quadrant, string> = {
  do_first: "Do First",
  schedule: "Schedule",
  delegate: "Delegate",
  eliminate: "Eliminate",
};

const QUADRANT_COLORS: Record<Quadrant, string> = {
  do_first: "bg-red-500",
  schedule: "bg-blue-500",
  delegate: "bg-amber-500",
  eliminate: "bg-zinc-500",
};

export function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
  // Aggregate daily completions by date for the bar chart
  const dailyTotals = new Map<string, Record<Quadrant, number>>();
  for (const entry of data.dailyCompletions) {
    const existing = dailyTotals.get(entry.date) ?? {
      do_first: 0,
      schedule: 0,
      delegate: 0,
      eliminate: 0,
    };
    existing[entry.quadrant] += entry.count;
    dailyTotals.set(entry.date, existing);
  }

  // Build 30-day range
  const days: { date: string; totals: Record<Quadrant, number> }[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (let i = 29; i >= 0; i--) {
    const d = new Date(cursor);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    days.push({
      date: dateStr,
      totals: dailyTotals.get(dateStr) ?? {
        do_first: 0,
        schedule: 0,
        delegate: 0,
        eliminate: 0,
      },
    });
  }

  const maxDaily = Math.max(
    1,
    ...days.map((d) =>
      Object.values(d.totals).reduce((a, b) => a + b, 0)
    )
  );

  // Quadrant distribution bar
  const distTotal = Object.values(data.quadrantDistribution).reduce(
    (a, b) => a + b,
    0
  );

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-md bg-orange-500/10 p-2">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.streak}</p>
              <p className="text-xs text-muted-foreground">Day streak</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-md bg-green-500/10 p-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.tasksThisWeek}</p>
              <p className="text-xs text-muted-foreground">
                Completed this week
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-md bg-blue-500/10 p-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {Math.round(data.completionRate * 100)}%
              </p>
              <p className="text-xs text-muted-foreground">Completion rate</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-md bg-purple-500/10 p-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.totalActive}</p>
              <p className="text-xs text-muted-foreground">Active tasks</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 30-day completion chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">30-day activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-[3px] h-32">
            {days.map((day) => {
              const total = Object.values(day.totals).reduce(
                (a, b) => a + b,
                0
              );
              const heightPercent = (total / maxDaily) * 100;
              const quadrants: Quadrant[] = [
                "do_first",
                "schedule",
                "delegate",
                "eliminate",
              ];
              return (
                <div
                  key={day.date}
                  className="group relative flex-1 flex flex-col justify-end h-full"
                  title={`${day.date}: ${total} completed`}
                >
                  <div
                    className="w-full rounded-sm overflow-hidden flex flex-col-reverse"
                    style={{ height: `${Math.max(heightPercent, total > 0 ? 4 : 0)}%` }}
                  >
                    {quadrants.map((q) => {
                      if (day.totals[q] === 0) return null;
                      const segmentPct =
                        total > 0 ? (day.totals[q] / total) * 100 : 0;
                      return (
                        <div
                          key={q}
                          className={`${QUADRANT_COLORS[q]} w-full`}
                          style={{ height: `${segmentPct}%`, minHeight: 2 }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
            <span>{days[0].date.slice(5)}</span>
            <span>{days[days.length - 1].date.slice(5)}</span>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-3">
            {(
              ["do_first", "schedule", "delegate", "eliminate"] as Quadrant[]
            ).map((q) => (
              <div key={q} className="flex items-center gap-1.5 text-xs">
                <div
                  className={`h-2.5 w-2.5 rounded-sm ${QUADRANT_COLORS[q]}`}
                />
                <span className="text-muted-foreground">
                  {QUADRANT_LABELS[q]}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quadrant distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quadrant distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {distTotal === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active tasks yet.
            </p>
          ) : (
            <>
              <div className="flex h-4 w-full overflow-hidden rounded-full">
                {(
                  [
                    "do_first",
                    "schedule",
                    "delegate",
                    "eliminate",
                  ] as Quadrant[]
                ).map((q) => {
                  const pct =
                    distTotal > 0
                      ? (data.quadrantDistribution[q] / distTotal) * 100
                      : 0;
                  if (pct === 0) return null;
                  return (
                    <div
                      key={q}
                      className={`${QUADRANT_COLORS[q]}`}
                      style={{ width: `${pct}%` }}
                      title={`${QUADRANT_LABELS[q]}: ${data.quadrantDistribution[q]}`}
                    />
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    "do_first",
                    "schedule",
                    "delegate",
                    "eliminate",
                  ] as Quadrant[]
                ).map((q) => (
                  <div
                    key={q}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`h-2.5 w-2.5 rounded-sm ${QUADRANT_COLORS[q]}`}
                      />
                      <span className="text-muted-foreground">
                        {QUADRANT_LABELS[q]}
                      </span>
                    </div>
                    <span className="font-medium">
                      {data.quadrantDistribution[q]}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
