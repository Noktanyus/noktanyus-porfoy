import Link from 'next/link';
import { FaCheckCircle, FaCircle, FaArrowRight } from 'react-icons/fa';

type Step = {
  id: string;
  label: string;
  href: string;
  done: boolean;
};

/**
 * Entegratör onboarding checklist — TTFHW sonrası konsol rehberi.
 */
export function SetupChecklist({ steps }: { steps: Step[] }) {
  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;

  return (
    <section
      className="rounded-2xl border border-border bg-card/50 p-5 sm:p-6"
      aria-labelledby="setup-checklist-title"
    >
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary mb-1">
            Kurulum
          </p>
          <h2 id="setup-checklist-title" className="text-lg font-bold text-foreground">
            {allDone ? 'Hazırsın' : 'İlk entegrasyon adımları'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {doneCount}/{steps.length} tamamlandı
          </p>
        </div>
        <div className="h-2 w-32 rounded-full bg-muted overflow-hidden" aria-hidden="true">
          <div
            className="h-full rounded-full bg-brand-primary transition-all"
            style={{ width: `${(doneCount / Math.max(steps.length, 1)) * 100}%` }}
          />
        </div>
      </div>

      <ol className="space-y-2">
        {steps.map((step) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className="flex items-center gap-3 rounded-xl border border-border/70 px-3 py-3 text-sm hover:border-brand-primary/40 transition-colors min-h-[48px]"
            >
              {step.done ? (
                <FaCheckCircle className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
              ) : (
                <FaCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
              )}
              <span
                className={`flex-1 font-medium ${
                  step.done ? 'text-muted-foreground line-through' : 'text-foreground'
                }`}
              >
                {step.label}
              </span>
              {!step.done && (
                <FaArrowRight className="h-3 w-3 text-brand-primary shrink-0" aria-hidden="true" />
              )}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
