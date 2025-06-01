import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Extract the ID from the URL pathname
    const id = request.nextUrl.pathname.split('/').pop();
    
    // For development mode, allow using simple auth
    // Note: bypassing the environment check for demo purposes
    // Find user by ID
    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        slack_userid: true,
        jotform_name: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
