import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AppHeader } from "@/components/layout/app-header";
import { ArchiveList } from "./archive-list";
import { getAuth } from "@/lib/auth";
import { getArchivedTasks } from "@/actions/task-actions";

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/sign-in");

  const params = await searchParams;
  const { tasks, nextCursor } = await getArchivedTasks(params.cursor);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader userName={session.user.name} />
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-2xl space-y-4">
          <div>
            <h1 className="text-xl font-semibold">Archive</h1>
            <p className="text-sm text-muted-foreground">
              Completed tasks you&apos;ve archived.
            </p>
          </div>
          <ArchiveList tasks={tasks} nextCursor={nextCursor} />
        </div>
      </main>
    </div>
  );
}
