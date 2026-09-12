import { APIRequestContext, expect } from "@playwright/test";

/**
 * API response envelope types — prisma/apiResponse ile uyumlu.
 */
export type ApiSuccess<T> = { success: true; data: T; meta?: { total?: number; page?: number; limit?: number } };
export type ApiError = { success: false; error: { code: string; message: string; details?: unknown } };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/**
 * API çağrıları için yardımcı fonksiyon. Auth context otomatik olarak
 * session cookie'lerini ekler.
 */
export class ApiClient {
  constructor(private ctx: APIRequestContext) {}

  async get<T = unknown>(path: string): Promise<ApiResponse<T>> {
    const res = await this.ctx.get(path);
    return res.json() as Promise<ApiResponse<T>>;
  }

  async post<T = unknown>(path: string, data?: unknown): Promise<ApiResponse<T>> {
    const res = await this.ctx.post(path, {
      data,
      headers: { "content-type": "application/json" },
    });
    return res.json() as Promise<ApiResponse<T>>;
  }

  async patch<T = unknown>(path: string, data?: unknown): Promise<ApiResponse<T>> {
    const res = await this.ctx.patch(path, {
      data,
      headers: { "content-type": "application/json" },
    });
    return res.json() as Promise<ApiResponse<T>>;
  }

  async delete<T = unknown>(path: string): Promise<ApiResponse<T> | null> {
    const res = await this.ctx.delete(path);
    if (res.status() === 204 || res.status() === 200) {
      // 204 No Content veya 200 with empty body: success kabul et
      const text = await res.text();
      if (!text || text.trim() === "") {
        return { success: true, data: undefined as T };
      }
      try {
        return JSON.parse(text) as ApiResponse<T>;
      } catch {
        return { success: true, data: undefined as T };
      }
    }
    try {
      return (await res.json()) as ApiResponse<T>;
    } catch {
      return { success: false, error: { code: "PARSE_ERROR", message: `Invalid JSON (${res.status()})` } };
    }
  }

  async postRaw(path: string, data?: unknown, contentType = "application/json") {
    return this.ctx.post(path, {
      data,
      headers: { "content-type": contentType },
    });
  }
}

/**
 * Status code assertion helper.
 */
export function expectOk<T>(response: ApiResponse<T>, expectedCode?: string) {
  if (!response.success) {
    throw new Error(
      `Expected success, got error: ${JSON.stringify(response.error)}`
    );
  }
  return response.data;
}

export function expectFail(
  response: ApiResponse<unknown>,
  expectedCode: string
) {
  if (response.success) {
    throw new Error(
      `Expected error code "${expectedCode}", got success: ${JSON.stringify(response.data)}`
    );
  }
  if (response.error.code !== expectedCode) {
    throw new Error(
      `Expected error code "${expectedCode}", got "${response.error.code}"`
    );
  }
  return response.error;
}

export { expect };
export { test } from "@playwright/test";
