import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenName = searchParams.get('token');
  const address = searchParams.get('address');
  
  if (!tokenName) {
    return NextResponse.json({ error: 'Token name is required' }, { status: 400 });
  }

  if (!address) {
    return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://runes.ordinal.io/runes/utxos/${address}`);
    if (!response.ok) {
      console.error('Error fetching rune UTXOs:', response.statusText);
      return new Response(JSON.stringify({ error: 'Failed to fetch UTXOs' }), {
        status: 500,
      });
    }

    const data = await response.json();
    
    // Find the rune entry for the requested token
    const runeEntry = data.find((rune: any) => rune.runeName === tokenName);
    
    if (!runeEntry) {
      return NextResponse.json({
        message: `No UTXOs found for token: ${tokenName}`,
        utxos: []
      });
    }

    // Transform the outputs into our UTXO format
    const runeUTXOs = runeEntry.outputs.map((output: any) => {
      const [txid, vout] = output.location.split(':');
      return {
        txid,
        vout: parseInt(vout),
        value: output.amount,
        rune: {
          name: runeEntry.runeName,
          amount: output.amount.toString(),
          status: "unspent",
          timestamp: Date.now(),
        }
      };
    });

    return NextResponse.json({
      message: `Found ${runeUTXOs.length} UTXOs for token: ${tokenName}`,
      utxos: runeUTXOs
    });

  } catch (error) {
    console.error('Unexpected error in rune-utxos endpoint:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
} 