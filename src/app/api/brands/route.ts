import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';

export async function GET() {
  try {
    // Fetch all brands from the enum_product_brands table
    const brands = await prisma.productBrand.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brands', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
