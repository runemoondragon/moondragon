import { NextResponse } from 'next/server';
import * as bitcoin from 'bitcoinjs-lib';
import { networks } from 'bitcoinjs-lib';
import * as ecc from '@bitcoinerlab/secp256k1';
import { Runestone, none, RuneId } from "runelib";

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

interface PsbtOutputExtended {
  script: Buffer;
  value: number;
}

const constructRuneOpReturn = (runeId: string, sendAmountNum: number, addressList: string[]) => {
  try {
    // Create edicts for each recipient
    const edicts = addressList.map((_, index) => ({
      id: new RuneId(+runeId.split(":")[0], +runeId.split(":")[1]),
      amount: BigInt(sendAmountNum),
      output: index + 1,
    }));

    // Create Runestone with edicts
    const runestone = new Runestone(edicts, none(), none(), none());
    return runestone.encipher();
  } catch (error) {
    console.error('Error constructing Runestone:', error);
    throw new Error('Failed to construct Runestone OP_RETURN');
  }
};

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
    console.log('API received amount:', amount);
    console.log('Converted sendAmountNum:', sendAmountNum);
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

    // Keep the original amount as the per-recipient amount
    const perRecipientAmount = BigInt(sendAmountNum);
    // Calculate total needed based on per-recipient amount
    const totalNeeded = Number(perRecipientAmount) * addressList.length;
    const runeChange = totalRuneAmount - totalNeeded;

    if (runeChange < 0) {
      throw new Error(`Insufficient Rune balance. Need ${totalNeeded}, have ${totalRuneAmount}`);
    }

    // Define cost data for fee calculation like ordinal.io
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
        sequence: 0xfffffffd,
        witnessUtxo: {
          script: bitcoin.address.toOutputScript(
            input.id === 'btc' ? paymentAddress : ordinalAddress,
            network,
          ),
          value: input.id === 'btc' ? btcUtxo.value : DUST_LIMIT,
        },
      });
    });

    // Create and add OP_RETURN output using Runestone
    const opReturnData = constructRuneOpReturn(
      runeInputs[0].id,
      sendAmountNum,
      addressList
    );

    psbt.addOutput({
      script: bitcoin.script.compile([
        bitcoin.opcodes.OP_RETURN,
        Buffer.from(opReturnData)
      ]),
      value: 0
    });

    // Add all recipient outputs first
    addressList.forEach((address) => {
      psbt.addOutput({
        script: bitcoin.address.toOutputScript(address, network),
        value: DUST_LIMIT
      });
    });

    // Add Rune change output if needed
    if (runeChange > 0) {
      psbt.addOutput({
        script: bitcoin.address.toOutputScript(ordinalAddress, network),
        value: DUST_LIMIT
      });
    }

    // Add BTC change output last
    if (btcChange > DUST_LIMIT) {
      psbt.addOutput({
        script: bitcoin.address.toOutputScript(paymentAddress, network),
        value: btcChange
      });
    }

    console.log('Amount values:', {
      rawAmount: amount,
      sendAmountNum,
      bigIntAmount: BigInt(sendAmountNum).toString(),
      bufferAmount: Buffer.alloc(8).writeBigUInt64LE(BigInt(sendAmountNum))
    });

    // Log the complete PSBT before returning
    console.log('Complete PSBT:', {
      hex: psbt.toHex(),
      base64: psbt.toBase64(),
      inputs: allInputs.map(input => ({
        txid: input.location.split(':')[0],
        vout: input.location.split(':')[1],
        type: input.id
      })),
      outputs: {
        opReturn: opReturnData.toString('hex'),
        recipients: addressList,
        hasChange: runeChange > 0,
        btcChange: btcChange
      }
    });

    // Add debug logging
    console.log('Runestone transaction details:', {
      runeId: runeInputs[0].id,
      sendAmount: sendAmountNum,
      recipientCount: addressList.length,
      opReturnHex: opReturnData.toString('hex'),
      outputOrder: [
        'op_return',
        ...addressList.map(() => 'recipient'),
        runeChange > 0 ? 'rune_change' : null,
        btcChange > DUST_LIMIT ? 'btc_change' : null
      ].filter(Boolean)
    });

    // Debug: Decode OP_RETURN data
    try {
      const decodedPsbt = bitcoin.Psbt.fromBase64(psbt.toBase64());
      const opReturnOutput = decodedPsbt.txOutputs.find(
        output => output.script[0] === bitcoin.opcodes.OP_RETURN
      );
      
      console.log('OP_RETURN Debug Info:', {
        fullScript: opReturnOutput?.script.toString('hex'),
        scriptLength: opReturnOutput?.script.length,
        rawOpReturn: opReturnData.toString('hex'),
        decodedEdicts: addressList.map((_, index) => ({
          runeId: runeInputs[0].id,
          amount: sendAmountNum,
          outputIndex: index + 1
        })),
        outputCount: psbt.txOutputs.length,
        allOutputTypes: psbt.txOutputs.map((out, i) => 
          out.script[0] === bitcoin.opcodes.OP_RETURN ? 'OP_RETURN' : `Output ${i}`
        )
      });
    } catch (error) {
      console.error('Debug decode error:', error);
    }

    return NextResponse.json({
      psbtBase64: psbt.toBase64(),
      psbtHex: psbt.toHex(),
      paymentIndexes: [1],
      paymentSigHash: 1,
      ordinalIndexes: [0],
      ordinalSigHash: 1,
      estimatedTxSize: baseSize + inputAdjustment,
      estimatedTxFee: txFee,
      platformFee: platformFee,
      btcInputAmount: btcUtxo.value,
      costs: totalBTCRequired,
      id: crypto.randomUUID(),
    });
  } catch (error) {
    console.error("Error in PSBT creation:", error);
    return NextResponse.json(
      { 
        error: "Failed to create transaction", 
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}