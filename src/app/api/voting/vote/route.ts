import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { Vote, VotingResults } from '@/lib/types';
import { fetchOrdAddress } from '@/lib/runebalance';

const VOTES_PATH = path.join(process.cwd(), 'data', 'votes.json');

async function readVotes(): Promise<Vote[]> {
  try {
    const content = await fs.readFile(VOTES_PATH, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function writeVotes(votes: Vote[]) {
  await fs.writeFile(VOTES_PATH, JSON.stringify(votes, null, 2));
}

export async function POST(req: Request) {
  try {
    const { questionId, walletAddress, choice } = await req.json();

    // Verify token balance
    const balances = await fetchOrdAddress(walletAddress);
    const tokenBalance = balances?.find(token => token.name === "YOLO•MOON•RUNES");
    
    if (!tokenBalance) {
      return NextResponse.json({ 
        error: 'You need YOLO•MOON•RUNES tokens to vote.' 
      }, { status: 401 });
    }

    const votes = await readVotes();
    
    // Check if user already voted
    if (votes.some(v => v.walletAddress === walletAddress && v.questionId === questionId)) {
      return NextResponse.json({ 
        error: 'You have already voted on this question.' 
      }, { status: 400 });
    }

    const newVote: Vote = {
      questionId,
      walletAddress,
      choice,
      tokenBalance: parseInt(tokenBalance.balance),
      timestamp: new Date()
    };

    await writeVotes([...votes, newVote]);

    return NextResponse.json({ success: true, vote: newVote });
  } catch (error) {
    console.error('Error recording vote:', error);
    return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const questionId = searchParams.get('questionId');

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    const votes = await readVotes();
    const questionVotes = votes.filter(v => v.questionId === questionId);

    const yesVotes = questionVotes
      .filter(v => v.choice === 'yes')
      .reduce((sum, v) => sum + v.tokenBalance, 0);

    const noVotes = questionVotes
      .filter(v => v.choice === 'no')
      .reduce((sum, v) => sum + v.tokenBalance, 0);

    let winner: 'yes' | 'no' | 'tie' | null = null;
    if (yesVotes > noVotes) winner = 'yes';
    else if (noVotes > yesVotes) winner = 'no';
    else if (yesVotes === noVotes && yesVotes > 0) winner = 'tie';

    const results: VotingResults = {
      yesVotes,
      noVotes,
      totalVoters: questionVotes.length,
      winner,
      hasEnded: true // You'll need to check this against the question's endTime
    };

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
  }
} 