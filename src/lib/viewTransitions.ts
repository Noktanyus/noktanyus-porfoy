/**
 * @file View Transitions API browser support detection & wrapper.
 * @description Progressive enhancement utility: View Transitions API
 *              browser desteğini (Chrome 111+, Edge 111+, Safari 18+, Firefox 144+)
 *              tespit eder ve desteklemeyen tarayıcılarda
 *              graceful fallback sağlar (anında tema değişimi).
 *
 *              Not: prefers-reduced-motion desteği CSS tarafında
 *              ayrıca handle edilir — bu dosya yalnızca API varlığını
 *              kontrol eder ve her zaman en hızlı yolu seçer.
 */

type ViewTransitionCallback = () => void | Promise<void>;

/**
 * `document.startViewTransition` tarayıcı desteğini kontrol eder.
 * @returns {boolean} Tarayıcı destekliyorsa true, aksi halde false.
 *                  SSR ortamında her zaman false döner.
 */
export function supportsViewTransitions(): boolean {
  if (typeof document === 'undefined') return false;
  if (typeof window === 'undefined') return false;

  const doc = document as Document & {
    startViewTransition?: (cb: ViewTransitionCallback) => unknown;
  };

  return (
    'startViewTransition' in doc &&
    typeof doc.startViewTransition === 'function'
  );
}

/**
 * Tarayıcı destekliyorsa `document.startViewTransition` callback'ini çalıştırır.
 * Desteklemiyorsa callback'i anında (senkron) çağırır ve resolve olan bir Promise döner.
 *
 * @param {ViewTransitionCallback} callback - Transition tetiklendiğinde çalışacak
 *                                          DOM güncelleme fonksiyonu (örn: setTheme).
 * @returns Promise — transition tamamlandığında resolve olur (veya fallback'te anında).
 */
export function startViewTransition(
  callback: ViewTransitionCallback
): Promise<void> {
  if (typeof document === 'undefined') {
    // SSR ortamı — callback'i çalıştırmadan sessizce geç
    void callback();
    return Promise.resolve();
  }

  if (!supportsViewTransitions()) {
    // Graceful fallback — tema değişimi anında uygulanır
    void callback();
    return Promise.resolve();
  }

  const doc = document as Document & {
    startViewTransition: (cb: ViewTransitionCallback) => { finished: Promise<void> };
  };

  return doc.startViewTransition(callback).finished;
}
