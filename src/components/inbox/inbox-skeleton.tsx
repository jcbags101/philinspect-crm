import { Skeleton } from "@/components/ui/skeleton";

export function InboxSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><Skeleton className="h-8 w-48" /><Skeleton className="h-7 w-56" /></div>
      <div className="grid min-h-[70vh] grid-cols-1 overflow-hidden rounded-xl border xl:grid-cols-[300px_minmax(0,1fr)_300px]">
        {[0, 1, 2].map((column) => <div key={column} className="space-y-4 border-r p-4 last:border-r-0">{Array.from({ length: 7 }, (_, row) => <Skeleton key={row} className={row === 0 ? "h-9 w-full" : "h-16 w-full"} />)}</div>)}
      </div>
    </div>
  );
}
