"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Archive, LogOut, KeyRound, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { signOut, changePassword, deleteUser } from "@/lib/auth-client";
import { archiveCompletedTasks } from "@/actions/task-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  { keys: ["Shift", "S"], description: "Toggle selection mode" },
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
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                window.location.href = "/api/export?format=csv";
              }}
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                window.location.href = "/api/export?format=json";
              }}
            >
              <Download className="h-3.5 w-3.5" />
              Export JSON
            </Button>
          </div>
          <Separator />
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
          <div className="flex flex-wrap gap-2">
            <ChangePasswordDialog />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={async () => {
                await signOut();
                router.push("/sign-in");
              }}
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </Button>
          </div>
          <Separator />
          <DeleteAccountDialog />
        </CardContent>
      </Card>
    </div>
  );
}

function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirm) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    const { error } = await changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });

    if (error) {
      setError(error.message ?? "Failed to change password");
      setLoading(false);
      return;
    }

    toast.success("Password updated");
    setOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirm("");
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5" />
        }
      >
        <KeyRound className="h-3.5 w-3.5" />
        Change password
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="Min 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Updating..." : "Update password"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteAccountDialog() {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const { error } = await deleteUser();

    if (error) {
      toast.error(error.message ?? "Failed to delete account");
      setLoading(false);
      return;
    }

    router.push("/sign-in");
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-destructive hover:text-destructive"
          />
        }
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete account
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete account</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete your account and all your tasks. This action cannot be undone. Type &ldquo;delete&rdquo; to confirm.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          placeholder='Type "delete" to confirm'
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
        />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={confirmText !== "delete" || loading}
            onClick={handleDelete}
          >
            {loading ? "Deleting..." : "Delete account"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
