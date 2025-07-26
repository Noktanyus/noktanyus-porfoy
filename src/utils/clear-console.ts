// Development sırasında console'u temizlemek için utility

export function clearConsoleErrors() {
  if (typeof window === 'undefined') return;
  
  // Console'u temizle
  console.clear();
  
  // Periyodik olarak sandbox hatalarını temizle
  const clearInterval = setInterval(() => {
    // Console'da sandbox hataları varsa temizle
    if (console.clear) {
      const messages = document.querySelectorAll('.console-message');
      messages.forEach(msg => {
        const text = msg.textContent || '';
        if (
          text.includes('sandboxed') || 
          text.includes('about:blank') || 
          text.includes('Blocked script execution')
        ) {
          msg.remove();
        }
      });
    }
  }, 1000);

  // 30 saniye sonra temizlemeyi durdur
  setTimeout(() => {
    clearInterval(clearInterval);
  }, 30000);
}

// Sayfa yüklendiğinde otomatik temizle
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(clearConsoleErrors, 2000);
  });
}