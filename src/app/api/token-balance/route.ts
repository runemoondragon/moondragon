import { NextResponse } from 'next/server';
import { getTokenBalance } from '@/lib/tokenUtils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const balance = await getTokenBalance(address);
    
    return NextResponse.json({
      raw: balance.raw,
      formatted: balance.formatted,
      hasMinimumBalance: balance.hasMinimumBalance
    });
  } catch (error) {
    console.error('Token balance route error:', error);
    return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 });
  }
} 