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
    name: string;
    symbol: string;
    amount: string;
    divisibility: number;
  };
  value?: number; // For BTC outputs
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
      sendAmount: string;
      addressList: string[];
      inputs: PsbtInput[];
      ordinalAddress: string;
      ordinalPubkey: string;
      paymentAddress: string;
      feerate: string;
    } = await req.json();

    const sendAmountNum = Number(sendAmount);
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

    const runeInputs = inputs.filter(input => input.name && input.symbol);
    const btcInput = inputs.find(input => input.id === 'btc');

    if (!runeInputs.length || !btcInput) {
      throw new Error("Missing required Rune or BTC input");
    }

    const totalRune = runeInputs.reduce((sum, input) => sum + Number(input.amount || 0), 0);
    const requiredRune = sendAmountNum * addressList.length;

    if (requiredRune > totalRune) {
      throw new Error(`Insufficient Rune balance. Need ${requiredRune}, have ${totalRune}`);
    }

    const runeChange = totalRune - requiredRune;
    const totalBTC = Math.floor(Number(btcInput.amount || '0'));
    const txSize = 10 + inputs.length * 180 + (addressList.length + 2) * 34;
    const txFee = Math.ceil(txSize * feerateNum);
    const totalBTCRequired = addressList.length * DUST_LIMIT + txFee;

    if (totalBTC < totalBTCRequired) {
      throw new Error("Insufficient BTC balance for dust and fees");
    }

    const btcChange = totalBTC - totalBTCRequired;

    // Initialize PSBT first
    const network = networks.bitcoin;
    const psbt = new bitcoin.Psbt({ network });

    // Prepare outputs array
    const outputs: PsbtOutput[] = [];

    // Add Rune recipient outputs
    addressList.forEach(address => {
      outputs.push({
        address,
        rune: {
          id: runeInputs[0].id,
          name: runeInputs[0].name || "",
          symbol: runeInputs[0].symbol || "",
          amount: (sendAmountNum / addressList.length).toString(),
          divisibility: runeInputs[0].divisibility || 0,
        },
        value: DUST_LIMIT
      });
    });

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

    // 1. Add OP_RETURN first (Script output #1)
    const constructRuneOpReturn = () => {
      const protocolId = Buffer.from([0x13]);  // Rune protocol identifier
      const runeIdHex = runeInputs[0].id.split(':')[0];
      const amount = BigInt(sendAmountNum);
      
      // Combine ID and amount in proper format
      const data = Buffer.concat([
        protocolId,
        Buffer.from(runeIdHex, 'hex'),
        Buffer.from(amount.toString(16).padStart(16, '0'), 'hex')
      ]);
      
      return data;
    };

    const opReturnData = constructRuneOpReturn();

    psbt.addOutput({
      script: bitcoin.script.compile([
        bitcoin.opcodes.OP_RETURN,
        opReturnData
      ]),
      value: 0
    });

    // 2. Add Rune recipient outputs
    outputs.forEach(output => {
      psbt.addOutput({
        address: output.address,
        value: DUST_LIMIT,
      });
    });

    // 3. Add Rune change output only if there's change
    if (runeChange > 0) {
      psbt.addOutput({
        address: ordinalAddress,
        value: DUST_LIMIT,
      });
    }

    // 4. Add BTC change output last
    if (btcChange > DUST_LIMIT) {
      psbt.addOutput({
        address: paymentAddress,
        value: btcChange,
      });
    }

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
    console.error("Error in PSBT creation:", error);
  
    // Assert that the error is an instance of Error
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
  
    return NextResponse.json(
      { error: "Failed to create transaction", details: errorMessage },
      { status: 500 }
    );
  }  
}