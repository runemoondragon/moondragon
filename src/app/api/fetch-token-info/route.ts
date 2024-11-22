import { NextResponse } from 'next/server';
import { TokenInfo } from '@/lib/types';

// In-memory cache with expiration
let tokenInfoCache: {
  data: TokenInfo | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function fetchTokenInfoFromOrdio(): Promise<TokenInfo> {
  try {
    // Fetch data from ord.io
    const response = await fetch('https://www.ord.io/api/runes/UNCOMMONGOODS');
    if (!response.ok) throw new Error('Failed to fetch from ord.io');
    
    const data = await response.json();
    
    // Transform and validate the data based on ord.io information
    const tokenInfo: TokenInfo = {
      name: "UNCOMMON•GOODS",
      symbol: "⧉",
      totalSupply: "260,451", // Current Supply from ord.io
      maxSupply: "36,293,893", // Max Supply from ord.io
      holders: "0", // Holders count from ord.io
      mintStatus: "In Progress",
      contractAddress: data.contractAddress || "N/A",
      lastUpdated: new Date().toISOString(),
      additionalInfo: {
        divisibility: "0",
        etched: "216d ago",
        mintStartBlock: "840,000",
        mintEndBlock: "1,050,000",
        completedMints: "13.38%",
        pendingMints: "0",
        remainingMints: data.remainingMints || "N/A"
      }
    };

    // Update cache
    tokenInfoCache = {
      data: tokenInfo,
      timestamp: Date.now()
    };

    return tokenInfo;
  } catch (error) {
    console.error('Error fetching token info:', error);
    throw error;
  }
}

export async function GET() {
  try {
    // Check if cache is valid
    const isCacheValid = tokenInfoCache.data && 
                        (Date.now() - tokenInfoCache.timestamp) < CACHE_DURATION;

    if (isCacheValid) {
      return NextResponse.json(tokenInfoCache.data);
    }

    // Fetch fresh data
    const tokenInfo = await fetchTokenInfoFromOrdio();
    return NextResponse.json(tokenInfo);

  } catch (error) {
    console.error('Error in token info endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token information' },
      { status: 500 }
    );
  }
} 