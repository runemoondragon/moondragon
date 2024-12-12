import { TokenAssociation } from "@/lib/types";
import fs from 'fs/promises';
import path from 'path';

const USER_TOKENS_PATH = path.join(process.cwd(), 'data', 'user-tokens.json');

export const validateTokenBalance = (
  currentBalance: number,
  requiredBalance: number
): boolean => {
  return currentBalance >= requiredBalance;
};

export const formatTokenBalance = (balance: number): string => {
  return balance.toLocaleString();
};

export const getTokenAssociation = async (
  walletAddress: string,
  tokenName: string
): Promise<TokenAssociation | null> => {
  try {
    const content = await fs.readFile(USER_TOKENS_PATH, 'utf-8');
    const tokens: TokenAssociation[] = JSON.parse(content);
    
    const tokenAssociation = tokens.find(
      t => t.walletAddress === walletAddress && t.tokenName === tokenName
    );

    return tokenAssociation || null;
  } catch (error) {
    console.error('Error getting token association:', error);
    return null;
  }
};

export const updateTokenBalance = async (
  walletAddress: string,
  tokenName: string,
  newBalance: number
): Promise<boolean> => {
  try {
    const content = await fs.readFile(USER_TOKENS_PATH, 'utf-8');
    const tokens: TokenAssociation[] = JSON.parse(content);
    
    const tokenIndex = tokens.findIndex(
      t => t.walletAddress === walletAddress && t.tokenName === tokenName
    );

    if (tokenIndex === -1) {
      return false;
    }

    // Update the balance
    tokens[tokenIndex].requiredBalance = newBalance;

    // Write back to file
    await fs.writeFile(USER_TOKENS_PATH, JSON.stringify(tokens, null, 2));
    return true;
  } catch (error) {
    console.error('Error updating token balance:', error);
    return false;
  }
};

export const getTokenBalance = async (
  walletAddress: string,
  tokenName: string
): Promise<number> => {
  try {
    // Read the user-tokens.json file
    const content = await fs.readFile(USER_TOKENS_PATH, 'utf-8');
    const tokens: TokenAssociation[] = JSON.parse(content);
    
    // Find the token association for this wallet and token
    const tokenAssociation = tokens.find(
      t => t.walletAddress === walletAddress && t.tokenName === tokenName
    );

    if (!tokenAssociation) {
      return 0;
    }

    return tokenAssociation.requiredBalance;
  } catch (error) {
    console.error('Error getting token balance:', error);
    return 0;
  }
}; 