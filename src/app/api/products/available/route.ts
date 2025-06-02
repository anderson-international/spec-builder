import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import { fetchAvailableProducts } from '@/lib/shopify/api';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // 1. First get all product handles that already have specifications
    const existingSpecifications = await prisma.specification.findMany({
      where: {
        user_id: userId,
      },
      select: {
        shopify_handle: true,
      },
    });

    // Extract just the handles
    const existingHandles = existingSpecifications.map((spec: { shopify_handle: string }) => spec.shopify_handle);

    // 2. Fetch products from Shopify API using our GraphQL client
    // This will automatically exclude products that already have specifications
    // Brand metafield is required - no fallback to vendor
    let availableProducts;
    try {
      availableProducts = await fetchAvailableProducts(existingHandles, limit);
    } catch (error) {
      console.error('Shopify GraphQL API error:', error);
      // Handle specific error for missing custom.brands metafields
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isBrandMetafieldError = errorMessage.includes('missing required custom.brands metafield');
      
      return NextResponse.json(
        { 
          error: isBrandMetafieldError ? 
            'One or more products are missing required custom.brands metafields in Shopify' : 
            'Failed to fetch products from Shopify', 
          details: errorMessage 
        },
        { status: isBrandMetafieldError ? 400 : 500 }
      );
    }

    // Transform data to match our frontend interface
    const formattedProducts = availableProducts.map((product: {
      id: string;
      handle: string;
      title: string;
      vendor: string;
      brand: string;
      image_url: string | null;
      product_url: string;
    }) => ({
      id: product.id,
      handle: product.handle,
      title: product.title,
      brand: product.brand, // Brand value comes exclusively from custom.brands metafield - no vendor fallback
      imageUrl: product.image_url || '/images/placeholder-product.png', // Fallback image
      productUrl: product.product_url,
    }));
    
    // Return the formatted products

    return NextResponse.json(formattedProducts);
  } catch (error) {
    console.error('Error fetching available products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available products' },
      { status: 500 }
    );
  }
}
