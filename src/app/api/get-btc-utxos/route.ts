import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
  }

  try {
    // Using mempool.space API to fetch BTC UTXOs
    const response = await fetch(`https://mempool.space/api/address/${address}/utxo`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch UTXOs from mempool.space');
    }

    const utxos = await response.json();

    // Transform the UTXOs to match our UTXO interface
    const formattedUtxos = utxos.map((utxo: any) => ({
      txid: utxo.txid,
      vout: utxo.vout,
      value: utxo.value,
      status: "unspent",
      rune: {
        name: "btc",
        amount: utxo.value.toString(),
        status: "unspent",
        timestamp: Date.now()
      }
    }));

    return NextResponse.json({
      message: `Found ${formattedUtxos.length} BTC UTXOs`,
      utxos: formattedUtxos
    });

  } catch (error) {
    console.error('Error fetching BTC UTXOs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch BTC UTXOs' },
      { status: 500 }
    );
  }
} 