import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card-premium p-5 animate-pulse">
            <div className="h-4 w-24 bg-gray-200/50 dark:bg-gray-700/30 rounded mb-3" />
            <div className="h-8 w-32 bg-gray-200/50 dark:bg-gray-700/30 rounded" />
          </div>
        ))}
      </div>
      <LoadingSkeleton variant="card" count={3} />
    </div>
  );
}
