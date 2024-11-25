import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { TokenAssociation } from '@/lib/types';
import { ACCESS_TOKENS } from '@/lib/const';

const USER_TOKENS_PATH = path.join(process.cwd(), 'data', 'user-tokens.json');

async function readUserTokens(): Promise<TokenAssociation[]> {
  try {
    const content = await fs.readFile(USER_TOKENS_PATH, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');
    const tokenName = searchParams.get('tokenName');

    console.log('Fetching token for:', { address, tokenName });

    if (!address && !tokenName) {
      return NextResponse.json({ error: 'Address or tokenName is required' }, { status: 400 });
    }

    const userTokens = await readUserTokens();
    console.log('All user tokens:', userTokens);

    if (address) {
      const token = userTokens.find(t => t.walletAddress === address);
      console.log('Found token for address:', token);
      
      // Additional validation: check if the token exists in ACCESS_TOKENS
      if (token) {
        console.log('ACCESS_TOKENS:', ACCESS_TOKENS);
        const isValidToken = ACCESS_TOKENS.some(at => at.name === token.tokenName);
        console.log('Is token valid?', isValidToken);
        
        if (!isValidToken) {
          console.log('Token not found in ACCESS_TOKENS, returning null');
          return NextResponse.json({ token: null });
        }
      }
      
      return NextResponse.json({ token: token || null });
    }

    if (tokenName) {
      const token = userTokens.find(t => t.tokenName === tokenName);
      
      // Additional validation for tokenName lookup
      if (token) {
        const isValidToken = ACCESS_TOKENS.some(at => at.name === token.tokenName);
        if (!isValidToken) {
          return NextResponse.json({ token: null });
        }
      }
      
      return NextResponse.json({ token: token || null });
    }

    return NextResponse.json({ token: null });
  } catch (error) {
    console.error('Error fetching user token:', error);
    return NextResponse.json({ error: 'Failed to fetch user token' }, { status: 500 });
  }
} 