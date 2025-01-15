import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { TokenAssociation } from '@/lib/types';

const USER_TOKENS_PATH = path.join(process.cwd(), 'data', 'user-tokens.json');

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    // Read user tokens
    const content = await fs.readFile(USER_TOKENS_PATH, 'utf-8');
    const tokens: TokenAssociation[] = JSON.parse(content);
    
    // Find token for address
    const token = tokens.find(t => t.walletAddress === address);

    return NextResponse.json({ token: token || null });
  } catch (error) {
    console.error('Error fetching user token:', error);
    return NextResponse.json({ token: null }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic' 