export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-label="İçerik yükleniyor">
      <div className="glass-card p-10 flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin"></div>
        <p className="text-gray-600 dark:text-gray-400 font-medium animate-pulse">İçerik Yükleniyor...</p>
      </div>
    </div>
  );
}
