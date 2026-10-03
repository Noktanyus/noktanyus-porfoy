/**
 * Modern, yüksek kaliteli SVG tabanlı görsel ve placeholder üreticisi.
 * Projeler, ürünler, blog yazıları ve genel placeholder için ultra-premium
 * dark-mode / glassmorphism görseller üretir.
 */
import { mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const imagesRoot = join(root, 'public', 'images');

function ensureDir(p) {
  mkdirSync(p, { recursive: true });
}

function svgToBuffer(svg) {
  return Buffer.from(svg);
}

async function writeWebp(relativePath, svg, width, height) {
  const out = join(imagesRoot, relativePath);
  ensureDir(dirname(out));
  await sharp(svgToBuffer(svg))
    .resize(width, height)
    .webp({ quality: 90 })
    .toFile(out);
  console.log('Generated WebP:', relativePath);
}

/**
 * Genel yedek görsel (placeholder.webp)
 * Yeşil TEST görselini tamamen ortadan kaldıran modern soyut teknoloji tuvali.
 */
function modernPlaceholderSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="750" viewBox="0 0 1200 750">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16"/>
      <stop offset="45%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
    <radialGradient id="glow1" cx="30%" cy="30%" r="60%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="75%" cy="70%" r="55%">
      <stop offset="0%" stop-color="#6366f1" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.2" fill="rgba(255,255,255,0.08)"/>
    </pattern>
    <linearGradient id="cardGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.14)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.03)"/>
    </linearGradient>
    <linearGradient id="accentLine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="50%" stop-color="#818cf8"/>
      <stop offset="100%" stop-color="#c084fc"/>
    </linearGradient>
  </defs>

  <!-- Background base -->
  <rect width="1200" height="750" fill="url(#bg)"/>
  <rect width="1200" height="750" fill="url(#grid)"/>

  <!-- Radiant ambient lights -->
  <circle cx="360" cy="260" r="380" fill="url(#glow1)"/>
  <circle cx="900" cy="500" r="420" fill="url(#glow2)"/>

  <!-- Centered Glass Card Preview -->
  <g transform="translate(180, 110)">
    <!-- Glass Panel -->
    <rect width="840" height="530" rx="24" fill="url(#cardGlow)" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>
    <rect x="0" y="0" width="840" height="4" rx="2" fill="url(#accentLine)"/>

    <!-- Browser / App Header Dots -->
    <circle cx="40" cy="40" r="6" fill="#f43f5e"/>
    <circle cx="60" cy="40" r="6" fill="#fbbf24"/>
    <circle cx="80" cy="40" r="6" fill="#34d399"/>

    <rect x="115" y="28" width="220" height="24" rx="12" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.08)"/>
    <text x="140" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="rgba(255,255,255,0.45)" letter-spacing="1">noktanyus.com</text>

    <!-- Center Icon & Graphic: Abstract Code Nodes -->
    <g transform="translate(420, 230)">
      <!-- Outer Hexagon / Cube Lines -->
      <polygon points="0,-70 60,-35 60,35 0,70 -60,35 -60,-35" fill="none" stroke="rgba(56,189,248,0.3)" stroke-width="2"/>
      <polygon points="0,-50 43,-25 43,25 0,50 -43,25 -43,-25" fill="rgba(56,189,248,0.06)" stroke="rgba(129,140,248,0.4)" stroke-width="2"/>
      <!-- Core Brackets -->
      <text x="0" y="14" text-anchor="middle" font-family="monospace" font-size="34" font-weight="700" fill="#38bdf8">&lt;/&gt;</text>
      <!-- Accent Glow Spots -->
      <circle cx="-60" cy="-35" r="4" fill="#38bdf8"/>
      <circle cx="60" cy="-35" r="4" fill="#818cf8"/>
      <circle cx="0" cy="70" r="4" fill="#c084fc"/>
    </g>

    <!-- Content Labels -->
    <rect x="330" y="340" width="180" height="28" rx="14" fill="rgba(56,189,248,0.12)" stroke="rgba(56,189,248,0.3)"/>
    <text x="420" y="358" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#38bdf8" letter-spacing="1.5">DİJİTAL İÇERİK</text>

    <text x="420" y="415" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="700" fill="#ffffff" letter-spacing="-0.5">Noktanyus Portfolio</text>
    <text x="420" y="445" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="400" fill="rgba(255,255,255,0.6)">Yazılım Geliştirme · Modern Web Teknolojileri · API</text>
  </g>
