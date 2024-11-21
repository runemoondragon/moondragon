import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { fetchOrdAddress } from '@/lib/runebalance';
import { TokenAssociation } from '@/lib/types';

const USER_TOKENS_PATH = path.join(process.cwd(), 'data', 'user-tokens.json');

async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

async function readUserTokens(): Promise<TokenAssociation[]> {
  try {
    const content = await fs.readFile(USER_TOKENS_PATH, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function writeUserTokens(tokens: TokenAssociation[]) {
  await ensureDataDirectory();
  await fs.writeFile(USER_TOKENS_PATH, JSON.stringify(tokens, null, 2));
}

export async function POST(req: Request) {
  try {
    const { name, requiredBalance, associatedUrl, walletAddress } = await req.json();

    // Verify RUNE•MOON•DRAGON access
    const balances = await fetchOrdAddress(walletAddress);
    const moonDragonBalance = balances?.find(token => token.name === "RUNE•MOON•DRAGON");
    const hasAccess = moonDragonBalance && parseInt(moonDragonBalance.balance) >= 2000000;

    if (!hasAccess) {
      return NextResponse.json({ 
        error: 'Unauthorized. You need at least 2,000,000 RUNE•MOON•DRAGON tokens to add tokens.' 
      }, { status: 401 });
    }

    // Validate input
    if (!name || !requiredBalance || !associatedUrl || !walletAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    try {
      // Check if user already has a token
      const userTokens = await readUserTokens();
      if (userTokens.some(t => t.walletAddress === walletAddress)) {
        return NextResponse.json({ 
          error: 'Token already associated with this address. Only one token is allowed.' 
        }, { status: 400 });
      }

      // Add new token
      const newToken: TokenAssociation = {
        walletAddress,
        tokenName: name,
        requiredBalance,
        associatedUrl,
        createdAt: new Date()
      };

      await writeUserTokens([...userTokens, newToken]);

      console.log('Successfully added new token:', newToken);

      return NextResponse.json({ 
        success: true, 
        token: newToken,
        message: "Token added successfully!"
      });

    } catch (fileError) {
      console.error('File operation error:', fileError);
      return NextResponse.json({ 
        error: 'Failed to update tokens file' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error adding user token:', error);
    return NextResponse.json({ 
      error: 'Failed to add token' 
    }, { status: 500 });
  }
} 