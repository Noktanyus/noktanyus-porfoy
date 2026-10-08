/**
 * Kök route loading — pazarlama ana sayfası için hero benzeri iskelet.
 * Eski "list" iskeleti boş gri kutular gibi görünüyordu.
 */
export default function Loading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Sayfa yükleniyor"
      className="container-responsive bg-blob-decoration py-8 sm:py-12"
    >
      <span className="sr-only">Sayfa yükleniyor</span>
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center min-h-[min(70vh,640px)]">
        <div className="space-y-5" aria-hidden="true">
          <div className="h-7 w-44 rounded-full bg-slate-200/70 dark:bg-slate-800/80 animate-pulse" />
          <div className="h-14 sm:h-16 w-4/5 max-w-md rounded-2xl bg-slate-200/70 dark:bg-slate-800/80 animate-pulse" />
          <div className="h-8 w-56 rounded-xl bg-slate-200/60 dark:bg-slate-800/70 animate-pulse" />
          <div className="space-y-2 max-w-xl">
            <div className="h-4 w-full rounded-lg bg-slate-200/60 dark:bg-slate-800/70 animate-pulse" />
            <div className="h-4 w-5/6 rounded-lg bg-slate-200/60 dark:bg-slate-800/70 animate-pulse" />
            <div className="h-4 w-2/3 rounded-lg bg-slate-200/60 dark:bg-slate-800/70 animate-pulse" />
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <div className="h-11 w-36 rounded-xl bg-brand-primary/30 animate-pulse" />
            <div className="h-11 w-36 rounded-xl bg-slate-200/70 dark:bg-slate-800/80 animate-pulse" />
          </div>
        </div>
        <div className="mx-auto w-full max-w-[280px] sm:max-w-sm" aria-hidden="true">
          <div className="aspect-square rounded-[2rem] bg-gradient-to-br from-slate-800/80 via-brand-primary/20 to-sky-900/40 border border-white/5 animate-pulse shadow-2xl shadow-brand-primary/10" />
        </div>
      </div>
    </div>
  );
}
