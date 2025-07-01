import { NextResponse } from 'next/server';
import { getPopupData } from '@/lib/content-parser';

type Params = {
  params: {
    slug: string;
  };
};

export async function GET(request: Request, { params }: Params) {
  try {
    const slug = params.slug;
    const popup = getPopupData(slug);

    if (!popup) {
      return NextResponse.json({ message: 'Popup not found.' }, { status: 404 });
    }

    return NextResponse.json(popup);
  } catch (error) {
    console.error(`Error fetching popup ${params.slug}:`, error);
    return NextResponse.json({ message: 'An error occurred while fetching the popup.' }, { status: 500 });
  }
}
