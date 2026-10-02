/**
 * @file Sandbox environment helpers
 * @description Detects whether the app is running in a non-production / test
 *              environment so that destructive admin operations (e.g. data
 *              reset) can be guarded. Detection combines an explicit env
 *              flag with heuristic checks on PayTR test mode so a forgotten
 *              flag in a test branch is still caught.
 */

export function isSandboxMode(): boolean {
  // Explicit override always wins
  if (process.env.SANDBOX_MODE === 'true') return true;
  if (process.env.SANDBOX_MODE === 'false') return false;

  // PayTR test modu
  if (process.env.PAYTR_TEST_MODE === '1') return true;

  // NODE_ENV !== production is generally safe for local/test work
  if (process.env.NODE_ENV && process.env.NODE_ENV !== 'production') return true;

  return false;
}

/**
 * Returns mode inferred from key prefix.
 */
export function getApiKeyMode(key: string): 'live' | 'test' {
  if (!key) return 'test';
  if (key.startsWith('live_') || key.startsWith('sk_live_')) return 'live';
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