import { NextResponse } from 'next/server';
import { getTokenBalance } from '../../../lib/tokenUtils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const tokenName = searchParams.get('token');

    if (!address || !tokenName) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const balance = await getTokenBalance(address, tokenName);

    return NextResponse.json({
      balance: balance
    });

  } catch (error) {
    console.error('Error fetching token balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token balance' },
      { status: 500 }
    );
  }
} 