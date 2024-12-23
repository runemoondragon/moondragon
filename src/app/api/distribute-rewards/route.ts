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
    isBundle?: boolean;
  };
  value?: number; // For BTC outputs
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

    const runeInputs = inputs.filter(input => input.id !== 'btc');
    const btcInput = inputs.find(input => input.id === 'btc');

    if (!runeInputs.length || !btcInput) {
      throw new Error("Missing required Rune or BTC input");
    }

    const totalRune = sendAmountNum * addressList.length;
    const requiredRune = totalRune;  // Each recipient gets full amount

    const runeChange = 0;  // No change calculation needed
    const totalBTC = 40000;  // Default value for BTC input
    const txSize = 10 + inputs.length * 180 + (addressList.length + 2) * 34;
    const txFee = Math.ceil(txSize * feerateNum);
    const totalBTCRequired = addressList.length * DUST_LIMIT + txFee;

    const btcChange = totalBTC - totalBTCRequired;

    // Calculate amounts first like ordinal.io
    const perRecipientAmount = amount; // Use amount instead of sendAmount
    const outputs: PsbtOutput[] = [];

    // Initialize PSBT
    const network = networks.bitcoin;
    const psbt = new bitcoin.Psbt({ network });

    // Add all inputs first
    inputs.forEach(input => {
      const [txid, vout] = input.location.split(':');
      psbt.addInput({
        hash: Buffer.from(txid, 'hex').reverse(),
        index: parseInt(vout),
        witnessUtxo: {
          script: bitcoin.address.toOutputScript(
            input.id === 'btc' ? paymentAddress : ordinalAddress,
            network,
          ),
          value: input.id === 'btc' ? totalBTC : DUST_LIMIT,
        },
      });
    });

    // Add OP_RETURN first (like ordinal.io)
    const constructRuneOpReturn = () => {
      const protocolId = Buffer.from([0x13]);
      const runeIdHex = runeInputs[0].id.split(':')[0];
      const amountBig = BigInt(amount);  // Use amount here too
      return Buffer.concat([
        protocolId,
        Buffer.from(runeIdHex, 'hex'),
        Buffer.from(amountBig.toString(16).padStart(16, '0'), 'hex')
      ]);
    };

    psbt.addOutput({
      script: bitcoin.script.compile([
        bitcoin.opcodes.OP_RETURN,
        constructRuneOpReturn()
      ]),
      value: 0
    });

    // Add recipient outputs (following ordinal.io's structure)
    addressList.forEach((address, index) => {
      const bundleOutput: PsbtOutput = {
        address,
        rune: {
          id: runeInputs[0].id,
          runeName: "RUNE",  // Use fixed value or remove if not needed
          amount: perRecipientAmount,
          divisibility: 0,   // Use default value
          location: `${runeInputs[0].location}:${index}`,
          isBundle: true
        },
        value: DUST_LIMIT
      };
      outputs.push(bundleOutput);

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
          location: `${runeInputs[0].location}:change`
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
        inputAmount: totalBTC,
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