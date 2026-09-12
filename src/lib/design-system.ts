/**
 * Design System Tokens
 *
 * Tasarim standartlari: renkler, spacing, radius, shadow, typography ve
 * tekrar kullanilan component class stringleri. Tum yeni UI bu tokenlara
 * uygun olmali. Dark mode varyantlari dahildir.
 *
 * Kullanim ornegi:
 *   import { DS } from '@/lib/design-system';
 *   <button className={DS.button.primary}>Kaydet</button>
 */

/* ============================================================
 * COLOR — semantik renk aileleri. Tailwind'in ham paleti (indigo,
 * slate, rose, ...) ile calisan yerler icin alias. OKLCH token
 * sistemini kullanan yerler (bg-background, text-foreground) bu
 * sabite ihtiyac duymaz.
 * ============================================================ */
export const COLORS = {
  primary: {
    base: 'indigo',
    text: 'text-indigo-600 dark:text-indigo-400',
    textHover: 'hover:text-indigo-700 dark:hover:text-indigo-300',
    bg: 'bg-indigo-600',
    bgHover: 'hover:bg-indigo-700',
    ring: 'focus-visible:ring-indigo-500',
    border: 'focus:border-indigo-500',
  },
  success: {
    base: 'emerald',
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-600',
    bgHover: 'hover:bg-emerald-700',
    border: 'border-emerald-500',
  },
  warning: {
    base: 'amber',
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500',
    bgHover: 'hover:bg-amber-600',
    border: 'border-amber-500',
  },
  error: {
    base: 'rose',
    text: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-600',
    bgHover: 'hover:bg-rose-700',
    border: 'border-rose-500',
  },
  neutral: {
    base: 'slate',
    text: 'text-slate-700 dark:text-slate-300',
    textStrong: 'text-slate-900 dark:text-white',
    bg: 'bg-slate-100 dark:bg-slate-800',
    bgHover: 'hover:bg-slate-200 dark:hover:bg-slate-700',
    border: 'border-slate-300 dark:border-slate-600',
  },
} as const;

/* ============================================================
 * SPACING — duzey bazli padding. Daha fazla olcum icin Tailwind
 * spacing scale kullanilir.
 * ============================================================ */
export const SPACING = {
  xs: 'p-2',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
} as const;

/* ============================================================
 * RADIUS — koseler. Tailwind `rounded-2xl` daha soft gorunum
 * icin default; `lg` ve `full` da gerekli durumlar icin var.
 * ============================================================ */
export const RADIUS = {
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  full: 'rounded-full',
} as const;

/* ============================================================
 * SHADOW — kart, buton, modal golgeleri.
 * ============================================================ */
export const SHADOW = {
  card: 'shadow-xl',
  button: 'shadow-md',
  modal: 'shadow-2xl',
  none: 'shadow-none',
  sm: 'shadow-sm',
} as const;

/* ============================================================
 * TYPOGRAPHY — semantik tipografi olcekleri.
 * ============================================================ */
export const TYPOGRAPHY = {
  h1: 'text-4xl font-bold',
  h2: 'text-3xl font-bold',
  h3: 'text-2xl font-semibold',
  h4: 'text-xl font-semibold',
  body: 'text-base',
  small: 'text-sm',
  xs: 'text-xs',
} as const;

/* ============================================================
 * SURFACE — yalin yuzey cesitleri. globals.css `.surface-*` ile
 * eslesir. Tek kaynaktan kart/muted/elevated/glass secimi.
 * ============================================================ */
export const SURFACE = {
  base: 'bg-card text-card-foreground border border-border',
  muted: 'bg-muted text-foreground border border-border',
  elevated: 'bg-card text-card-foreground border border-border shadow-sm',
  glass: 'bg-card/80 backdrop-blur-md border border-border',
} as const;

/* ============================================================
 * STATUS — inline durum etiketleri (active/inactive/pending).
 * ============================================================ */
export const STATUS = {
  active: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  inactive: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-rose-500/15 text-rose-700 dark:text-rose-300',
  pending: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-700 dark:text-amber-300',
  info: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-sky-500/15 text-sky-700 dark:text-sky-300',
} as const;

/* ============================================================
 * FOCUS — klavye focus halkasi.
 * ============================================================ */
export const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900';

/* ============================================================
 * TOUCH — minimum 44px dokunma hedefi.
 * ============================================================ */
export const TOUCH = {
  base: 'min-h-[44px] min-w-[44px]',
  iconOnly: 'min-h-[44px] min-w-[44px] inline-flex items-center justify-center',
} as const;

/* ============================================================
 * Component Class Strings — design system standard.
 * Tum yeni UI bu sabitleri kullanmali.
 * ============================================================ */
export const DS = {
  button: {
    primary: `inline-flex items-center justify-center gap-2 ${TOUCH.base} ${RADIUS.md} ${SHADOW.button} ${COLORS.primary.bg} ${COLORS.primary.bgHover} text-white font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`,
    secondary: `inline-flex items-center justify-center gap-2 ${TOUCH.base} ${RADIUS.md} ${COLORS.neutral.bg} ${COLORS.neutral.bgHover} text-slate-900 dark:text-white font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`,
    danger: `inline-flex items-center justify-center gap-2 ${TOUCH.base} ${RADIUS.md} ${SHADOW.button} ${COLORS.error.bg} ${COLORS.error.bgHover} text-white font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`,
    ghost: `inline-flex items-center justify-center gap-2 ${TOUCH.base} ${RADIUS.md} bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2`,
    icon: `${TOUCH.iconOnly} ${RADIUS.md} ${COLORS.neutral.bg} ${COLORS.neutral.bgHover} text-slate-700 dark:text-slate-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2`,
  },
  card: `bg-white dark:bg-slate-800 ${RADIUS.lg} ${SHADOW.card} border border-slate-200 dark:border-slate-700 ${SPACING.md}`,
  input: `w-full ${RADIUS.sm} border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 ${TOUCH.base} text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition disabled:opacity-50 disabled:cursor-not-allowed`,
  inputError: `aria-[invalid=true]:border-rose-500 aria-[invalid=true]:ring-rose-500/20`,
  label: `block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5`,
  helperText: `mt-1.5 text-sm text-slate-500 dark:text-slate-400`,
  errorText: `mt-1.5 text-sm text-rose-600 dark:text-rose-400`,
  /* Form-level error banner (LoginForm, RegisterForm, TwoFactor...) */
  formErrorBanner: `p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-sm border border-rose-200 dark:border-rose-800`,
  formSuccessBanner: `p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-sm border border-emerald-200 dark:border-emerald-800`,
} as const;

/* ============================================================
 * SKIP LINK — a11y klavye atlama linki.
 * ============================================================ */
export const SKIP_LINK =
  'sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2';

export default DS;
