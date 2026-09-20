/**
 * Eksik profil / ürün / proje görselleri için SVG tabanlı placeholder üretir.
 * Seed'deki yollarla uyumlu: /images/profile.webp, /images/products/*, /images/projects/*
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const imagesRoot = join(root, 'public', 'images');

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function svgToBuffer(svg) {
  return Buffer.from(svg);
}

async function writeWebp(relativePath, svg, width, height) {
  const out = join(imagesRoot, relativePath);
  ensureDir(dirname(out));
  await sharp(svgToBuffer(svg)).resize(width, height).webp({ quality: 85 }).toFile(out);
  console.log('wrote', relativePath);
}

function profileSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="55%" stop-color="#1d4ed8"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#g)"/>
  <circle cx="400" cy="400" r="280" fill="rgba(255,255,255,0.08)"/>
  <text x="400" y="445" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="210" font-weight="700" fill="#ffffff" letter-spacing="8">YT</text>
</svg>`;
}

function productSvg(title, accent) {
  const safe = title.replace(/[<>&]/g, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="${accent}"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <circle cx="1040" cy="120" r="180" fill="rgba(255,255,255,0.06)"/>
  <circle cx="180" cy="560" r="220" fill="rgba(255,255,255,0.05)"/>
  <rect x="80" y="80" width="160" height="10" rx="5" fill="rgba(255,255,255,0.35)"/>
  <text x="80" y="360" font-family="Segoe UI, Arial, sans-serif" font-size="54" font-weight="700" fill="#ffffff">${safe}</text>
  <text x="80" y="420" font-family="Segoe UI, Arial, sans-serif" font-size="24" fill="rgba(255,255,255,0.65)">Noktanyus · Dijital Ürün</text>
</svg>`;
}

function projectSvg(title, accent) {
  const safe = title.replace(/[<>&]/g, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="bg" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#111827"/>
      <stop offset="100%" stop-color="${accent}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#bg)"/>
  <rect x="60" y="60" width="1080" height="680" rx="24" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)"/>
  <text x="100" y="420" font-family="Segoe UI, Arial, sans-serif" font-size="48" font-weight="700" fill="#ffffff">${safe}</text>
</svg>`;
}

async function main() {
  ensureDir(imagesRoot);
  ensureDir(join(imagesRoot, 'products'));
  ensureDir(join(imagesRoot, 'projects'));

  // Her zaman profili düzgün avatar ile yenile (TEST görselini değiştir)
  await writeWebp('profile.webp', profileSvg(), 800, 800);
  // kök public/profile.webp de varsa senkron
  await sharp(svgToBuffer(profileSvg())).resize(800, 800).webp({ quality: 85 }).toFile(join(root, 'public', 'profile.webp'));

  const products = [
    ['saas-starter.webp', 'SaaS Starter Kit', '#1d4ed8'],
    ['portfolio-template.webp', 'Portfolio Template', '#7c3aed'],
    ['ui-library.webp', 'UI Component Library', '#0f766e'],
    ['api-boilerplate.webp', 'API Boilerplate', '#b45309'],
    ['tr-sdk.webp', 'TR Yardımcı API SDK', '#0284c7'],
    ['paytr-starter.webp', 'PayTR Starter Kit', '#059669'],
  ];
  for (const [file, title, accent] of products) {
    await writeWebp(`products/${file}`, productSvg(title, accent), 1280, 720);
  }

  const projects = [
    ['esas.webp', 'eSAS Spor Tesisleri', '#0369a1'],
    ['estm.webp', 'eSAS Spor Tesisleri', '#0369a1'],
    ['portfolio.webp', 'Noktanyus Portfolio', '#4338ca'],
    ['portal.webp', 'Üniversite Portal', '#047857'],
    ['mobile.webp', 'Mobil Uygulama', '#be123c'],
  ];
  for (const [file, title, accent] of projects) {
    await writeWebp(`projects/${file}`, projectSvg(title, accent), 1200, 800);
  }

  // Genel placeholder
  if (!existsSync(join(imagesRoot, 'placeholder.webp'))) {
    await writeWebp(
      'placeholder.webp',
      productSvg('Placeholder', '#334155'),
      800,
      600
    );
  }

  console.log('done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
