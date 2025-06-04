import { NextRequest, NextResponse } from 'next/server';
import { fetchProductsByHandles } from '@/lib/shopify/api';

// Support GET requests (the frontend is using GET)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const handlesParam = url.searchParams.get('handles');
    
    if (!handlesParam) {
      return NextResponse.json(
        { error: 'handles parameter is required' },
        { status: 400 }
      );
    }
    
    let handles: string[];
    try {
      handles = JSON.parse(handlesParam);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid handles JSON format' },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(handles) || handles.length === 0) {
      return NextResponse.json(
        { error: 'Valid product handles array is required' },
        { status: 400 }
      );
    }
    
    // Limit to reasonable batch size
    const limitedHandles = handles.slice(0, 25);
    
    const products = await fetchProductsByHandles(limitedHandles);
    
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products by handles (GET):', error);
    return NextResponse.json(
      { error: 'Failed to fetch products by handles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { handles } = body;
    
    if (!handles || !Array.isArray(handles) || handles.length === 0) {
      return NextResponse.json(
        { error: 'Valid product handles array is required' },
        { status: 400 }
      );
    }
    
    // Limit to reasonable batch size
    const limitedHandles = handles.slice(0, 25);
    
    const products = await fetchProductsByHandles(limitedHandles);
    
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products by handles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products by handles' },
      { status: 500 }
    );
  }
}
