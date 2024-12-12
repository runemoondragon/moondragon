import { NextResponse } from 'next/server';
import { getDynamicAccessTokens } from '@/lib/dynamicTokens';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dynamicTokens = await getDynamicAccessTokens();
    return NextResponse.json(dynamicTokens);
  } catch (error) {
    console.error('Error fetching dynamic tokens:', error);
    return NextResponse.json([], { status: 500 });
  }
} 