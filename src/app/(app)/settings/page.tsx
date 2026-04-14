import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AppHeader } from "@/components/layout/app-header";
import { SettingsContent } from "@/components/settings/settings-content";
import { getAuth } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/sign-in");

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader userName={session.user.name} />
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <div>
            <h1 className="text-xl font-semibold">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your preferences and account.
            </p>
          </div>
          <SettingsContent
            userName={session.user.name}
            userEmail={session.user.email}
          />
        </div>
      </main>
    </div>
  );
}
