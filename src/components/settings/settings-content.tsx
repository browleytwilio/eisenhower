"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Archive, LogOut } from "lucide-react";
import { toast } from "sonner";
import { signOut } from "@/lib/auth-client";
import { archiveCompletedTasks } from "@/actions/task-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const shortcuts = [
  { keys: ["N"], description: "Quick-add a new task" },
  { keys: ["\u2318", "K"], description: "Open command search" },
  { keys: ["Double-click"], description: "Inline-edit task title" },
];

export function SettingsContent({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail: string;
}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  async function handleArchiveAll() {
    const result = await archiveCompletedTasks();
    if (result.success) {
      toast.success(
        `Archived ${result.data.count} task${result.data.count === 1 ? "" : "s"}`
      );
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Keyboard shortcuts</CardTitle>
          <CardDescription>Quick actions for power users.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {shortcuts.map((s) => (
              <div
                key={s.description}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">{s.description}</span>
                <div className="flex gap-1">
                  {s.keys.map((k) => (
                    <kbd
                      key={k}
                      className="rounded border bg-muted px-1.5 py-0.5 text-xs font-mono"
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Theme</CardTitle>
          <CardDescription>Choose your preferred appearance.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {[
              { value: "light", icon: Sun, label: "Light" },
              { value: "dark", icon: Moon, label: "Dark" },
              { value: "system", icon: Monitor, label: "System" },
            ].map(({ value, icon: Icon, label }) => (
              <Button
                key={value}
                variant={theme === value ? "default" : "outline"}
                size="sm"
                className="gap-1.5"
                onClick={() => setTheme(value)}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data</CardTitle>
          <CardDescription>Manage your tasks and data.</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button variant="outline" size="sm" className="gap-1.5" />
              }
            >
              <Archive className="h-3.5 w-3.5" />
              Archive all completed tasks
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Archive completed tasks</AlertDialogTitle>
                <AlertDialogDescription>
                  This will archive all completed tasks across every quadrant.
                  You can restore them from the archive later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleArchiveAll}>
                  Archive
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1 text-sm">
            <p className="font-medium">{userName}</p>
            <p className="text-muted-foreground">{userEmail}</p>
          </div>
          <Separator />
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-destructive hover:text-destructive"
            onClick={async () => {
              await signOut();
              router.push("/sign-in");
            }}
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
