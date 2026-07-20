import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <div className="space-y-6"><div className="space-y-2"><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-96 max-w-full" /></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div><div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]"><Skeleton className="h-[480px] rounded-xl" /><Skeleton className="h-[480px] rounded-xl" /></div></div>;
}
