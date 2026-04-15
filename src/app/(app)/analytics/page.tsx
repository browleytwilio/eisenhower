import { headers } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { getAnalyticsData } from "@/actions/analytics-actions";
import { AppHeader } from "@/components/layout/app-header";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

export default async function AnalyticsPage() {
  await connection();
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/sign-in");

  const data = await getAnalyticsData();

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader userName={session.user.name} />
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
            <p className="text-sm text-muted-foreground">
              Your productivity at a glance.
            </p>
          </div>
          <AnalyticsDashboard data={data} />
        </div>
      </main>
    </div>
  );
}
