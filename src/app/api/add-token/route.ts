import { NextResponse } from 'next/server';
import { AccessToken } from '@/lib/const';
import fs from 'fs/promises';
import path from 'path';
import { fetchOrdAddress } from '@/lib/runebalance';

export async function POST(req: Request) {
  try {
    const { name, symbol, requiredBalance, associatedUrl, adminAddress } = await req.json();

    // Verify RUNE•MOON•DRAGON access
    const balances = await fetchOrdAddress(adminAddress);
    const moonDragonBalance = balances?.find(token => token.name === "RUNE•MOON•DRAGON");
    const hasAccess = moonDragonBalance && parseInt(moonDragonBalance.balance) >= 2000000;

    if (!hasAccess) {
      return NextResponse.json({ 
        error: 'Unauthorized. You need at least 2,000,000 RUNE•MOON•DRAGON tokens to add new tokens.' 
      }, { status: 401 });
    }

    // Validate input
    if (!name || !symbol || !requiredBalance || !associatedUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    try {
      // Read current tokens
      const constPath = path.join(process.cwd(), 'src', 'lib', 'const.ts');
      const constFile = await fs.readFile(constPath, 'utf-8');

      // Extract the existing tokens array
      const startIndex = constFile.indexOf('export const ACCESS_TOKENS: AccessToken[] = [');
      const endIndex = constFile.lastIndexOf('];');
      
      if (startIndex === -1 || endIndex === -1) {
        throw new Error('Could not find ACCESS_TOKENS array in const.ts');
      }

      // Parse existing tokens
      const tokensArrayString = constFile.substring(startIndex, endIndex + 2);
      const currentTokens = eval(tokensArrayString.split('=')[1].trim());

      // Check for duplicates
      if (currentTokens.some((t: AccessToken) => t.name === name)) {
        return NextResponse.json({ error: 'Token already exists' }, { status: 400 });
      }

      // Create new token
      const newToken: AccessToken = {
        name,
        requiredBalance,
        dashboardPath: `/dashboards/${name.toLowerCase().replace(/[•]/g, '-')}`,
        description: `Access ${name} Dashboard`
      };

      // Add new token to array
      const updatedTokens = [...currentTokens, newToken];

      // Create new file content
      const beforeTokens = constFile.substring(0, startIndex);
      const newTokensString = `export const ACCESS_TOKENS: AccessToken[] = ${JSON.stringify(updatedTokens, null, 2)};`;
      const afterTokens = constFile.substring(endIndex + 2);

      const newFileContent = `${beforeTokens}${newTokensString}${afterTokens}`;

      // Write back to file
      await fs.writeFile(constPath, newFileContent, 'utf-8');

      console.log('Successfully added new token:', newToken);

      return NextResponse.json({ 
        success: true, 
        token: newToken,
        message: "Token added successfully!"
      });

    } catch (fileError) {
      console.error('File operation error:', fileError);
      return NextResponse.json({ 
        error: 'Failed to update tokens file' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error adding token:', error);
    return NextResponse.json({ 
      error: 'Failed to add token' 
    }, { status: 500 });
  }
} 