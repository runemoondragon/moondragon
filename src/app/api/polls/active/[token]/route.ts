import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { PollingData, PollResults } from '@/lib/types/polls';

const pollingInputFile = path.join(process.cwd(), 'data/polling-input.json');

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    // Read polling-input.json
    let pollingData: PollingData = { pollquestions: [] };
    try {
      const content = await fs.readFile(pollingInputFile, 'utf-8');
      pollingData = JSON.parse(content);
    } catch {
      // Return empty array if file doesn't exist yet
      return NextResponse.json({ polls: [] });
    }
    
    // Filter active polls for the specified token
    const activePolls = pollingData.pollquestions.filter((poll: any) => 
      poll.token === decodeURIComponent(params.token) && 
      poll.status === 'active' &&
      new Date(poll.endTime) > new Date()
    );

    // Check for expired polls and update their status
    const now = new Date();
    let needsUpdate = false;

    pollingData.pollquestions = pollingData.pollquestions.map((poll: PollingData['pollquestions'][0]) => {
      if (poll.status === 'active' && new Date(poll.endTime) <= now) {
        needsUpdate = true;
        const { hasEnded, ...otherResults } = poll.results;
        return {
          ...poll,
          status: 'completed',
          results: {
            ...otherResults,
            hasEnded: true
          }
        };
      }
      return poll;
    });

    // Save updates if any polls were marked as completed
    if (needsUpdate) {
      await fs.writeFile(pollingInputFile, JSON.stringify(pollingData, null, 2));
    }

    return NextResponse.json({ polls: activePolls });
  } catch (error) {
    console.error('Failed to fetch polls:', error);
    return NextResponse.json(
      { error: 'Failed to fetch polls', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 