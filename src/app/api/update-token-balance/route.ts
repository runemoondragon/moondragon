import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { TokenAssociation } from '@/lib/types';
import { fetchOrdAddress } from '@/lib/runebalance';

const USER_TOKENS_PATH = path.join(process.cwd(), 'data', 'user-tokens.json');

async function readUserTokens(): Promise<TokenAssociation[]> {
  try {
    const content = await fs.readFile(USER_TOKENS_PATH, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function writeUserTokens(tokens: TokenAssociation[]) {
  await fs.writeFile(USER_TOKENS_PATH, JSON.stringify(tokens, null, 2));
}

export async function POST(req: Request) {
  try {
    const { walletAddress, tokenName, newBalance } = await req.json();

    // Verify RUNE•MOON•DRAGON access
    const balances = await fetchOrdAddress(walletAddress);
    const moonDragonBalance = balances?.find(token => token.name === "RUNE•MOON•DRAGON");
    const hasAccess = moonDragonBalance && parseInt(moonDragonBalance.balance) >= 2000000;

    if (!hasAccess) {
      return NextResponse.json({ 
        error: 'Unauthorized. You need at least 2,000,000 RUNE•MOON•DRAGON tokens.' 
      }, { status: 401 });
    }

    // Read current tokens
    const userTokens = await readUserTokens();
    const tokenIndex = userTokens.findIndex(
      t => t.walletAddress === walletAddress && t.tokenName === tokenName
    );

    if (tokenIndex === -1) {
      return NextResponse.json({ 
        error: 'Token not found or not associated with this address' 
      }, { status: 404 });
    }

    // Update token balance
    userTokens[tokenIndex] = {
      ...userTokens[tokenIndex],
      requiredBalance: newBalance
    };

    await writeUserTokens(userTokens);

    return NextResponse.json({ 
      success: true,
      token: userTokens[tokenIndex],
      message: "Required Balance updated successfully"
    });

  } catch (error) {
    console.error('Error updating token balance:', error);
    return NextResponse.json({ 
      error: 'Failed to update token balance' 
    }, { status: 500 });
  }
} 