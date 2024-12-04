import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: { tokenName: string } }
) {
  try {
    const tokenName = params.tokenName;
    const votingDataPath = path.join(process.cwd(), 'data', 'voting-input.json');
    const votingData = JSON.parse(await fs.readFile(votingDataPath, 'utf8'));

    // Filter archived sessions for this token
    const archivedSessions = votingData.questions.filter(
      (q: any) => q.token === tokenName && q.status === 'archived'
    );

    return NextResponse.json({ 
      success: true,
      sessions: archivedSessions 
    });
  } catch (error) {
    console.error('Error fetching archived sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch archived sessions' },
      { status: 500 }
    );
  }
} 