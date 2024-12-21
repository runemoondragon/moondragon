import { NextResponse } from 'next/server';
import * as bitcoin from 'bitcoinjs-lib';
import { networks } from 'bitcoinjs-lib';
import * as ecc from '@bitcoinerlab/secp256k1';

// Initialize ECC library
bitcoin.initEccLib(ecc);

const DUST_LIMIT = 546;

interface PsbtInput {
  location: string; // e.g., txid_vout
  id: string; // Identifier for the input (e.g., 'btc', 'rune')
  name?: string; // Optional: Name for Rune inputs
  symbol?: string; // Optional: Symbol for Rune inputs
  amount?: string; // Optional: Amount as a string
  divisibility?: number; // Optional: Divisibility for Rune inputs
}

interface PsbtOutput {
  address: string;
  rune?: {
    name: string;
    symbol: string;
    amount: string;
    divisibility: number;
  };
  value?: number; // Optional: For BTC outputs only
}

export async function POST(req: Request) {
  try {
    const {
      sendAmount,
      addressList,
      inputs,
      ordinalAddress,
      ordinalPubkey,
      paymentAddress,
      feerate,
    }: {
      sendAmount: number;
      addressList: string[];
      inputs: PsbtInput[];
      ordinalAddress: string;
      ordinalPubkey: string;
      paymentAddress: string;
      feerate: number;
    } = await req.json();

    // Validate required fields
    if (
      !sendAmount ||
      !addressList?.length ||
      !inputs?.length ||
      !ordinalAddress ||
      !ordinalPubkey ||
      !paymentAddress ||
      !feerate
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Separate Rune and BTC inputs
    const runeInput = inputs.find(input => input.name && input.symbol);
    const btcInput = inputs.find(input => input.id === 'btc');

    if (!runeInput || !btcInput) {
      throw new Error("Missing required Rune or BTC input");
    }

    // Calculate total Rune and validate
    const totalRune = inputs.reduce((sum, input) => sum + Number(input.amount || 0), 0);
    const requiredRune = sendAmount * addressList.length;

    if (requiredRune > totalRune) {
      throw new Error(`Insufficient Rune balance. Need ${requiredRune}, have ${totalRune}`);
    }

    // Calculate Rune change
    const runeChange = totalRune - requiredRune;

    // Validate BTC input for dust and fees
    const totalBTC = Math.floor(Number(btcInput.amount || '0')); // Convert BTC to sats
    const txSize = 10 + inputs.length * 180 + (addressList.length + 2) * 34; // Basic size calculation
    const txFee = Math.ceil(txSize * feerate);
    const totalBTCRequired = addressList.length * DUST_LIMIT + txFee;

    if (totalBTC < totalBTCRequired) {
      throw new Error("Insufficient BTC balance for dust and fees");
    }

    const btcChange = totalBTC - totalBTCRequired;

    // Prepare outputs
    const outputs: PsbtOutput[] = [
      // Rune recipient outputs
      ...addressList.map(address => ({
        address,
        rune: {
          name: runeInput.name || "", // Fallback to empty string if undefined
          symbol: runeInput.symbol || "", // Fallback to empty string if undefined
          amount: sendAmount.toString(),
          divisibility: runeInput.divisibility || 0,
        },
      })),
      // Rune change output
      {
        address: ordinalAddress,
        rune: {
          name: runeInput.name || "", // Fallback to empty string if undefined
          symbol: runeInput.symbol || "", // Fallback to empty string if undefined
          amount: runeChange.toString(),
          divisibility: runeInput.divisibility || 0,
        },
      },
    ];

    // Add BTC change output if applicable
    if (btcChange > DUST_LIMIT) {
      outputs.push({
        address: paymentAddress,
        value: btcChange, // Only add 'value' for BTC outputs
      });
    }

    // Create PSBT
    const network = networks.bitcoin;
    const psbt = new bitcoin.Psbt({ network });
    

    // Add inputs
    inputs.forEach((input: PsbtInput) => {
      const [txid, vout] = input.location.split(':');
    
      if (!txid || txid.length !== 64) {
        throw new Error(`Invalid txid: ${txid}`);
      }
    
      if (!vout || isNaN(parseInt(vout))) {
        throw new Error(`Invalid vout: ${vout}`);
      }
    
      psbt.addInput({
        hash: Buffer.from(txid, 'hex').reverse(), // txid must be 32 bytes
        index: parseInt(vout),
        witnessUtxo: {
          script: bitcoin.address.toOutputScript(
            input.id === 'btc' ? paymentAddress : ordinalAddress,
            network
          ),
          value: input.id === 'btc' ? totalBTC : DUST_LIMIT,
        },
      });
    });
    

    // Add outputs
    outputs.forEach(output => {
      if (output.value) {
        // BTC output
        psbt.addOutput({
          address: output.address,
          value: output.value,
        });
      } else if (output.rune) {
        // Rune output
        psbt.addOutput({
          address: output.address,
          value: DUST_LIMIT,
        });
      }
    });

    return NextResponse.json({
      psbtBase64: psbt.toBase64(),
      btcDetails: {
        inputAmount: totalBTC,
        fee: txFee,
        dustTotal: addressList.length * DUST_LIMIT,
        change: btcChange,
      },
    });
  } catch (error) {
    console.error("Error in mass send:", error);
    
    return NextResponse.json(
      { error: "Failed to create transaction", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
