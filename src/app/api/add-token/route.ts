import { NextResponse } from 'next/server';
import { fetchOrdAddress } from '@/lib/runebalance';
import { RuneBalance } from '@/lib/runebalance';

export async function POST(request: Request) {
  try {
    const { adminAddress, tokenName, requiredBalance } = await request.json();

    if (!adminAddress || !tokenName || requiredBalance === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify BITBOARD•DASH access
    const balances = await fetchOrdAddress(adminAddress);
    const bitboardBalance = balances?.find((token: RuneBalance) => token.name === "BITBOARD•DASH");
    const hasAccess = bitboardBalance && parseInt(bitboardBalance.balance) >= 200000;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient BITBOARD•DASH balance' }, { status: 403 });
    }

    // Rest of the code...
  } catch (error) {
    console.error('Error adding token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 