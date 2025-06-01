import { NextRequest, NextResponse } from 'next/server';
import { fetchProductTitles } from '@/lib/shopify/api';

export async function POST(request: NextRequest) {
  try {
    const { handles } = await request.json();
    
    if (!handles || !Array.isArray(handles)) {
      return NextResponse.json(
        { error: 'Valid handles array is required' },
        { status: 400 }
      );
    }

    const productTitles = await fetchProductTitles(handles);
    return NextResponse.json(productTitles);
  } catch (error) {
    console.error('Error fetching product titles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product titles', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
