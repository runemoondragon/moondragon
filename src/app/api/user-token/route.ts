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
    // If file doesn't exist or is empty, return empty array
    return [];
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const userTokens = await readUserTokens();
    const token = userTokens.find(t => t.walletAddress === address);

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error fetching user token:', error);
    return NextResponse.json({ error: 'Failed to fetch user token' }, { status: 500 });
  }
} 