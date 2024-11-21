import { NextResponse } from 'next/server';
import { ACCESS_TOKENS } from '@/lib/const';

export async function GET() {
  try {
    return NextResponse.json({ tokens: ACCESS_TOKENS });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json({ tokens: [] }, { status: 500 });
  }
} 