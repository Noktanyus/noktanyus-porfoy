/**
 * @file vercel — Vercel REST API entegrasyonu (deployments + project).
 * @description
 *   Vercel API v13 uzerinden deployment olusturma, polling ve temizleme
 *   islemleri. Sadece token + teamId + projectId mevcutsa "configured" sayilir;
 *   aksi durumda tum fonksiyonlar deterministic error firlatir (mock mode YOK).
 *
 *   Kullanim alani: Phase 3 B.6 — Demo deployment automation. Kullanici
 *   bir template satin aldiginda Vercel'e onizleme deployment acilir.
 *
 *   Guvenlik:
 *   - VERCEL_TOKEN Authorization header'da Bearer olarak tasinir.
 *   - Token loglanmaz (sadece length).
 *   - HTTPS zorunlu (Vercel API redirect yapsa bile).
 */

import { logger } from './logger';

const VERCEL_API_BASE = 'https://api.vercel.com';

export interface VercelEnv {
  /** Ortam degiskenleri — deployment sirasinda set edilir. */
  key: string;
  value: string;
  /** Production/Preview/PDevelopment — Vercel target tipi. */
  target?: ('production' | 'preview' | 'development')[];
}

export interface DeployVercelProjectArgs {
  /** GitHub repo URL — Vercel bu URL'i clone edip build eder. */
  repoUrl: string;
  /** Deployment adi (Vercel project adi veya alias onayi). */
  name: string;
  /** Subdomain (opsiyonel) — vercel.app subdomain atamasi icin. */
  subdomain?: string;
  /** Build sirasinda inject edilecek env degiskenleri. */
  env?: VercelEnv[];
  /** Branch (default: main). */
  ref?: string;
  /** Build command override (bos birakilirsa Vercel repo'dan okur). */
  buildCommand?: string;
  /** Output directory override. */
  outputDirectory?: string;
}

export interface VercelDeploymentResult {
  id: string;
  url: string;
  state: 'QUEUED' | 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';
  inspectorUrl?: string;
}

export interface VercelDeploymentStatus {
  id: string;
  url: string;
  state: VercelDeploymentResult['state'];
  ready: boolean;
  errorMessage?: string;
}

interface VercelApiError {
  error: { code: string; message: string };
}

function buildHeaders(): HeadersInit {
  const token = process.env.VERCEL_TOKEN?.trim();
  if (!token) throw new Error('VERCEL_TOKEN tanimli degil');
  const teamId = process.env.VERCEL_TEAM_ID?.trim();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(teamId ? { 'Vercel-Team-Id': teamId } : {}),
  };
}

/**
 * Vercel entegrasyonu icin gerekli env'lerin tamam tanimli mi?
 */
export function isVercelConfigured(): boolean {
  return Boolean(
    process.env.VERCEL_TOKEN?.trim() &&
      process.env.VERCEL_TEAM_ID?.trim() &&
      process.env.VERCEL_PROJECT_ID?.trim()
  );
}

/**
 * Vercel API cagrisi sarmalayicisi. JSON response + hata kontrolu.
 */
async function vercelFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const url = `${VERCEL_API_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...buildHeaders(),
      ...(init.headers ?? {}),
    },
  });

  const contentType = res.headers.get('content-type') ?? '';
  const payload: unknown = contentType.includes('application/json')
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  if (!res.ok) {
    const err = payload as VercelApiError | null;
    const message = err?.error?.message ?? `Vercel API hatasi (${res.status})`;
    logger.error('[vercel] API hatasi', {
      url,
      status: res.status,
      code: err?.error?.code,
    });
    throw new Error(`Vercel: ${message}`);
  }

  return payload as T;
}

/**
 * Yeni deployment olusturur (POST /v13/deployments). Vercel github repo'yu
 * build eder, ~30s icinde READY durumuna gecer.
 *
 *   - `repoUrl` zorunlu (ornek: "https://github.com/noktanyus/noktanyus-porfoy").
 *   - `name` Vercel project adi; mevcut projeyle eslesmezse 400 doner.
 *   - `subdomain` vercel.app subdomain'i (ornek: "acme-blog"); Vercel bu
 *     degeri alias olarak ekler.
 *
 * Vercel response shape (ilgili alanlar):
 *   { id: string, url: string, readyState: 'QUEUED'|'BUILDING'|'READY'|'ERROR', inspectorUrl?: string }
 */
export async function deployVercelProject(
  args: DeployVercelProjectArgs
): Promise<VercelDeploymentResult> {
  if (!isVercelConfigured()) {
    throw new Error(
      'Vercel konfigure edilmemis — VERCEL_TOKEN, VERCEL_TEAM_ID, VERCEL_PROJECT_ID zorunlu'
    );
  }
  if (!args.repoUrl || !args.name) {
    throw new Error('repoUrl ve name zorunlu');
  }

  const body: Record<string, unknown> = {
    name: args.name,
    target: 'preview',
    gitSource: {
      type: 'github',
      repoUrl: args.repoUrl,
      ref: args.ref ?? 'main',
    },
    projectSettings: {
      ...(args.buildCommand ? { buildCommand: args.buildCommand } : {}),
      ...(args.outputDirectory ? { outputDirectory: args.outputDirectory } : {}),
    },
    ...(args.env && args.env.length > 0 ? { env: args.env } : {}),
    ...(args.subdomain ? { alias: [`${args.subdomain}.vercel.app`] } : {}),
  };

  const data = await vercelFetch<{
    id: string;
    url: string;
    readyState?: VercelDeploymentResult['state'];
    inspectorUrl?: string;
  }>('/v13/deployments', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return {
    id: data.id,
    url: data.url,
    state: data.readyState ?? 'QUEUED',
    inspectorUrl: data.inspectorUrl,
  };
}

/**
 * Deployment durumunu sorgula (GET /v13/deployments/:id). Polling icin.
 */
export async function pollDeploymentStatus(
  deploymentId: string
): Promise<VercelDeploymentStatus> {
  if (!deploymentId) throw new Error('deploymentId zorunlu');

  const data = await vercelFetch<{
    id: string;
    url: string;
    readyState?: VercelDeploymentResult['state'];
    errorMessage?: string;
  }>(`/v13/deployments/${encodeURIComponent(deploymentId)}`);

  const state = data.readyState ?? 'QUEUED';
  return {
    id: data.id,
    url: data.url,
    state,
    ready: state === 'READY',
    errorMessage: data.errorMessage,
  };
}

/**
 * Bir deployment'i iptal eder veya siler (DELETE /v13/deployments/:id).
 * `deploymentUrl` verildiyse once alias kaldirilmaya calisilir; yoksa
 * direkt deployment silinir. Hata durumunda log + swallow (best-effort).
 */
export async function destroyDemoDeployment(args: {
  deploymentId: string;
  deploymentUrl?: string;
}): Promise<{ removed: boolean; reason?: string }> {
  if (!args.deploymentId) {
    return { removed: false, reason: 'deploymentId bos' };
  }
  try {
    await vercelFetch<void>(
      `/v13/deployments/${encodeURIComponent(args.deploymentId)}`,
      { method: 'DELETE' }
    );
    return { removed: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn('[vercel] deployment destroy basarisiz', {
      deploymentId: args.deploymentId,
      error: message,
    });
    return { removed: false, reason: message };
  }
}

/** Vercel API v13 — schema exportlari test icin. */
export const __testables = {
  buildHeaders,
  vercelFetch,
};
