import Link from "next/link";
import {
  Flame,
  CalendarClock,
  Users,
  Trash2,
  ArrowRight,
  Keyboard,
  Moon,
  GripVertical,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  {
    icon: LayoutGrid,
    title: "Four quadrant matrix",
    description:
      "Organize tasks by urgency and importance using the proven Eisenhower framework.",
  },
  {
    icon: GripVertical,
    title: "Drag and drop",
    description:
      "Effortlessly move tasks between quadrants and reorder priorities.",
  },
  {
    icon: Keyboard,
    title: "Keyboard first",
    description:
      "Quick-add with N, search with Cmd+K, and navigate without touching a mouse.",
  },
  {
    icon: Moon,
    title: "Dark mode",
    description:
      "Easy on the eyes with system-aware light and dark themes.",
  },
];

const QUADRANT_PREVIEW = [
  { label: "Do First", desc: "Urgent & Important", color: "var(--q1)", icon: Flame },
  { label: "Schedule", desc: "Important, Not Urgent", color: "var(--q2)", icon: CalendarClock },
  { label: "Delegate", desc: "Urgent, Not Important", color: "var(--q3)", icon: Users },
  { label: "Eliminate", desc: "Neither", color: "var(--q4)", icon: Trash2 },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold tracking-tight">
            <LayoutGrid className="h-5 w-5" />
            Eisenhower
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" render={<Link href="/sign-in" />}>
              Sign in
            </Button>
            <Button size="sm" render={<Link href="/sign-up" />}>
              Get started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-20 text-center md:py-32">
        <div className="space-y-4">
          <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Prioritize what
            <br />
            <span className="bg-gradient-to-r from-[var(--q1)] via-[var(--q2)] to-[var(--q3)] bg-clip-text text-transparent">
              truly matters
            </span>
          </h1>
          <p className="mx-auto max-w-lg text-lg text-muted-foreground">
            A free, beautifully designed Eisenhower Matrix that helps you focus
            on the important, eliminate the noise, and get more done.
          </p>
        </div>
        <div className="flex gap-3">
          <Button size="lg" render={<Link href="/sign-up" />}>
            Start organizing
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" size="lg" render={<Link href="/sign-in" />}>
            Sign in
          </Button>
        </div>

        {/* Matrix preview */}
        <div className="mt-8 grid w-full max-w-xl grid-cols-2 gap-3">
          {QUADRANT_PREVIEW.map((q) => (
            <Card
              key={q.label}
              className="border-t-[3px] text-left"
              style={{ borderTopColor: q.color }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <q.icon className="h-4 w-4" style={{ color: q.color }} />
                  <span className="text-sm font-medium">{q.label}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{q.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight">
            Everything you need to stay focused
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <Card key={f.title} className="text-left">
                <CardContent className="p-5">
                  <f.icon className="mb-3 h-5 w-5 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">{f.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {f.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 text-xs text-muted-foreground">
          <span>Eisenhower Matrix</span>
          <span>Free forever. No tracking.</span>
        </div>
      </footer>
    </div>
  );
}