</svg>`;
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Modern Proje Önizleme SVG'si
 */
function projectSvg(title, subtitle, accent1, accent2, techTags = []) {
  const safeTitle = esc(title);
  const safeSubtitle = esc(subtitle);
  const tags = techTags.length > 0 ? techTags.map(esc) : ['Next.js', 'TypeScript', 'Tailwind'];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0f19"/>
      <stop offset="60%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
    <radialGradient id="pGlow" cx="20%" cy="20%" r="70%">
      <stop offset="0%" stop-color="${accent1}" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="${accent1}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="pGlow2" cx="85%" cy="80%" r="60%">
      <stop offset="0%" stop-color="${accent2}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="${accent2}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.2" fill="rgba(255,255,255,0.06)"/>
    </pattern>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${accent1}"/>
      <stop offset="100%" stop-color="${accent2}"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1280" height="800" fill="url(#bg)"/>
  <rect width="1280" height="800" fill="url(#grid)"/>

  <!-- Ambient Light -->
  <circle cx="280" cy="240" r="450" fill="url(#pGlow)"/>
  <circle cx="1020" cy="580" r="480" fill="url(#pGlow2)"/>

  <!-- Glass Card Window -->
  <g transform="translate(140, 100)">
    <rect width="1000" height="600" rx="20" fill="rgba(15,23,42,0.8)" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>
    <rect x="0" y="0" width="1000" height="4" rx="2" fill="url(#headerGrad)"/>

    <!-- Window Chrome -->
    <circle cx="36" cy="36" r="6" fill="#f43f5e"/>
    <circle cx="56" cy="36" r="6" fill="#fbbf24"/>
    <circle cx="76" cy="36" r="6" fill="#34d399"/>

    <rect x="110" y="24" width="280" height="24" rx="12" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.08)"/>
    <text x="135" y="40" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="rgba(255,255,255,0.45)">https://proje.noktanyus.com</text>

    <!-- Project Badge -->
    <rect x="60" y="100" width="130" height="28" rx="14" fill="${accent1}22" stroke="${accent1}55"/>
    <text x="125" y="118" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="${accent1}" letter-spacing="1">PROJE</text>

    <!-- Main Title -->
    <text x="60" y="180" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="800" fill="#ffffff" letter-spacing="-1">${safeTitle}</text>
    <text x="60" y="220" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="400" fill="rgba(255,255,255,0.65)">${safeSubtitle}</text>

    <!-- Mock UI Code / Dashboard Lines -->
    <g transform="translate(60, 260)">
      <rect width="880" height="270" rx="14" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.06)"/>

      <!-- Mock Code lines -->
      <rect x="30" y="30" width="140" height="12" rx="6" fill="${accent1}" opacity="0.85"/>
      <rect x="185" y="30" width="180" height="12" rx="6" fill="rgba(255,255,255,0.2)"/>
      <rect x="50" y="58" width="220" height="10" rx="5" fill="rgba(255,255,255,0.4)"/>
      <rect x="285" y="58" width="120" height="10" rx="5" fill="${accent2}" opacity="0.8"/>

      <rect x="50" y="82" width="160" height="10" rx="5" fill="rgba(255,255,255,0.3)"/>
      <rect x="50" y="106" width="310" height="10" rx="5" fill="rgba(255,255,255,0.2)"/>

      <!-- Dashboard Cards Mockup inside -->
      <g transform="translate(480, 24)">
        <rect width="370" height="120" rx="10" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)"/>
        <text x="24" y="36" font-family="monospace" font-size="12" fill="${accent1}">● CANLI SİSTEM</text>
        <text x="24" y="72" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="800" fill="#ffffff">99.98%</text>
        <text x="24" y="98" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="rgba(255,255,255,0.5)">Uptime &amp; Performans</text>
      </g>

      <!-- Tech tags pills -->
      <g transform="translate(30, 210)">
        ${tags
          .map(
            (t, i) => `
          <g transform="translate(${i * 130}, 0)">
            <rect width="115" height="30" rx="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)"/>
            <text x="57" y="19" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="#ffffff">${t}</text>
          </g>
        `
          )
          .join('')}
      </g>
    </g>
  </g>
</svg>`;
}

/**
 * Modern Dijital Ürün SVG'si
 */
