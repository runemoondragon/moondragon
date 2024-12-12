import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { TokenAssociation } from '@/lib/types';
import { fetchOrdAddress } from '@/lib/runebalance';
import { AccessToken, ACCESS_TOKENS } from '@/lib/const';
import { getDynamicAccessTokens, writeDynamicAccessTokens } from '@/lib/dynamicTokens';

const USER_TOKENS_PATH = path.join(process.cwd(), 'data', 'user-tokens.json');
const CONST_PATH = path.join(process.cwd(), 'src', 'lib', 'const.ts');

interface RuneBalance {
  name: string;
  balance: string;
}

const validateBalance = (balance: any): number => {
  const parsed = parseFloat(balance);
  if (isNaN(parsed)) {
    throw new Error('Invalid balance value');
  }
  return parsed;
};

async function readUserTokens(): Promise<TokenAssociation[]> {
  try {
    console.log('Reading from path:', USER_TOKENS_PATH);
    const content = await fs.readFile(USER_TOKENS_PATH, 'utf-8');
    console.log('Current content:', content);
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading tokens:', error);
    return [];
  }
}

async function writeUserTokens(tokens: TokenAssociation[]) {
  try {
    console.log('Writing to path:', USER_TOKENS_PATH);
    console.log('Writing tokens:', JSON.stringify(tokens, null, 2));
    
    // Ensure data directory exists
    const dataDir = path.dirname(USER_TOKENS_PATH);
    await fs.mkdir(dataDir, { recursive: true });

    // Write tokens with explicit encoding and mode
    await fs.writeFile(
      USER_TOKENS_PATH,
      JSON.stringify(tokens, null, 2),
      { 
        encoding: 'utf8',
        mode: 0o666 // Read/write for everyone
      }
    );

    // Verify write
    const written = await fs.readFile(USER_TOKENS_PATH, 'utf8');
    console.log('Verified written content:', written);
  } catch (error) {
    console.error('Error writing tokens:', error);
    throw error;
  }
}

async function addToAccessTokens(newToken: AccessToken) {
  try {
    const dynamicTokens = await getDynamicAccessTokens();
    dynamicTokens.push(newToken);
    await writeDynamicAccessTokens(dynamicTokens);
  } catch (error) {
    console.error('Error updating dynamic tokens:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { name, requiredBalance, walletAddress } = await request.json();

    // Validate required fields
    if (!name || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Parse and validate required balance
    const parsedBalance = parseInt(String(requiredBalance).replace(/,/g, ''), 10);
    if (isNaN(parsedBalance) || parsedBalance < 0) {
      return NextResponse.json(
        { error: 'Invalid required balance value' },
        { status: 400 }
      );
    }

    // Create token data with parsed balance
    const tokenData: TokenAssociation = {
      tokenName: name,
      requiredBalance: parsedBalance, // Use parsed value
      walletAddress,
      associatedUrl: `/dashboards/${name.toLowerCase().replace(/[•]/g, '-')}`,
      createdAt: new Date()
    };

    // Verify BITBOARD•DASH access
    const balances = await fetchOrdAddress(walletAddress);
    const bitboardBalance = balances?.find((token: RuneBalance) => token.name === "BITBOARD•DASH");
    const hasAccess = bitboardBalance && parseInt(bitboardBalance.balance) >= 200000;

    if (!hasAccess) {
      return NextResponse.json({ 
        error: 'Unauthorized. You need at least 200,000 BITBOARD•DASH tokens.' 
      }, { status: 401 });
    }

    // Check if user already has a token
    const userTokens = await readUserTokens();
    console.log("📚 Current user tokens:", userTokens);

    const existingToken = userTokens.find(t => t.walletAddress === walletAddress);
    if (existingToken) {
      console.log("⚠️ User already has token:", existingToken);
      return NextResponse.json({ 
        error: 'You already have a token registered' 
      }, { status: 400 });
    }

    // Check if token name already exists
    const dynamicTokens = await getDynamicAccessTokens();
    const allTokens = [...ACCESS_TOKENS, ...dynamicTokens];
    const tokenNameExists = allTokens.some(t => t.name === name);
    
    if (tokenNameExists) {
      return NextResponse.json({ 
        error: 'Token name already exists' 
      }, { status: 400 });
    }

    // Create token data for dynamic-tokens.json
    const accessToken: AccessToken = {
      name,
      requiredBalance: parsedBalance,
      dashboardPath: `/dashboards/${name.toLowerCase().replace(/[•]/g, '-')}`,
      description: `Access ${name} Dashboard`,
      externalUrl: tokenData.associatedUrl
    };

    // Save to both storage locations
    try {
      console.log('Starting token save process...');
      const userTokens = await readUserTokens();
      console.log('Current tokens:', userTokens);
      
      const newTokens = [...userTokens, tokenData];
      console.log('New tokens array:', newTokens);
      
      // Save to both locations
      await Promise.all([
        writeUserTokens(newTokens),
        writeDynamicAccessTokens([...dynamicTokens, accessToken])
      ]);
      console.log('Write completed');
      
      // Verify the save
      const verifyTokens = await readUserTokens();
      console.log('Verification read:', verifyTokens);
      
      // Return success response
      return NextResponse.json({ 
        success: true,
        message: "Token added successfully",
        token: tokenData,
        requiresReload: true
      });
    } catch (error) {
      console.error('Detailed save error:', error);
      return NextResponse.json({ 
        error: 'Failed to save token',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Error processing request:', error);
    return NextResponse.json({ 
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 