import { NextResponse } from 'next/server';
import * as bitcoin from 'bitcoinjs-lib';
import { networks } from 'bitcoinjs-lib';
import * as ecc from '@bitcoinerlab/secp256k1';

bitcoin.initEccLib(ecc);

const DUST_LIMIT = 546;

interface PsbtInput {
  location: string; // txid:vout format
  id: string; // Identifier for the input (e.g., 'btc', 'rune')
  name?: string;
  symbol?: string;
  amount?: string;
  divisibility?: number;
}

interface PsbtOutput {
  address: string;
  rune?: {
    id: string;
    runeName: string;
    amount: string;
    divisibility: number;
    location: string;
    isBundle: boolean;
  };
  value: number;
}

interface BTCUtxo {
  txid: string;
  vout: number;
  value: number;
}

export async function POST(req: Request) {
  try {
    const {
      amount,
      addressList,
      inputs,
      ordinalAddress,
      ordinalPubkey,
      paymentAddress,
      paymentPubkey,
      feerate,
    }: {
      amount: string;
      addressList: string[];
      inputs: {
        location: string;
        active: boolean;
        id: string;
      }[];
      ordinalAddress: string;
      ordinalPubkey: string;
      paymentAddress: string;
      paymentPubkey: string;
      feerate: string;
    } = await req.json();

    const sendAmountNum = Number(amount);
    const feerateNum = Number(feerate);

    if (
      !sendAmountNum ||
      !addressList?.length ||
      !inputs?.length ||
      !ordinalAddress ||
      !ordinalPubkey ||
      !paymentAddress ||
      !feerateNum
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Instead, just check for Rune inputs
    const runeInputs = inputs;  // We expect all inputs to be Rune inputs
    if (!runeInputs.length) {
      throw new Error("Missing required Rune inputs");
    }

    // Get total Rune amount from all inputs
    const runeUtxoResponse = await fetch(`https://runes.ordinal.io/runes/utxos/${ordinalAddress}`);
    if (!runeUtxoResponse.ok) {
      throw new Error("Failed to fetch Rune UTXO info");
    }
    const runeUtxoData = await runeUtxoResponse.json();
    
    // Calculate total from all inputs
    let totalRuneAmount = 0;
    for (const input of runeInputs) {
      const runeEntry = runeUtxoData.find((rune: any) => 
        rune.outputs.some((output: any) => output.location === input.location)
      );
      if (!runeEntry) continue;

      const runeOutput = runeEntry.outputs.find((output: any) => 
        output.location === input.location
      );
      totalRuneAmount += Number(runeOutput?.amount || 0);
    }

    const totalNeeded = sendAmountNum * addressList.length;
    const runeChange = totalRuneAmount - totalNeeded;

    if (runeChange < 0) {
      throw new Error(`Insufficient Rune balance. Need ${totalNeeded}, have ${totalRuneAmount}`);
    }

    // Define cost data for fee calculation
    const costData = [
      { addresses: 1, size: 338 },
      { addresses: 2, size: 191 },
      { addresses: 3, size: 142 },
      { addresses: 4, size: 117 },
      { addresses: 5, size: 102 },
      { addresses: 6, size: 93 },
      { addresses: 7, size: 86 },
      { addresses: 8, size: 80 },
      { addresses: 9, size: 76 },
      { addresses: 10, size: 73 },
      { addresses: 15, size: 63 },
      { addresses: 20, size: 60 },
      { addresses: 25, size: 57 },
      { addresses: 50, size: 50 },
      { addresses: 100, size: 47 },
      { addresses: 200, size: 45 },
      { addresses: 500, size: 44 },
      { addresses: 800, size: 44 },
      { addresses: 1000, size: 44 },
    ];

    // Find closest size match for number of addresses
    const closestData = costData.reduce((closest, current) => {
      const closestDiff = Math.abs(closest.addresses - addressList.length);
      const currentDiff = Math.abs(current.addresses - addressList.length);
      return currentDiff < closestDiff ? current : closest;
    });

    // Calculate total costs using ordinal.io's formula with input adjustment
    const sizePerAddress = closestData.size;
    const baseSize = sizePerAddress * addressList.length;
    const inputAdjustment = (runeInputs.length - 1) * 58;  // Additional size for each extra input
    
    const txFee = feerateNum * (baseSize + inputAdjustment);
    const runesCost = addressList.length * DUST_LIMIT;
    const platformFee = addressList.length > 1000 
      ? (1000 * 33) + 5000 
      : addressList.length > 15 
      ? (addressList.length * 33) + 5000 
      : 0;

    const totalBTCRequired = txFee + runesCost + platformFee;

    // Get BTC UTXO internally
    const btcUtxosResponse = await fetch(`https://mempool.space/api/address/${paymentAddress}/utxo`);
    if (!btcUtxosResponse.ok) {
      throw new Error("Failed to fetch BTC UTXOs");
    }

    const btcUtxoList = await btcUtxosResponse.json();
    const btcUtxo = btcUtxoList.find((utxo: BTCUtxo) => utxo.value >= totalBTCRequired);
    if (!btcUtxo) {
      throw new Error(`No suitable BTC UTXO found. Need ${totalBTCRequired} sats`);
    }

    const btcChange = btcUtxo.value - totalBTCRequired;

    // Add both inputs to PSBT
    const allInputs = [
      ...runeInputs,
      {
        location: `${btcUtxo.txid}:${btcUtxo.vout}`,
        active: true,
        id: 'btc'
      }
    ];

    // Initialize PSBT
    const network = networks.bitcoin;
    const psbt = new bitcoin.Psbt({ network });
    const outputs: PsbtOutput[] = [];

    // Add all inputs first
    allInputs.forEach(input => {
      const [txid, vout] = input.location.split(':');
      psbt.addInput({
        hash: Buffer.from(txid, 'hex').reverse(),
        index: parseInt(vout),
        witnessUtxo: {
          script: bitcoin.address.toOutputScript(
            input.id === 'btc' ? paymentAddress : ordinalAddress,
            network,
          ),
          value: input.id === 'btc' ? btcUtxo.value : DUST_LIMIT,
        },
      });
    });

    // Add OP_RETURN first (like ordinal.io)
    const constructRuneOpReturn = () => {
      // Protocol identifier (1 byte)
      const protocolId = Buffer.from([0x13]); // '13'
    
      // Rune ID (first part of the id field, hex-encoded)
      const runeId = Buffer.from(runeInputs[0].id.split(':')[0], 'hex');
    
      // Amount (encoded as 8 bytes, little-endian)
      const amount = Buffer.alloc(8);
      // Use per-recipient amount instead of total
      amount.writeBigUInt64LE(BigInt(sendAmountNum));  // Changed from totalNeeded
    
      return Buffer.concat([protocolId, runeId, amount]);
    };
    
    
    

    psbt.addOutput({
      script: bitcoin.script.compile([
        bitcoin.opcodes.OP_RETURN,
        constructRuneOpReturn()
      ]),
      value: 0
    });

    // Add recipient outputs with bundles
    addressList.forEach((address, index) => {
      const bundleOutput: PsbtOutput = {
        address,
        rune: {
          id: runeInputs[0].id,
          runeName: "RUNE",
          amount: sendAmountNum.toString(),
          divisibility: 0,
          location: `${runeInputs[0].location}:${index}`,
          isBundle: true
        },
        value: DUST_LIMIT
      };
      outputs.push(bundleOutput);

      // Add standard PSBT output
      psbt.addOutput({
        address: bundleOutput.address,
        value: DUST_LIMIT
      });
    });

    // Add Rune change output if needed
    if (runeChange > 0) {
      const changeOutput: PsbtOutput = {
        address: ordinalAddress,
        rune: {
          id: runeInputs[0].id,
          runeName: "RUNE",
          amount: runeChange.toString(),
          divisibility: 0,
          location: `${runeInputs[0].location}:change`,
          isBundle: true
        },
        value: DUST_LIMIT
      };
      outputs.push(changeOutput);
      psbt.addOutput({
        address: ordinalAddress,
        value: DUST_LIMIT
      });
    }

    if (btcChange > DUST_LIMIT) {
      psbt.addOutput({
        address: paymentAddress,
        value: btcChange
      });
    }

    return NextResponse.json({
      psbtBase64: psbt.toBase64(),
      btcDetails: {
        inputAmount: btcUtxo.value,
        fee: txFee,
        dustTotal: outputs.length * DUST_LIMIT,
        change: btcChange,
      },
      outputs // Return outputs for verification
    });
  } catch (error) {
    console.error("Error in PSBT creation:", error);
  
    // Assert that the error is an instance of Error
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
  
    return NextResponse.json(
      { error: "Failed to create transaction", details: errorMessage },
      { status: 500 }
    );
  }  
}