function productSvg(title, category, accent1, accent2) {
  const safeTitle = esc(title);
  const safeCategory = esc(category);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0e17"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#141829"/>
    </linearGradient>
    <radialGradient id="prodGlow" cx="30%" cy="30%" r="65%">
      <stop offset="0%" stop-color="${accent1}" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="${accent1}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="prodGlow2" cx="80%" cy="70%" r="60%">
      <stop offset="0%" stop-color="${accent2}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="${accent2}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.06)"/>
    </pattern>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.1)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.02)"/>
    </linearGradient>
    <linearGradient id="accentBar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${accent1}"/>
      <stop offset="100%" stop-color="${accent2}"/>
    </linearGradient>
  </defs>

  <rect width="1280" height="720" fill="url(#bg)"/>
  <rect width="1280" height="720" fill="url(#grid)"/>

  <circle cx="340" cy="220" r="420" fill="url(#prodGlow)"/>
  <circle cx="980" cy="500" r="440" fill="url(#prodGlow2)"/>

  <!-- Isometric Card Feature -->
  <g transform="translate(120, 90)">
    <rect width="1040" height="540" rx="24" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>
    <rect x="0" y="0" width="1040" height="4" rx="2" fill="url(#accentBar)"/>

    <!-- Product Category Pill -->
    <rect x="60" y="60" width="160" height="30" rx="15" fill="${accent1}22" stroke="${accent1}55"/>
    <text x="140" y="80" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="${accent1}" letter-spacing="1.5">${safeCategory}</text>

    <!-- Product Title -->
    <text x="60" y="150" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="46" font-weight="800" fill="#ffffff" letter-spacing="-1">${safeTitle}</text>
    <text x="60" y="195" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="400" fill="rgba(255,255,255,0.65)">Noktanyus Store · Profesyonel Dijital Yazılım Çözümü</text>

    <!-- Right Side 3D Tech Graphic -->
    <g transform="translate(680, 160)">
      <rect width="280" height="280" rx="20" fill="rgba(15,23,42,0.85)" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>
      <!-- Glowing inner circle -->
      <circle cx="140" cy="140" r="90" fill="${accent1}15" stroke="${accent1}44" stroke-width="2"/>
      <circle cx="140" cy="140" r="60" fill="${accent2}20" stroke="${accent2}66" stroke-width="2"/>
      <!-- Icon symbol inside -->
      <text x="140" y="152" text-anchor="middle" font-family="monospace" font-size="44" font-weight="700" fill="#ffffff">&lt;/&gt;</text>
      <!-- Mini tags inside graphic -->
      <rect x="30" y="24" width="70" height="18" rx="9" fill="${accent1}33"/>
      <text x="65" y="37" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="700" fill="${accent1}">PRO</text>
    </g>

    <!-- Left Side Highlights -->
    <g transform="translate(60, 250)">
      <g transform="translate(0, 0)">
        <circle cx="12" cy="12" r="10" fill="${accent1}33" stroke="${accent1}"/>
        <text x="12" y="16" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="bold" fill="#ffffff">✓</text>
        <text x="36" y="16" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="500" fill="#ffffff">Temiz Mimari &amp; Modüler Kod Tabanı</text>
      </g>
      <g transform="translate(0, 48)">
        <circle cx="12" cy="12" r="10" fill="${accent1}33" stroke="${accent1}"/>
        <text x="12" y="16" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="bold" fill="#ffffff">✓</text>
        <text x="36" y="16" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="500" fill="#ffffff">Tam TypeScript &amp; Zod Tip Güvenliği</text>
      </g>
      <g transform="translate(0, 96)">
        <circle cx="12" cy="12" r="10" fill="${accent1}33" stroke="${accent1}"/>
        <text x="12" y="16" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="bold" fill="#ffffff">✓</text>
        <text x="36" y="16" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="500" fill="#ffffff">Anında İndirme &amp; Kurulum Desteği</text>
      </g>
    </g>
  </g>
