import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { TokenAssociation } from '@/lib/types';
import { fetchOrdAddress } from '@/lib/runebalance';
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

async function removeFromAccessTokens(tokenName: string) {
  try {
    const constFile = await fs.readFile(CONST_PATH, 'utf-8');
    
    // Use regex to find and update the ACCESS_TOKENS array
    const accessTokensRegex = /export const ACCESS_TOKENS: AccessToken\[] = (\[[\s\S]*?\]);/;
    const match = constFile.match(accessTokensRegex);
    
    if (!match) {
      throw new Error('Could not find ACCESS_TOKENS array in const.ts');
    }

    try {
      // Parse the existing tokens array
      const currentTokens = JSON.parse(match[1].replace(/'/g, '"'));
      
      // Remove the token
      const updatedTokens = currentTokens.filter((token: AccessToken) => token.name !== tokenName);

      // Create the new file content
      const newFileContent = constFile.replace(
        accessTokensRegex,
        `export const ACCESS_TOKENS: AccessToken[] = ${JSON.stringify(updatedTokens, null, 2)};`
      );

      // Write back to file
      await fs.writeFile(CONST_PATH, newFileContent, 'utf-8');
      
    } catch (parseError) {
      console.error('Error parsing ACCESS_TOKENS:', parseError);
      throw new Error('Failed to parse ACCESS_TOKENS array');
    }
  } catch (error) {
    console.error('Error updating ACCESS_TOKENS:', error);
    throw error;
  }
}

export async function DELETE(req: Request) {
  try {
    const { walletAddress, tokenName } = await req.json();

    if (!walletAddress || !tokenName) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Verify BITBOARD•DASH access
    const balances = await fetchOrdAddress(walletAddress);
    const bitboardBalance = balances?.find((token: { name: string, balance: string }) => 
      token.name === "BITBOARD•DASH"
    );
    const hasAccess = bitboardBalance && parseInt(bitboardBalance.balance) >= 200000;

    if (!hasAccess) {
      return NextResponse.json({ 
        error: 'Unauthorized. You need at least 200,000 BITBOARD•DASH tokens.' 
      }, { status: 401 });
    }

    try {
      // Update user tokens
      const userTokens = await readUserTokens();
      
      // Remove the token from user-tokens.json
      const updatedTokens = userTokens.filter(
        t => !(t.walletAddress === walletAddress && t.tokenName === tokenName)
      );
      await writeUserTokens(updatedTokens);

      // Remove from ACCESS_TOKENS in const.ts
      await removeFromAccessTokens(tokenName);

      // Clear any cached data
      const headers = new Headers();
      headers.append('Cache-Control', 'no-store, must-revalidate');
      headers.append('Pragma', 'no-cache');
      headers.append('Expires', '0');

      return new NextResponse(
        JSON.stringify({ 
          success: true,
          message: "Token deleted successfully",
          requiresReload: true
        }),
        { 
          status: 200,
          headers
        }
      );

    } catch (fileError) {
      console.error('File operation error:', fileError);
      return NextResponse.json({ 
        error: 'Failed to delete token' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 