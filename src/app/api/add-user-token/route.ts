import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { TokenAssociation } from '@/lib/types';
import { fetchOrdAddress } from '@/lib/runebalance';
import { AccessToken } from '@/lib/const';

const USER_TOKENS_PATH = path.join(process.cwd(), 'data', 'user-tokens.json');
const CONST_PATH = path.join(process.cwd(), 'src', 'lib', 'const.ts');

interface RuneBalance {
  name: string;
  balance: string;
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
  await fs.writeFile(USER_TOKENS_PATH, JSON.stringify(tokens, null, 2));
}

async function addToAccessTokens(newToken: AccessToken) {
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
      
      // Add the new token
      currentTokens.push(newToken);

      // Create the new file content
      const newFileContent = constFile.replace(
        accessTokensRegex,
        `export const ACCESS_TOKENS: AccessToken[] = ${JSON.stringify(currentTokens, null, 2)};`
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

export async function POST(request: Request) {
  try {
    const { name, requiredBalance, walletAddress } = await request.json();

    // Validate required fields
    if (!name || requiredBalance === undefined || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create token data with default dashboard URL
    const tokenData: TokenAssociation = {
      tokenName: name,
      requiredBalance,
      walletAddress,
      associatedUrl: `/dashboards/${name.toLowerCase().replace(/[•]/g, '-')}`,
      createdAt: new Date()
    };

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
      // Check if user already has a token
      const userTokens = await readUserTokens();
      const existingToken = userTokens.find(t => t.walletAddress === walletAddress);
      
      if (existingToken) {
        return NextResponse.json({ 
          error: 'You already have a token registered' 
        }, { status: 400 });
      }

      // Check if token name already exists
      const tokenNameExists = userTokens.some(t => t.tokenName === name);
      if (tokenNameExists) {
        return NextResponse.json({ 
          error: 'Token name already exists' 
        }, { status: 400 });
      }

      // Add to user-tokens.json
      await writeUserTokens([...userTokens, tokenData]);

      // Add to ACCESS_TOKENS in const.ts
      const accessToken: AccessToken = {
        name,
        requiredBalance,
        dashboardPath: `/dashboards/${name.toLowerCase().replace(/[•]/g, '-')}`,
        description: `Access ${name} Dashboard`,
        externalUrl: tokenData.associatedUrl
      };
      
      await addToAccessTokens(accessToken);

      // Clear any cached data
      const headers = new Headers();
      headers.append('Cache-Control', 'no-store, must-revalidate');
      headers.append('Pragma', 'no-cache');
      headers.append('Expires', '0');

      return new NextResponse(
        JSON.stringify({ 
          success: true,
          message: "Token added successfully",
          token: tokenData,
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
        error: 'Failed to add token' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error adding token:', error);
    return NextResponse.json({ 
      error: 'Failed to add token' 
    }, { status: 500 });
  }
} 