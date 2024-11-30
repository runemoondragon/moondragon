import { NextResponse } from 'next/server';
import { fetchOrdAddress } from '@/lib/runebalance';
import { Vote, VotingResults } from '@/lib/types';
import fs from 'fs/promises';
import path from 'path';

const VOTES_PATH = path.join(process.cwd(), 'data', 'votes.json');

async function readVotes(): Promise<Vote[]> {
  try {
    const content = await fs.readFile(VOTES_PATH, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
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

    // Calculate total votes for each choice
    const yesVotes = questionVotes
      .filter(v => v.choice === 'yes')
      .reduce((sum, v) => sum + v.tokenBalance, 0);

    const noVotes = questionVotes
      .filter(v => v.choice === 'no')
      .reduce((sum, v) => sum + v.tokenBalance, 0);

    const totalVotingPower = yesVotes + noVotes;

    console.log('Vote calculation:', {
      questionVotes,
      yesVotes,
      noVotes,
      totalVotingPower
    });

    return NextResponse.json({
      votes: questionVotes,
      results: {
        yesVotes,
        noVotes,
        totalVoters: questionVotes.length,
        totalVotingPower,
        winningChoice: yesVotes > noVotes ? 'yes' : noVotes > yesVotes ? 'no' : undefined,
        hasEnded: false
      }
    });
  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json({ 
      votes: [],
      results: {
        yesVotes: 0,
        noVotes: 0,
        totalVoters: 0,
        totalVotingPower: 0,
        winningChoice: undefined,
        hasEnded: false
      }
    });
  }
}

export async function POST(request: Request) {
  try {
    const { questionId, walletAddress, choice } = await request.json();

    // Verify token ownership and get balance
    const balances = await fetchOrdAddress(walletAddress);
    const yoloToken = balances?.find((token: { name: string, balance: string }) => 
      token.name === 'YOLO•MOON•RUNES'
    );
    
    if (!yoloToken) {
      return NextResponse.json({ error: 'No YOLO•MOON•RUNES tokens found' }, { status: 403 });
    }

    const votes = await readVotes();
    
    // Check if user already voted
    if (votes.some(v => v.questionId === questionId && v.walletAddress === walletAddress)) {
      return NextResponse.json({ error: 'Already voted' }, { status: 400 });
    }

    // Add new vote with token balance
    const newVote: Vote = {
      questionId,
      walletAddress,
      choice,
      tokenBalance: parseInt(yoloToken.balance),
      timestamp: new Date().toISOString()
    };

    votes.push(newVote);
    await fs.writeFile(VOTES_PATH, JSON.stringify(votes, null, 2));

    // Calculate and return updated results
    const questionVotes = votes.filter(v => v.questionId === questionId);
    const yesVotes = questionVotes
      .filter(v => v.choice === 'yes')
      .reduce((sum, v) => sum + v.tokenBalance, 0);
    const noVotes = questionVotes
      .filter(v => v.choice === 'no')
      .reduce((sum, v) => sum + v.tokenBalance, 0);

    const results: VotingResults = {
      yesVotes,
      noVotes,
      totalVoters: questionVotes.length,
      totalVotingPower: yesVotes + noVotes,
      winningChoice: yesVotes > noVotes ? 'yes' : noVotes > yesVotes ? 'no' : undefined,
      hasEnded: false
    };

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 