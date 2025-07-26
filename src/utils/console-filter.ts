// Console hatalarını filtrelemek için utility
export function filterConsoleErrors() {
  if (typeof window === 'undefined') return;

  // Orijinal console fonksiyonlarını sakla
  const originalError = console.error;
  const originalWarn = console.warn;

  // Console.error'u override et
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    
    // Filtrelenecek hata mesajları
    const filteredMessages = [
      'sandboxed',
      'allow-scripts',
      'about:blank',
      'Blocked script execution',
      'document\'s frame is sandboxed',
      'Permissions-Policy header',
      'Unrecognized feature',
      'browsing-topics',
      'interest-cohort',
      'challenges.cloudflare.com'
    ];
    
    // Eğer mesaj filtrelenecek bir hata içeriyorsa gösterme
    if (filteredMessages.some(filter => message.includes(filter))) {
      return;
    }

    // Diğer hataları normal şekilde göster
    originalError.apply(console, args);
  };

  // Console.warn'ı da filtrele
  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    
    // Filtrelenecek uyarı mesajları
    const filteredWarnings = [
      'preloaded using link preload but not used',
      'preload but not used',
      'Permissions-Policy',
      'browsing-topics',
      'interest-cohort',
      'inter-var.woff2',
      'fonts/inter-var.woff2'
    ];
    
    // Eğer mesaj filtrelenecek bir uyarı içeriyorsa gösterme
    if (filteredWarnings.some(filter => message.includes(filter))) {
      return;
    }

    // Diğer uyarıları normal şekilde göster
    originalWarn.apply(console, args);
  };
}

// Component mount olduğunda çağır
export function initConsoleFilter() {
  if (typeof window !== 'undefined') {
    // Development'ta da filtrele, sadece localStorage'da 'false' varsa filtreleme
    const shouldFilter = localStorage.getItem('filterConsole') !== 'false';
    
    if (shouldFilter) {
      filterConsoleErrors();
    }
  }
}

// Manuel olarak console filtresini açıp kapatmak için
export function toggleConsoleFilter(enable: boolean) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('filterConsole', enable.toString());
    if (enable) {
      filterConsoleErrors();
    } else {
      // Sayfayı yenile ki orijinal console fonksiyonları geri gelsin
      window.location.reload();
    }
  }
}