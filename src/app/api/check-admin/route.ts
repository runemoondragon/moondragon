import { NextResponse } from 'next/server';
import { fetchOrdAddress, RuneBalance } from '@/lib/runebalance';

export async function POST(req: Request) {
  try {
    const { address } = await req.json();
    console.log("Checking admin rights for address:", address);

    // Check if the address has RUNE•MOON•DRAGON tokens
    const balances = await fetchOrdAddress(address);
    const moonDragonBalance = balances?.find((token: RuneBalance) => token.name === "RUNE•MOON•DRAGON");
    const hasAccess = moonDragonBalance && parseInt(moonDragonBalance.balance) >= 2000000;

    console.log("Has Moon Dragon access?", hasAccess);
    
    return NextResponse.json({ isAdmin: hasAccess });
  } catch (error) {
    console.error('Error checking admin rights:', error);
    return NextResponse.json({ isAdmin: false });
  }
} 