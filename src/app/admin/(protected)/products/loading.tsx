import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-gray-200/50 dark:bg-gray-700/30 rounded-lg animate-pulse" />
        <div className="h-10 w-32 bg-gray-200/50 dark:bg-gray-700/30 rounded-xl animate-pulse" />
      </div>
      <LoadingSkeleton variant="table-row" count={6} />
    </div>
  );
}
