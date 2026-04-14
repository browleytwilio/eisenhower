import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function QuadrantSkeleton() {
  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2 pt-4 px-4">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="ml-auto h-5 w-6 rounded-full" />
      </CardHeader>
      <CardContent className="flex-1 px-3 pb-3 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 rounded-md border p-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function MatrixLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4 md:px-6">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
      <main className="flex-1 p-4 md:p-6">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <QuadrantSkeleton key={i} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
