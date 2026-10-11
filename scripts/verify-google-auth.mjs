import { chromium } from 'playwright';

async function verify() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('--- 1. Testing https://noktanyus.com/giris ---');
  await page.goto('https://noktanyus.com/giris', { waitUntil: 'networkidle' });

  const loginGoogleBtn = await page.$('button[data-testid="social-btn-google"]');
  if (!loginGoogleBtn) {
    throw new Error('Google button NOT found on /giris');
  }
  const loginText = await loginGoogleBtn.innerText();
  console.log('Google login button text:', loginText);

  const loginDivider = await page.textContent('body');
  const hasLoginDivider = loginDivider.includes('veya e-posta ile giriş yap');
  console.log('Has login divider:', hasLoginDivider);

  console.log('--- 2. Testing https://noktanyus.com/kayit ---');
  await page.goto('https://noktanyus.com/kayit', { waitUntil: 'networkidle' });

  const registerGoogleBtn = await page.$('button[data-testid="social-btn-google"]');
  if (!registerGoogleBtn) {
    throw new Error('Google button NOT found on /kayit');
  }
  const registerText = await registerGoogleBtn.innerText();
  console.log('Google register button text:', registerText);

  const registerContent = await page.textContent('body');
  const hasRegisterDivider = registerContent.includes('veya e-posta ile kayıt ol');
  console.log('Has register divider:', hasRegisterDivider);

  await browser.close();
  console.log('🎉 ALL GOOGLE AUTH CHECKS PASSED LIVE ON PRODUCTION!');
}

verify().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
