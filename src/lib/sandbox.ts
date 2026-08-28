/**
 * @file Sandbox environment helpers
 * @description Detects whether the app is running in a non-production / test
 *              environment so that destructive admin operations (e.g. data
 *              reset) can be guarded. Detection combines an explicit env
 *              flag with heuristic checks on payment provider keys (Stripe,
 *              iyzico) so a forgotten flag in a test branch is still caught.
 * */

const SANDBOX_KEY_PREFIXES = ['sk_test_', 'pk_test_', 'test_'];

export function isSandboxMode(): boolean {
  // Explicit override always wins
  if (process.env.SANDBOX_MODE === 'true') return true;
  if (process.env.SANDBOX_MODE === 'false') return false;

  // Heuristic — test payment keys indicate a sandbox deployment
  const stripeKey = process.env.STRIPE_SECRET_KEY ?? '';
  if (SANDBOX_KEY_PREFIXES.some((p) => stripeKey.startsWith(p))) return true;

  // iyzico sandbox URI
  if (process.env.IYZICO_URI?.includes('sandbox')) return true;

  // NODE_ENV !== production is generally safe for local/test work
  if (process.env.NODE_ENV && process.env.NODE_ENV !== 'production') return true;

  return false;
}

/**
 * Returns the Stripe/iyzico mode inferred from a key prefix.
 * Defaults to 'test' if no recognisable prefix is present.
 */
export function getApiKeyMode(key: string): 'live' | 'test' {
  if (!key) return 'test';
  if (key.startsWith('sk_live_') || key.startsWith('pk_live_')) return 'live';
  return 'test';
}

/**
 * Throws when the current process is not in sandbox mode. Use at the top of
 * destructive admin endpoints so a stray production deploy cannot call them.
 */
export function requireSandbox(): void {
  if (!isSandboxMode()) {
    throw new Error('Bu işlem sadece sandbox/test modunda kullanılabilir');
  }
}