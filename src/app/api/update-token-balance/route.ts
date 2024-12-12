import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { TokenAssociation } from '@/lib/types';
import { fetchOrdAddress, RuneBalance } from '@/lib/runebalance';
import { getDynamicAccessTokens, writeDynamicAccessTokens } from '@/lib/dynamicTokens';

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

async function updateDynamicTokenBalance(tokenName: string, newBalance: number) {
  try {
    const dynamicTokens = await getDynamicAccessTokens();
    const updatedTokens = dynamicTokens.map(token => 
      token.name === tokenName 
        ? { ...token, requiredBalance: newBalance }
        : token
    );
    await writeDynamicAccessTokens(updatedTokens);
  } catch (error) {
    console.error('Error updating dynamic token balance:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const { walletAddress, tokenName, newBalance } = await req.json();

    // Verify BITBOARD•DASH access
    const balances = await fetchOrdAddress(walletAddress);
    const bitboardBalance = balances?.find((token: RuneBalance) => token.name === "BITBOARD•DASH");
    const hasAccess = bitboardBalance && parseInt(bitboardBalance.balance) >= 200000;

    if (!hasAccess) {
      return NextResponse.json({ 
        error: 'Unauthorized. You need at least 200,000 BITBOARD•DASH tokens.' 
      }, { status: 401 });
    }

    try {
      // Update user tokens
      const userTokens = await readUserTokens();
      const tokenIndex = userTokens.findIndex(
        t => t.walletAddress === walletAddress && t.tokenName === tokenName
      );

      if (tokenIndex === -1) {
        return NextResponse.json({ 
          error: 'Token not found or not associated with this address' 
        }, { status: 404 });
      }

      // Update both storage locations
      userTokens[tokenIndex] = {
        ...userTokens[tokenIndex],
        requiredBalance: newBalance
      };

      await Promise.all([
        writeUserTokens(userTokens),
        updateDynamicTokenBalance(tokenName, newBalance)
      ]);

      return NextResponse.json({ 
        success: true,
        token: userTokens[tokenIndex],
        message: "Required Balance updated successfully"
      });

    } catch (fileError) {
      console.error('File operation error:', fileError);
      return NextResponse.json({ 
        error: 'Failed to update token balance' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating token:', error);
    return NextResponse.json({ 
      error: 'Failed to update token balance' 
    }, { status: 500 });
  }
} 