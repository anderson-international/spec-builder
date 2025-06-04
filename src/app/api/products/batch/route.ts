import { NextRequest, NextResponse } from 'next/server';
import { fetchProductsBatch } from '@/lib/shopify/api';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get('cursor') || undefined;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 25; // Default batch size of 25
    
    // Fetch products in batches with cursor-based pagination
    const { products, nextCursor, hasNextPage } = await fetchProductsBatch(cursor, limit);
    
    return NextResponse.json({
      products,
      nextCursor,
      hasNextPage
    });
  } catch (error) {
    console.error('Error fetching product batch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product batch' },
      { status: 500 }
    );
  }
}
