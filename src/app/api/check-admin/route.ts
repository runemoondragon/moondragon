import { NextResponse } from 'next/server';
import { fetchOrdAddress } from '@/lib/runebalance';
import { RuneBalance } from '@/lib/runebalance';

export async function POST(request: Request) {
  try {
    const { address } = await request.json();

    // Check if the address has RUNE•MOON•DRAGON tokens
    const balances = await fetchOrdAddress(address);
    const moonDragonBalance = balances?.find((token: RuneBalance) => token.name === "RUNE•MOON•DRAGON");
    const hasAccess = moonDragonBalance && parseInt(moonDragonBalance.balance) >= 20000000;

    console.log("Has Moon Dragon access?", hasAccess);

    return NextResponse.json({ isAdmin: hasAccess });
  } catch (error) {
    console.error('Failed to check admin rights:', error);
    return NextResponse.json({ error: 'Failed to check admin rights' }, { status: 500 });
  }
} 