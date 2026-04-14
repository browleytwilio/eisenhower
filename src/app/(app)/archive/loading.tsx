import { Skeleton } from "@/components/ui/skeleton";

export default function ArchiveLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4 md:px-6">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="space-y-1">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-4 w-52" />
          </div>
          <div className="space-y-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-md border px-3 py-2"
              >
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-7 w-7 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
