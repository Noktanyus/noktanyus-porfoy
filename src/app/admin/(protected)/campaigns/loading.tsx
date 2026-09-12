import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-gray-200/50 dark:bg-gray-700/30 rounded-lg animate-pulse" />
      <LoadingSkeleton variant="card" count={3} />
    </div>
  );
}
