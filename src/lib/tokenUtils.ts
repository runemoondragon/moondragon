import { ACCESS_TOKENS } from './const';

export async function getTokenBalance(address: string) {
  try {
    // Find the YOLO•MOON•RUNES token configuration
    const yoloToken = ACCESS_TOKENS.find(token => token.name === "YOLO•MOON•RUNES");
    
    if (!yoloToken) {
      throw new Error('YOLO•MOON•RUNES token configuration not found');
    }

    // Use the same token balance check endpoint as your main dashboard
    const response = await fetch(`/api/check-token?address=${address}&token=YOLO•MOON•RUNES`);
    if (!response.ok) {
      throw new Error('Failed to fetch token balance');
    }
    
    const data = await response.json();
    
    // Return the actual balance from your token system
    return {
      raw: data.balance || 0,
      formatted: (data.balance || 0).toLocaleString(),
      hasMinimumBalance: (data.balance || 0) >= yoloToken.requiredBalance
    };
  } catch (error) {
    console.error('Error fetching YOLO•MOON•RUNES balance:', error);
    return {
      raw: 0,
      formatted: '0',
      hasMinimumBalance: false
    };
  }
}

// Helper function to get voting power
export async function getVotingPower(address: string): Promise<number> {
  const balance = await getTokenBalance(address);
  return balance.raw;
}

export async function fetchOrdAddress(address: string) {
  try {
    const response = await fetch(`https://api.ordinals.io/runes/address/${address}`);
    if (!response.ok) throw new Error('Failed to fetch rune balances');
    return await response.json();
  } catch (error) {
    console.error('Error fetching rune balances:', error);
    return [];
  }
} 