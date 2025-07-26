import { NextResponse } from 'next/server';
import { getAbout } from '@/services/contentService';

export async function GET() {
  try {
    const aboutData = await getAbout();
    
    if (!aboutData) {
      return NextResponse.json(
        { error: 'About data not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(aboutData);
  } catch (error) {
    console.error('Error fetching about data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}