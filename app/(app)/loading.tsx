import { Skeleton } from "@/components/ui/skeleton";

/**
 * The (app) layout now validates the session before anything renders, so there
 * is a moment with nothing on screen. Show the shape of a page instead of a gap.
 */
export default function Loading() {
  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-8 w-36 shrink-0" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="mt-4 h-64 rounded-xl" />
    </>
  );
}
