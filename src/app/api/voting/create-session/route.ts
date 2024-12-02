import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { VotingInputData } from '@/lib/types';

const VOTING_INPUT_PATH = path.join(process.cwd(), 'data/voting-input.json');

export async function POST(request: Request) {
  try {
    const { question, startTime, endTime, token, createdBy } = await request.json();
    console.log('Creating session for token:', token);

    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }

    // Read existing data or create new structure
    let votingData: VotingInputData;
    try {
      const content = await fs.readFile(VOTING_INPUT_PATH, 'utf-8');
      votingData = JSON.parse(content);
    } catch (error) {
      votingData = { questions: [] };
    }

    const newQuestion = {
      id: `q${Date.now()}`,
      token,
      question,
      startTime,
      endTime,
      status: 'active' as const,
      createdBy: createdBy || 'system',
      results: {
        yesVotes: 0,
        noVotes: 0,
        totalVoters: 0,
        totalVotingPower: 0,
        hasEnded: false
      }
    };

    // Ensure questions array exists
    if (!votingData.questions) {
      votingData.questions = [];
    }

    votingData.questions.push(newQuestion);
    
    // Write data with proper formatting
    await fs.writeFile(
      VOTING_INPUT_PATH,
      JSON.stringify(votingData, null, 2),
      'utf-8'
    );

    console.log('Successfully saved voting data:', newQuestion);
    return NextResponse.json({ success: true, question: newQuestion });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
