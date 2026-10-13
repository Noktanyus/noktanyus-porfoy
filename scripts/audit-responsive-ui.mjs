import { chromium } from 'playwright';

const ROUTES = [
  '/',
  '/docs',
  '/docs/hatalar',
  '/docs/rate-limits',
  '/docs/sdk',
  '/docs/webhooks',
  '/araclar',
  '/araclar/tckn-vkn-dogrulama',
  '/araclar/kdv-tevkifat-hesaplama',
  '/magaza',
  '/magaza/abonelikler',
  '/magaza/krediler',
  '/magaza/urunler',
  '/projelerim',
  '/blog',
  '/hakkimda',
  '/iletisim',
  '/durum',
  '/giris',
  '/kayit',
  '/marketplace'
];

const VIEWPORTS = [
  { name: 'mobile-small', width: 375, height: 667 },
  { name: 'mobile-large', width: 414, height: 896 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'desktop-wide', width: 1920, height: 1080 }
];

async function runAudit() {
  const browser = await chromium.launch({ headless: true });
  const issues = [];

  console.log(`🚀 Starting UI and Responsive Audit for https://noktanyus.com...`);
  console.log(`Checking ${ROUTES.length} routes across ${VIEWPORTS.length} viewports (Light & Dark modes)\n`);

  for (const vp of VIEWPORTS) {
    console.log(`\n======================================================`);
    console.log(`📱 Checking Viewport: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`======================================================`);

    for (const colorScheme of ['light', 'dark']) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: colorScheme,
        deviceScaleFactor: 1
      });

      const page = await context.newPage();

      for (const route of ROUTES) {
        const consoleErrors = [];
        page.on('console', msg => {
          if (msg.type() === 'error') consoleErrors.push(msg.text());
        });
        page.on('pageerror', err => {
          consoleErrors.push(err.message);
        });

        try {
          const url = `https://noktanyus.com${route}`;
          const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
          await page.waitForTimeout(1000);

          const status = res ? res.status() : 0;
          if (status >= 400) {
            issues.push({
              route,
              viewport: vp.name,
              colorScheme,
              type: 'HTTP_ERROR',
              message: `Status ${status}`
            });
            continue;
          }

          // Evaluate layout anomalies
          const pageEval = await page.evaluate(({ vpWidth }) => {
            const results = {
              hasHorizontalScroll: false,
              scrollWidth: document.documentElement.scrollWidth,
              clientWidth: document.documentElement.clientWidth,
              overflowingElements: [],
              brokenImages: []
            };

            const docWidth = window.innerWidth;
            if (document.documentElement.scrollWidth > docWidth + 2) {
              results.hasHorizontalScroll = true;

              // Find offending elements
              const all = document.querySelectorAll('*');
              for (const el of all) {
                const rect = el.getBoundingClientRect();
                // Check if element extends past right edge by more than 2px
                if (rect.right > docWidth + 3 && rect.width > 0 && rect.height > 0) {
                  const tag = el.tagName.toLowerCase();
                  const cls = (el.className && typeof el.className === 'string') ? el.className.split(' ').slice(0, 3).join('.') : '';
                  const id = el.id ? `#${el.id}` : '';
                  results.overflowingElements.push({
                    selector: `${tag}${id}${cls ? '.' + cls : ''}`,
                    right: Math.round(rect.right),
                    width: Math.round(rect.width),
                    excess: Math.round(rect.right - docWidth)
                  });
                  if (results.overflowingElements.length >= 5) break;
                }
              }
            }

            // Check broken images
            const imgs = document.querySelectorAll('img');
            for (const img of imgs) {
              if (img.complete && img.naturalWidth === 0 && img.src && !img.src.includes('data:')) {
                results.brokenImages.push(img.src);
              }
            }

            return results;
          }, { vpWidth: vp.width });

          if (pageEval.hasHorizontalScroll) {
            console.warn(`⚠️ [OVERFLOW] ${route} on ${vp.name} (${colorScheme}): scrollWidth=${pageEval.scrollWidth} vs clientWidth=${pageEval.clientWidth}`);
            issues.push({
              route,
              viewport: vp.name,
              colorScheme,
              type: 'HORIZONTAL_OVERFLOW',
              scrollWidth: pageEval.scrollWidth,
              clientWidth: pageEval.clientWidth,
              elements: pageEval.overflowingElements
            });
          }

          if (pageEval.brokenImages.length > 0) {
            issues.push({
              route,
              viewport: vp.name,
              colorScheme,
              type: 'BROKEN_IMAGES',
              images: pageEval.brokenImages
            });
          }

          const filteredConsoleErrors = consoleErrors.filter(err =>
            !err.includes('mc.yandex.ru') &&
            !err.includes('static.cloudflareinsights.com') &&
            !err.includes('google-analytics')
          );

          if (filteredConsoleErrors.length > 0) {
            issues.push({
              route,
              viewport: vp.name,
              colorScheme,
              type: 'CONSOLE_ERROR',
              errors: filteredConsoleErrors
            });
          }

        } catch (err) {
          issues.push({
            route,
            viewport: vp.name,
            colorScheme,
            type: 'LOAD_EXCEPTION',
            message: err.message
          });
        }
      }

      await context.close();
    }
  }

  await browser.close();

  console.log(`\n======================================================`);
  console.log(`📊 AUDIT COMPLETED. Total issues found: ${issues.length}`);
  console.log(`======================================================`);
  console.log(JSON.stringify(issues, null, 2));
}

runAudit().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
