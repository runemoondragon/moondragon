import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { fetchOrdAddress } from '@/lib/runebalance';
import { TokenAssociation } from '@/lib/types';
import { AccessToken } from '@/lib/const';

const USER_TOKENS_PATH = path.join(process.cwd(), 'data', 'user-tokens.json');
const CONST_PATH = path.join(process.cwd(), 'src', 'lib', 'const.ts');

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

async function addToAccessTokens(newToken: AccessToken) {
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

    // Add new token
    const updatedTokens = [...currentTokens, newToken];

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

      // Create new token
      const newToken: TokenAssociation = {
        walletAddress,
        tokenName: name,
        requiredBalance,
        associatedUrl,
        createdAt: new Date()
      };

      // Add to user tokens
      await writeUserTokens([...userTokens, newToken]);

      // Add to ACCESS_TOKENS
      const accessToken: AccessToken = {
        name,
        requiredBalance,
        dashboardPath: `/dashboards/${name.toLowerCase().replace(/[•]/g, '-')}`,
        description: `Access ${name} Dashboard`
      };

      await addToAccessTokens(accessToken);

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