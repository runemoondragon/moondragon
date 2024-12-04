import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { TokenAssociation } from '@/lib/types';
import { fetchOrdAddress, RuneBalance } from '@/lib/runebalance';
import { AccessToken } from '@/lib/const';

const USER_TOKENS_PATH = path.join(process.cwd(), 'data', 'user-tokens.json');
const CONST_PATH = path.join(process.cwd(), 'src', 'lib', 'const.ts');

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

async function updateAccessTokens(tokenName: string, newBalance: number) {
  try {
    const constFile = await fs.readFile(CONST_PATH, 'utf-8');
    
    // Find the ACCESS_TOKENS array in the file
    const startIndex = constFile.indexOf('export const ACCESS_TOKENS: AccessToken[] = [');
    const endIndex = constFile.lastIndexOf('];');
    
    if (startIndex === -1 || endIndex === -1) {
      throw new Error('Could not find ACCESS_TOKENS array in const.ts');
    }

    // Parse existing tokens
    const tokensArrayString = constFile.substring(startIndex, endIndex + 2);
    const currentTokens = eval(tokensArrayString.split('=')[1].trim());

    // Update token balance
    const updatedTokens = currentTokens.map((token: AccessToken) => 
      token.name === tokenName 
        ? { ...token, requiredBalance: newBalance }
        : token
    );

    // Create new file content
    const beforeTokens = constFile.substring(0, startIndex);
    const newTokensString = `export const ACCESS_TOKENS: AccessToken[] = ${JSON.stringify(updatedTokens, null, 2)};`;
    const afterTokens = constFile.substring(endIndex + 2);

    const newFileContent = `${beforeTokens}${newTokensString}${afterTokens}`;

    // Write back to file
    await fs.writeFile(CONST_PATH, newFileContent, 'utf-8');
  } catch (error) {
    console.error('Error updating ACCESS_TOKENS:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const { walletAddress, tokenName, newBalance } = await req.json();

    // Verify BITBOARD•DASH access
    const balances = await fetchOrdAddress(walletAddress);
    const bitboardBalance = balances?.find((token: RuneBalance) => token.name === "BITBOARD•DASH");
    const hasAccess = bitboardBalance && parseInt(bitboardBalance.balance) >= 1000000;

    if (!hasAccess) {
      return NextResponse.json({ 
        error: 'Unauthorized. You need at least 1,000,000 BITBOARD•DASH tokens.' 
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

      // Update both files
      userTokens[tokenIndex] = {
        ...userTokens[tokenIndex],
        requiredBalance: newBalance
      };

      await Promise.all([
        writeUserTokens(userTokens),
        updateAccessTokens(tokenName, newBalance)
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
    console.error('Error updating token balance:', error);
    return NextResponse.json({ 
      error: 'Failed to update token balance' 
    }, { status: 500 });
  }
} 