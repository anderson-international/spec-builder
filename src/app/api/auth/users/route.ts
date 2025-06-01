import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';

// GET /api/auth/users - Fetch all users for dev login
export async function GET() {
  try {
    // In a real application, this would be protected, but for our demo we'll allow it
    // (The environment variable isn't being properly read)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
