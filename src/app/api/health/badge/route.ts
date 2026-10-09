/**
 * GET /api/health/badge — SVG durum rozeti (README / status page gömme)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function svg(label: string, message: string, color: string) {
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const left = escape(label);
  const right = escape(message);
  const leftW = 62;
  const rightW = Math.max(54, 8 + right.length * 7);
  const total = leftW + rightW;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="20" role="img" aria-label="${left}: ${right}">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <mask id="m"><rect width="${total}" height="20" rx="3" fill="#fff"/></mask>
  <g mask="url(#m)">
    <rect width="${leftW}" height="20" fill="#555"/>
    <rect x="${leftW}" width="${rightW}" height="20" fill="${color}"/>
    <rect width="${total}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${leftW / 2}" y="14">${left}</text>
    <text x="${leftW + rightW / 2}" y="14">${right}</text>
  </g>
</svg>`;
}

export async function GET() {
  let healthy = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    healthy = true;
  } catch {
    healthy = false;
  }

  const body = healthy
    ? svg('noktanyus', 'operational', '#3fbf5a')
    : svg('noktanyus', 'degraded', '#e05d44');

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'no-cache, max-age=30',
    },
  });
}
