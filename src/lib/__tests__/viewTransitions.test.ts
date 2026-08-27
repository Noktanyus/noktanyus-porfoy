/**
 * @file viewTransitions unit tests
 * @description `supportsViewTransitions` detection ve `startViewTransition`
 *              graceful fallback mantığının testleri.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('View Transitions', () => {
  beforeEach(() => {
    // Her test öncesi document.startViewTransition mock'unu temizle
    // @ts-expect-error — test amaçlı silme
    delete (document as any).startViewTransition;
  });

  it('detects support correctly when API is missing', async () => {
    const { supportsViewTransitions } = await import('../viewTransitions');
    expect(supportsViewTransitions()).toBe(false);
  });

  it('detects support when API exists', async () => {
    // startViewTransition API'sini mock'la
    (document as any).startViewTransition = vi.fn(
      (cb: () => void) => {
        cb();
        return { finished: Promise.resolve() };
      }
    );

    const { supportsViewTransitions } = await import('../viewTransitions');
    expect(supportsViewTransitions()).toBe(true);
  });

  it('falls back to instant callback when not supported', async () => {
    const { startViewTransition } = await import('../viewTransitions');
    const cb = vi.fn();

    await startViewTransition(cb);

    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('uses document.startViewTransition when supported', async () => {
    const mockTransition = vi.fn((cb: () => void) => {
      cb();
      return { finished: Promise.resolve() };
    });
    (document as any).startViewTransition = mockTransition;

    const { startViewTransition } = await import('../viewTransitions');
    const cb = vi.fn();

    await startViewTransition(cb);

    expect(mockTransition).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('awaits finished promise when API is supported', async () => {
    let resolveFinished!: () => void;
    const finishedPromise = new Promise<void>((resolve) => {
      resolveFinished = resolve;
    });

    (document as any).startViewTransition = vi.fn((cb: () => void) => {
      cb();
      return { finished: finishedPromise };
    });

    const { startViewTransition } = await import('../viewTransitions');
    const cb = vi.fn();

    let resolved = false;
    const promise = startViewTransition(cb).then(() => {
      resolved = true;
    });

    // Callback anında çalıştı ama finished henüz resolve olmadı
    expect(cb).toHaveBeenCalled();
    expect(resolved).toBe(false);

    resolveFinished();
    await promise;
    expect(resolved).toBe(true);
  });
});
