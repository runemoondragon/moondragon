import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface Question {
  id: string;
  token: string;
  question: string;
  startTime: string;
  endTime: string;
  status: string;
  results: {
    yesVotes: number;
    noVotes: number;
    totalVoters: number;
    totalVotingPower: number;
    hasEnded: boolean;
  };
}

interface Vote {
  questionId: string;
  walletAddress: string;
  choice: 'yes' | 'no';
  tokenBalance: number;
  timestamp: string;
}

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const votingDataPath = path.join(process.cwd(), 'data', 'voting-input.json');
    const votingData = JSON.parse(await fs.readFile(votingDataPath, 'utf8'));
    
    // Find questions for this token
    const questions = votingData.questions.filter((q: Question) => q.token === params.token);
    return NextResponse.json({ questions });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch voting data' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { walletAddress, choice, questionId } = await request.json();
    
    // Validate input
    if (!walletAddress || !choice || !questionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if question exists and belongs to this token
    const votingDataPath = path.join(process.cwd(), 'data', 'voting-input.json');
    const votingData = JSON.parse(await fs.readFile(votingDataPath, 'utf8'));
    const question = votingData.questions.find(
      (q: Question) => q.id === questionId && q.token === params.token
    );

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }
    
    const votesPath = path.join(process.cwd(), 'data', 'votes.json');
    const votes: Vote[] = JSON.parse(await fs.readFile(votesPath, 'utf8'));
    
    // Check if user has already voted
    const hasVoted = votes.some(
      vote => vote.questionId === questionId && vote.walletAddress === walletAddress
    );

    if (hasVoted) {
      return NextResponse.json(
        { error: 'User has already voted' },
        { status: 400 }
      );
    }
    
    // Get user's token balance
    const tokenBalance = await getUserTokenBalance(walletAddress, params.token);
    
    // Add new vote
    const newVote: Vote = {
      questionId,
      walletAddress,
      choice,
      tokenBalance,
      timestamp: new Date().toISOString()
    };
    
    votes.push(newVote);
    
    await fs.writeFile(votesPath, JSON.stringify(votes, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Voting error:', error);
    return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 });
  }
}

async function getUserTokenBalance(walletAddress: string, token: string): Promise<number> {
  try {
    const userTokensPath = path.join(process.cwd(), 'data', 'user-tokens.json');
    const userTokens = JSON.parse(await fs.readFile(userTokensPath, 'utf8'));
    
    // Find user's balance for this token
    const userBalance = userTokens.find(
      (entry: any) => entry.walletAddress === walletAddress && entry.token === token
    );
    
    return userBalance?.balance || 0;
  } catch (error) {
    console.error('Error getting user token balance:', error);
    return 0;
  }
} 