import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PollingData, PollResults } from '@/lib/types/polls';

const pollingInputFile = path.join(process.cwd(), 'data/polling-input.json');

export async function POST(request: Request) {
  try {
    const { question, options, endTime, tokenName, createdBy } = await request.json();

    // Validate input
    if (!question || !options || !endTime || !tokenName) {
      return NextResponse.json(
        { error: 'Invalid poll data' },
        { status: 400 }
      );
    }

    // Ensure data directory exists
    await fs.mkdir(path.dirname(pollingInputFile), { recursive: true });

    // Read or initialize polling-input.json
    let pollingData: PollingData = { pollquestions: [] };
    try {
      const content = await fs.readFile(pollingInputFile, 'utf-8');
      pollingData = JSON.parse(content);
    } catch {
      console.log('Creating new polling-input file');
    }

    const pollId = `p${Date.now()}`;
    const newPoll: PollingData['pollquestions'][0] = {
      id: pollId,
      token: tokenName,
      pollQuestion: question,
      options: options,
      startTime: new Date().toISOString(),
      endTime: new Date(endTime).toISOString(),
      status: 'active',
      createdBy: createdBy || 'anonymous',
      results: {
        ...Object.fromEntries(options.map((_: string, index: number) => [`poll${index + 1}`, 0])),
        totalVoters: 0,
        totalVotingPower: 0,
        hasEnded: false,
        voters: []
      } as PollResults
    };

    // Ensure pollquestions array exists
    pollingData.pollquestions = pollingData.pollquestions || [];
    pollingData.pollquestions.push(newPoll);

    // Save updated polling data
    await fs.writeFile(pollingInputFile, JSON.stringify(pollingData, null, 2));

    return NextResponse.json({ success: true, poll: newPoll });
  } catch (error) {
    console.error('Failed to create poll:', error);
    return NextResponse.json(
      { error: 'Failed to create poll' },
      { status: 500 }
    );
  }
} 