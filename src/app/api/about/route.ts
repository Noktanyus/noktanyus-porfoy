import { NextResponse } from 'next/server';
import { getAbout } from '@/services/contentService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
};

export async function GET() {
  try {
    const aboutData = await getAbout();
    
    if (!aboutData) {
      return NextResponse.json(
        { error: 'About data not found' },
        {
          status: 404,
          headers: NO_CACHE_HEADERS,
        }
      );
    }

    return NextResponse.json(aboutData, {
      headers: NO_CACHE_HEADERS,
    });
  } catch (error) {
    console.error('[API /api/about] Error fetching about data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      {
        status: 500,
        headers: NO_CACHE_HEADERS,
      }
    );
  }
}