import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { TokenAssociation } from '@/lib/types';
import { fetchOrdAddress } from '@/lib/runebalance';
import { getDynamicAccessTokens, writeDynamicAccessTokens } from '@/lib/dynamicTokens';

const USER_TOKENS_PATH = path.join(process.cwd(), 'data', 'user-tokens.json');
const DASHBOARDS_PATH = path.join(process.cwd(), 'src', 'app', 'dashboards');

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

async function removeFromDynamicTokens(tokenName: string) {
  try {
    const dynamicTokens = await getDynamicAccessTokens();
    const updatedTokens = dynamicTokens.filter(token => token.name !== tokenName);
    await writeDynamicAccessTokens(updatedTokens);
  } catch (error) {
    console.error('Error removing from dynamic tokens:', error);
    throw error;
  }
}

async function removeDashboardFolder(tokenName: string) {
  try {
    const folderName = tokenName.toLowerCase().replace(/[•]/g, '-');
    const dashboardPath = path.join(DASHBOARDS_PATH, folderName);
    
    // Check if directory exists before attempting to remove
    try {
      await fs.access(dashboardPath);
    } catch {
      console.log(`Dashboard folder ${folderName} doesn't exist`);
      return;
    }

    // Remove directory and its contents recursively
    const removeDir = async (dirPath: string) => {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      await Promise.all(entries.map(async (entry) => {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          await removeDir(fullPath);
        } else {
          await fs.unlink(fullPath);
        }
      }));
      
      await fs.rmdir(dirPath);
    };

    await removeDir(dashboardPath);
    console.log(`Successfully removed dashboard folder: ${folderName}`);
  } catch (error) {
    console.error('Error removing dashboard folder:', error);
    throw error;
  }
}

export async function DELETE(req: Request) {
  try {
    const { walletAddress, tokenName } = await req.json();

    if (!walletAddress || !tokenName) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Verify BITBOARD•DASH access
    const balances = await fetchOrdAddress(walletAddress);
    const bitboardBalance = balances?.find((token: RuneBalance) => token.name === "BITBOARD•DASH");
    const hasAccess = bitboardBalance && parseInt(bitboardBalance.balance) >= 200000;

    if (!hasAccess) {
      return NextResponse.json({ 
        error: 'Unauthorized. You need at least 200,000 BITBOARD•DASH tokens.' 
      }, { status: 401 });
    }

    try {
      // Update user tokens
      const userTokens = await readUserTokens();
      const updatedTokens = userTokens.filter(
        t => !(t.walletAddress === walletAddress && t.tokenName === tokenName)
      );
      
      // Remove from all storage locations and delete dashboard folder
      await Promise.all([
        writeUserTokens(updatedTokens),
        removeFromDynamicTokens(tokenName),
        removeDashboardFolder(tokenName)
      ]);

      return NextResponse.json({ 
        success: true,
        message: "Token and associated dashboard deleted successfully",
        requiresReload: true
      });

    } catch (fileError) {
      console.error('File operation error:', fileError);
      return NextResponse.json({ 
        error: 'Failed to delete token and dashboard' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error deleting token:', error);
    return NextResponse.json({ 
      error: 'Failed to delete token and dashboard' 
    }, { status: 500 });
  }
} 