</svg>`;
}

/**
 * Modern Blog Kapak SVG'si
 */
function blogSvg(title, category, readTime, accent1, accent2) {
  const safeTitle = esc(title);
  const safeCategory = esc(category);
  const safeReadTime = esc(readTime);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0d17"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#191730"/>
    </linearGradient>
    <radialGradient id="bGlow" cx="25%" cy="25%" r="65%">
      <stop offset="0%" stop-color="${accent1}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${accent1}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="bGlow2" cx="80%" cy="75%" r="60%">
      <stop offset="0%" stop-color="${accent2}" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="${accent2}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.2" fill="rgba(255,255,255,0.06)"/>
    </pattern>
    <linearGradient id="accentLine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${accent1}"/>
      <stop offset="100%" stop-color="${accent2}"/>
    </linearGradient>
  </defs>

  <rect width="1280" height="720" fill="url(#bg)"/>
  <rect width="1280" height="720" fill="url(#grid)"/>

  <circle cx="300" cy="220" r="440" fill="url(#bGlow)"/>
  <circle cx="1020" cy="540" r="460" fill="url(#bGlow2)"/>

  <g transform="translate(140, 90)">
    <rect width="1000" height="540" rx="24" fill="rgba(15,23,42,0.8)" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>
    <rect x="0" y="0" width="1000" height="4" rx="2" fill="url(#accentLine)"/>

    <!-- Category Pill -->
    <rect x="60" y="60" width="180" height="32" rx="16" fill="${accent1}22" stroke="${accent1}55"/>
    <text x="150" y="81" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="${accent1}" letter-spacing="1.5">${safeCategory}</text>

    <!-- Reading time pill -->
    <rect x="255" y="60" width="120" height="32" rx="16" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)"/>
    <text x="315" y="81" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="500" fill="rgba(255,255,255,0.7)">⏱ ${readTime} okuma</text>

    <!-- Blog Title -->
    <text x="60" y="170" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="42" font-weight="800" fill="#ffffff" letter-spacing="-1">
      ${safeTitle}
    </text>

    <text x="60" y="220" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="17" font-weight="400" fill="rgba(255,255,255,0.65)">
      Teknoloji, mimari ve yazılım geliştirme deneyimleri üzerine derinlemesine analiz.
    </text>

    <!-- Visual Code / Editorial Card Mockup -->
    <g transform="translate(60, 270)">
      <rect width="880" height="200" rx="16" fill="rgba(0,0,0,0.3)" stroke="rgba(255,255,255,0.08)"/>

      <circle cx="32" cy="28" r="5" fill="#f43f5e"/>
      <circle cx="48" cy="28" r="5" fill="#fbbf24"/>
      <circle cx="64" cy="28" r="5" fill="#34d399"/>

      <rect x="32" y="56" width="160" height="12" rx="6" fill="${accent1}" opacity="0.8"/>
      <rect x="202" y="56" width="240" height="12" rx="6" fill="rgba(255,255,255,0.25)"/>
      <rect x="52" y="82" width="280" height="10" rx="5" fill="rgba(255,255,255,0.4)"/>
      <rect x="342" y="82" width="120" height="10" rx="5" fill="${accent2}" opacity="0.85"/>
      <rect x="52" y="106" width="210" height="10" rx="5" fill="rgba(255,255,255,0.2)"/>
      <rect x="52" y="130" width="360" height="10" rx="5" fill="rgba(255,255,255,0.15)"/>

      <g transform="translate(650, 40)">
        <rect width="190" height="110" rx="12" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)"/>
        <text x="95" y="45" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="${accent1}">YAZAR</text>
        <text x="95" y="75" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700" fill="#ffffff">Yunus Tuğhan</text>
        <text x="95" y="95" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="rgba(255,255,255,0.5)">Full-Stack Dev</text>
      </g>
    </g>
  </g>
</svg>`;
}

