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
    
    // Find the ACCESS_TOKENS array in the file
    const startIndex = constFile.indexOf('export const ACCESS_TOKENS: AccessToken[] = [');
    const endIndex = constFile.lastIndexOf('];');
    
    if (startIndex === -1 || endIndex === -1) {
      throw new Error('Could not find ACCESS_TOKENS array in const.ts');
    }

    // Parse existing tokens
    const tokensArrayString = constFile.substring(startIndex, endIndex + 2);
    const currentTokens = eval(tokensArrayString.split('=')[1].trim());

    // Remove the token
    const updatedTokens = currentTokens.filter((token: AccessToken) => token.name !== tokenName);

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

export async function DELETE(req: Request) {
  try {
    const { walletAddress, tokenName } = await req.json();

    // Verify RUNE•MOON•DRAGON access
    const balances = await fetchOrdAddress(walletAddress);
    const moonDragonBalance = balances?.find(token => token.name === "RUNE•MOON•DRAGON");
    const hasAccess = moonDragonBalance && parseInt(moonDragonBalance.balance) >= 2000000;

    if (!hasAccess) {
      return NextResponse.json({ 
        error: 'Unauthorized. You need at least 2,000,000 RUNE•MOON•DRAGON tokens.' 
      }, { status: 401 });
    }

    try {
      // Update user tokens
      const userTokens = await readUserTokens();
      const updatedTokens = userTokens.filter(
        t => !(t.walletAddress === walletAddress && t.tokenName === tokenName)
      );

      // Remove from both files
      await Promise.all([
        writeUserTokens(updatedTokens),
        removeFromAccessTokens(tokenName)
      ]);

      // Force reload the application to update the token list
      return NextResponse.json({ 
        success: true,
        message: "Token deleted successfully",
        requiresReload: true
      });

    } catch (fileError) {
      console.error('File operation error:', fileError);
      return NextResponse.json({ 
        error: 'Failed to delete token' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error deleting token:', error);
    return NextResponse.json({ 
      error: 'Failed to delete token' 
    }, { status: 500 });
  }
} 