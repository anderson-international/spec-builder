import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';

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

    const specifications = await prisma.specification.findMany({
      where: {
        user_id: userId,
      },
      select: {
        id: true,
        shopify_handle: true,
        review: true,
        star_rating: true,
        created_at: true,
        updated_at: true,
        product_type: {
          select: {
            id: true,
            name: true,
          },
        },
        product_brand: {
          select: {
            id: true,
            name: true,
          },
        },
        tasting_notes: {
          select: {
            tasting_note: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        grind: {
          select: {
            id: true,
            name: true,
          },
        },
        moisture_level: {
          select: {
            id: true,
            name: true,
          },
        },
        nicotine_level: {
          select: {
            id: true,
            name: true,
          },
        },
        experience_level: {
          select: {
            id: true,
            name: true,
          },
        },
        tobacco_types: {
          select: {
            tobacco_type: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        cures: {
          select: {
            cure: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      ...(limit ? { take: limit } : {}),
    });

    return NextResponse.json(specifications);
  } catch (error) {
    console.error('Error fetching specifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch specifications' },
      { status: 500 }
    );
  }
}
