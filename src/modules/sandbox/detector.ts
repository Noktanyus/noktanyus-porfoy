/**
 * @file Sandbox Detector
 * @description D2: Mevcut environment'ın sandbox modunda olup olmadığını tespit eder.
 *              3 seviye:
 *              - production: gerçek sistem, gerçek ödeme
 *              - staging: gerçek sistem ama test verileri
 *              - sandbox: tamamen izole, mock veri + mock ödeme
 */

export type EnvironmentMode = "production" | "staging" | "sandbox";

export interface SandboxConfig {
  mode: EnvironmentMode;
  /** Mock ödeme gateway kullanılsın mı */
  useMockPayment: boolean;
  /** DB schema namespace (sandbox'ta ayrı DB veya namespace) */
  dbNamespace: string;
  /** Real PII kullanılsın mı (KYC vs) */
  useRealPII: boolean;
  /** Dış API çağrıları mock'lansın mı */
  mockExternalAPIs: boolean;
}

const DEFAULT_CONFIG: SandboxConfig = {
  mode: "production",
  useMockPayment: false,
  dbNamespace: "default",
  useRealPII: true,
  mockExternalAPIs: false,
};

const SANDBOX_CONFIG: SandboxConfig = {
  mode: "sandbox",
  useMockPayment: true,
  dbNamespace: "sandbox",
  useRealPII: false,
  mockExternalAPIs: true,
};

const STAGING_CONFIG: SandboxConfig = {
  mode: "staging",
  useMockPayment: false, // gerçek ödeme gateway (test kartları)
  dbNamespace: "staging",
  useRealPII: false,
  mockExternalAPIs: false,
};

/**
 * Environment variable'lardan mode tespit et.
 * Öncelik: SANDBOX_MODE > NODE_ENV > STAGING_FLAG
 */
export function detectSandboxMode(): SandboxConfig {
  if (process.env.SANDBOX_MODE === "true") return SANDBOX_CONFIG;
  if (process.env.STAGING_MODE === "true") return STAGING_CONFIG;
  return DEFAULT_CONFIG;
}

/**
 * Verilen mode için config döner.
 */
export function getSandboxConfig(mode: EnvironmentMode): SandboxConfig {
  switch (mode) {
    case "sandbox":
      return SANDBOX_CONFIG;
    case "staging":
      return STAGING_CONFIG;
    case "production":
      return DEFAULT_CONFIG;
  }
}

/**
 * Mod'a göre DB connection string'ine namespace ekler.
 * PostgreSQL schema-based veya SQLite test DB.
 */
export function getDbUrl(baseUrl: string, config: SandboxConfig): string {
  if (config.dbNamespace === "default") return baseUrl;
  // PostgreSQL: ?schema=sandbox query param'ı ile schema isolation
  if (baseUrl.startsWith("postgres")) {
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}schema=${config.dbNamespace}`;
  }
  return baseUrl;
}

/**
 * Verilen mod'da bir feature'ın enable olup olmadığını kontrol eder.
 */
export function isFeatureEnabled(
  feature: keyof SandboxConfig,
  config?: SandboxConfig
): boolean {
  const cfg = config ?? detectSandboxMode();
  // Sandbox'ta tüm feature'lar enable
  if (cfg.mode === "sandbox") return true;
  // Production'da default
  return Boolean(cfg[feature]);
}

/**
 * Mod'u log için kısa string.
 */
export function describeMode(config: SandboxConfig): string {
  const flags = [];
  if (config.useMockPayment) flags.push("mock-pay");
  if (config.mockExternalAPIs) flags.push("mock-api");
  if (!config.useRealPII) flags.push("no-pii");
  return `${config.mode}[${flags.join(",")}]`;
}