async function main() {
  ensureDir(imagesRoot);
  ensureDir(join(imagesRoot, 'products'));
  ensureDir(join(imagesRoot, 'projects'));
  ensureDir(join(imagesRoot, 'blogs'));

  // 1. placeholder.webp (Eski yeşil TEST görselini ezerek modern bir placeholder yapar)
  console.log('Generating modern placeholder.webp...');
  await writeWebp('placeholder.webp', modernPlaceholderSvg(), 1200, 750);

  // 2. Projeler
  const projects = [
    {
      file: 'estm.webp',
      title: 'eSAS Spor Tesisleri',
      subtitle: 'Akıllı Saha & Tesis Rezervasyon Yönetim Platformu',
      accent1: '#0284c7',
      accent2: '#06b6d4',
      tags: ['Next.js 14', 'PostgreSQL', 'Tailwind', 'Docker'],
    },
    {
      file: 'esas.webp',
      title: 'eSAS Spor Tesisleri',
      subtitle: 'Akıllı Saha & Tesis Rezervasyon Yönetim Platformu',
      accent1: '#0284c7',
      accent2: '#06b6d4',
      tags: ['Next.js 14', 'PostgreSQL', 'Tailwind', 'Docker'],
    },
    {
      file: 'portal.webp',
      title: 'Üniversite Portalı',
      subtitle: 'Akdeniz Üniversitesi Öğrenci & Akademisyen Portalı',
      accent1: '#059669',
      accent2: '#10b981',
      tags: ['Next.js', 'Prisma', 'NextAuth', 'Redis'],
    },
    {
      file: 'portfolio.webp',
      title: 'Noktanyus Portfolio',
      subtitle: 'Modern Kişisel Portfolyo, Mağaza & API Hizmetleri',
      accent1: '#6366f1',
      accent2: '#8b5cf6',
      tags: ['Next.js 14', 'Tailwind CSS', 'Prisma', 'PayTR'],
    },
    {
      file: 'mobile.webp',
      title: 'Mobil Rezervasyon Uygulaması',
      subtitle: 'React Native & Expo Destekli Mobil Rezervasyon',
      accent1: '#e11d48',
      accent2: '#f43f5e',
      tags: ['React Native', 'Expo', 'TypeScript', 'Tailwind'],
    },
  ];

  for (const p of projects) {
    await writeWebp(
      `projects/${p.file}`,
      projectSvg(p.title, p.subtitle, p.accent1, p.accent2, p.tags),
      1280,
      800
    );
  }

  // 3. Ürünler
  const products = [
    ['saas-starter.webp', 'SaaS Starter Kit', 'FULL STACK TEMPLATE', '#2563eb', '#38bdf8'],
    ['portfolio-template.webp', 'Portfolio Template', 'WEB APPLICATION', '#7c3aed', '#c084fc'],
    ['ui-library.webp', 'UI Component Library', 'DESIGN SYSTEM', '#0d9488', '#2dd4bf'],
    ['api-boilerplate.webp', 'API Boilerplate', 'BACKEND ARCHITECTURE', '#d97706', '#fbbf24'],
    ['tr-sdk.webp', 'TR Yardımcı API SDK', 'DEVELOPER SDK', '#0284c7', '#38bdf8'],
    ['paytr-starter.webp', 'PayTR Starter Kit', 'PAYMENT INTEGRATION', '#059669', '#34d399'],
  ];

  for (const [file, title, cat, acc1, acc2] of products) {
    await writeWebp(
      `products/${file}`,
      productSvg(title, cat, acc1, acc2),
      1280,
      720
    );
  }

  // 4. Blog Yazıları için yüksek kaliteli görseller
  const blogs = [
    {
      file: 'estm-dijital-donusum.webp',
      title: 'ESTM İle Dijital Dönüşüm',
      category: 'VAKA ANALİZİ',
      readTime: '5 dk',
      accent1: '#0284c7',
      accent2: '#38bdf8',
    },
    {
      file: 'glassmorphism-2026.webp',
      title: 'Glassmorphism: 2026 UI Trendleri',
      category: 'TASARIM & UI',
      readTime: '6 dk',
      accent1: '#8b5cf6',
      accent2: '#d946ef',
    },
    {
      file: 'nextjs-14-app-router.webp',
      title: 'Next.js 14 App Router Derinlemesine',
      category: 'FRAMEWORK & REACT',
      readTime: '8 dk',
      accent1: '#0ea5e9',
      accent2: '#6366f1',
    },
    {
      file: 'prisma-vs-drizzle.webp',
      title: 'Prisma vs Drizzle: Hangisi Tercih Edilmeli?',
      category: 'VERİTABANI & ORM',
      readTime: '7 dk',
      accent1: '#10b981',
      accent2: '#3b82f6',
    },
    {
      file: 'docker-gelistirme-ortami.webp',
      title: 'Docker ile Geliştirme Ortamı',
      category: 'DEVOPS & CONTAINER',
      readTime: '6 dk',
      accent1: '#0284c7',
      accent2: '#60a5fa',
    },
    {
      file: 'zod-runtime-safety.webp',
      title: 'Zod ile Runtime Type Safety',
      category: 'TYPESCRIPT & DOĞRULAMA',
      readTime: '4 dk',
      accent1: '#3b82f6',
      accent2: '#a855f7',
    },
    {
      file: 'stripe-eticaret.webp',
      title: 'Stripe ile E-Ticaret Entegrasyonu',
      category: 'ÖDEME SİSTEMLERİ',
      readTime: '7 dk',
      accent1: '#6366f1',
      accent2: '#10b981',
    },
    {
      file: 'tailwind-v4-gecis.webp',
      title: 'Tailwind CSS v4: Geçiş Rehberi',
      category: 'CSS & STİL',
      readTime: '5 dk',
      accent1: '#06b6d4',
      accent2: '#3b82f6',
    },
  ];

  for (const b of blogs) {
    await writeWebp(
      `blogs/${b.file}`,
      blogSvg(b.title, b.category, b.readTime, b.accent1, b.accent2),
      1280,
      720
    );
  }

  console.log('All high-quality placeholder and preview images generated successfully!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
