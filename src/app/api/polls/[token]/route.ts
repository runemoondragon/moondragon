import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const pollingInputFile = path.join(process.cwd(), 'data/polling-input.json');

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const token = decodeURIComponent(params.token);
    const { searchParams } = new URL(request.url);
    const archived = searchParams.get('archived') === 'true';
    
    // Read polling data
    const pollingData = JSON.parse(await fs.readFile(pollingInputFile, 'utf8'));

    // First filter for the specific token, then check archived status
    const tokenPolls = pollingData.pollquestions.filter((poll: any) => {
      const isTokenMatch = poll.token === token;
      if (!isTokenMatch) return false;

      if (archived) {
        return poll.status === 'archived';
      }
      return poll.status !== 'archived';
    });

    if (!tokenPolls) {
      return NextResponse.json(
        { error: 'No polls found for this token' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      polls: tokenPolls
    });

  } catch (error) {
    console.error('Failed to fetch polls:', error);
    return NextResponse.json(
      { error: 'Failed to fetch polls' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic' 