// Service Worker to block problematic extension scripts
self.addEventListener('fetch', function(event) {
  const url = event.request.url;
  
  // Block problematic scripts
  const blockedScripts = [
    'myContent.js',
    'pagehelper.js',
    'chrome-extension://',
    'moz-extension://',
    'safari-extension://'
  ];
  
  if (blockedScripts.some(script => url.includes(script))) {
    event.respondWith(
      new Response('// Blocked by service worker', {
        status: 200,
        headers: { 'Content-Type': 'application/javascript' }
      })
    );
    return;
  }
});

// Install event
self.addEventListener('install', function(event) {
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});