import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { TokenAssociation } from '@/lib/types';

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

    const userTokens = await readUserTokens();

    if (address) {
      const token = userTokens.find(t => t.walletAddress === address);
      return NextResponse.json({ token });
    }

    if (tokenName) {
      const token = userTokens.find(t => t.tokenName === tokenName);
      return NextResponse.json({ token });
    }

    return NextResponse.json({ error: 'Address or tokenName is required' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching user token:', error);
    return NextResponse.json({ error: 'Failed to fetch user token' }, { status: 500 });
  }
} 