import { NextResponse } from 'next/server';
import * as bitcoin from 'bitcoinjs-lib';
import { networks } from 'bitcoinjs-lib';
import * as ecc from '@bitcoinerlab/secp256k1';

// Initialize ECC library
bitcoin.initEccLib(ecc);

// Interfaces
interface PsbtInput {
  location: string;
  active: boolean;
  id: string;
  name?: string; // For Rune inputs
  symbol?: string; // For Rune inputs
  amount: string;
  divisibility?: number;
}

interface PsbtOutput {
  address: string;
  rune?: {
    name: string;
    symbol: string;
    amount: string;
    divisibility: number;
  };
  value?: number; // For BTC outputs
}

const DUST_LIMIT = 546;

function calculateTxSize(numInputs: number, numOutputs: number): number {
  const baseTxSize = 10;
  const inputSize = 180;
  const outputSize = 34;
  return baseTxSize + inputSize * numInputs + outputSize * numOutputs;
}

function calculateFee(txSize: number, feeRate: number): number {
  return Math.ceil(txSize * feeRate);
}

async function createPsbt(params: {
  inputs: PsbtInput[];
  outputs: PsbtOutput[];
  ordinalAddress: string;
  ordinalPubkey: string;
  paymentAddress?: string;
  paymentPubkey?: string;
  feerate: number;
}) {
  // Simulated PSBT creation (replace with actual PSBT creation logic)
  return {
    psbtBase64: "example_psbt_base64",
    paymentIndexes: [0],
    ordinalIndexes: [1],
  };
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
      paymentPublicKey,
      balance,
      feerate,
    }: {
      sendAmount: number;
      addressList: string[];
      inputs: PsbtInput[];
      ordinalAddress: string;
      ordinalPubkey: string;
      paymentAddress: string;
      paymentPublicKey: string;
      balance: number;
      feerate: number;
    } = await req.json();

    // Validate required fields
    if (
      !addressList?.length ||
      !inputs?.length ||
      !ordinalAddress ||
      !ordinalPubkey ||
      !feerate ||
      !balance ||
      !paymentAddress
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Separate Rune and BTC inputs
    const runeInput = inputs.find((input: PsbtInput) => input.name && input.symbol);
    const btcInput = inputs.find((input: PsbtInput) => !input.name && !input.symbol);

    if (!runeInput || !btcInput) {
      throw new Error("Missing required Rune or BTC input");
    }

    // Validate Rune input
    const totalRune = Number(runeInput.amount);
    const requiredRune = sendAmount * addressList.length;
    if (requiredRune > totalRune) {
      throw new Error("Insufficient Rune balance");
    }

    // Calculate Rune change
    const runeChange = totalRune - requiredRune;

    // Validate BTC input
    const totalBTC = Math.floor(Number(btcInput.amount) * 100000000); // Convert BTC to sats
    const txSize = calculateTxSize(inputs.length, addressList.length + 2); // +2 for Rune change and BTC change outputs
    const txFee = calculateFee(txSize, feerate);
    const totalBTCRequired = addressList.length * DUST_LIMIT + txFee;

    if (totalBTC < totalBTCRequired) {
      throw new Error("Insufficient BTC balance for dust and fees");
    }

    // Calculate BTC change
    const btcChange = totalBTC - totalBTCRequired;
    console.log('BTC Change:', btcChange, 'Sats');
    console.log('Total BTC Required:', totalBTCRequired, 'Sats');

    // Create outputs for Rune recipients
    const outputs: PsbtOutput[] = addressList.map((address: string) => ({
      address,
      rune: {
        name: runeInput.name!,
        symbol: runeInput.symbol!,
        amount: sendAmount.toString(),
        divisibility: runeInput.divisibility || 0,
      },
    }));

    // Add Rune change output if there is change
    if (runeChange > 0) {
      outputs.push({
        address: ordinalAddress,
        rune: {
          name: runeInput.name!,
          symbol: runeInput.symbol!,
          amount: runeChange.toString(),
          divisibility: runeInput.divisibility || 0,
        },
      });
    }

    // Add BTC change output
    if (btcChange > DUST_LIMIT) {
      outputs.push({
        address: paymentAddress,
        value: btcChange,
      });
      console.log('BTC Change Output Added:', {
        address: paymentAddress,
        value: btcChange,
      });
    }

    // Create PSBT
    const network = networks.bitcoin;
    const psbt = new bitcoin.Psbt({ network });

    // Add inputs
    inputs.forEach(input => {
      if (input.location === 'payment_input') {
        // Handle BTC payment input differently
        psbt.addInput({
          hash: Buffer.alloc(32, 0),  // Placeholder hash for payment input
          index: 0,
          witnessUtxo: {
            script: bitcoin.address.toOutputScript(paymentAddress, network),
            value: Math.floor(Number(input.amount) * 100000000)
          }
        });
      } else {
        // Handle Rune input
        const [txid, vout] = input.location.split('_');
        psbt.addInput({
          hash: Buffer.from(txid, 'hex').reverse(),  // Convert txid to proper Buffer
          index: parseInt(vout),
          witnessUtxo: {
            script: bitcoin.address.toOutputScript(ordinalAddress, network),
            value: DUST_LIMIT
          }
        });
      }
    });

    // Add outputs
    outputs.forEach(output => {
      psbt.addOutput({
        address: output.address,
        value: output.value || 546 // Use specified value or dust limit for Rune outputs
      });
    });

    return NextResponse.json({
      psbtBase64: psbt.toBase64(),
      paymentIndexes: inputs.map((_, i) => i).filter(i => inputs[i].id === 'btc'),
      ordinalIndexes: inputs.map((_, i) => i).filter(i => inputs[i].id !== 'btc'),
      transfers: {
        send: addressList.map((address: string) => ({
          to: address,
          bundle: {
            size: DUST_LIMIT,
            runes: {
              name: runeInput.name!,
              symbol: runeInput.symbol!,
              amount: sendAmount,
              divisibility: runeInput.divisibility || 0,
            },
          },
        })),
        receive: [
          {
            to: ordinalAddress,
            bundle: {
              size: DUST_LIMIT,
              runes: {
                name: runeInput.name!,
                symbol: runeInput.symbol!,
                amount: runeChange > 0 ? runeChange : 0,
                divisibility: runeInput.divisibility || 0,
              },
            },
          },
        ],
      },
      btcDetails: {
        inputAmount: totalBTC,
        fee: txFee,
        dustTotal: addressList.length * DUST_LIMIT,
        change: btcChange,
        txSize: txSize,
        feeRate: feerate,
        paymentAddress: paymentAddress,
      },
    });
  } catch (error) {
    console.error("Error in distribute-rewards:", error);
    return NextResponse.json(
      {
        error: "Failed to create transaction",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
