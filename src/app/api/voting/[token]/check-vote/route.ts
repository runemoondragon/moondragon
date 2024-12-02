import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { Vote } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId');
    const walletAddress = searchParams.get('walletAddress');

    if (!questionId || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Load votes
    const votesPath = path.join(process.cwd(), 'data', 'votes.json');
    const votes: Vote[] = JSON.parse(await fs.readFile(votesPath, 'utf8'));

    // Filter votes for this question
    const questionVotes = votes.filter(v => v.questionId === questionId);
    const userVoted = questionVotes.some(v => v.walletAddress === walletAddress);

    // Calculate results
    const results = {
      yesVotes: questionVotes.filter(v => v.choice === 'yes')
        .reduce((sum, v) => sum + v.tokenBalance, 0),
      noVotes: questionVotes.filter(v => v.choice === 'no')
        .reduce((sum, v) => sum + v.tokenBalance, 0),
      totalVoters: questionVotes.length,
      totalVotingPower: questionVotes.reduce((sum, v) => sum + v.tokenBalance, 0),
      hasEnded: false
    };

    return NextResponse.json({
      userVoted,
      results,
      votes: questionVotes
    });
  } catch (error) {
    console.error('Error checking vote:', error);
    return NextResponse.json(
      { error: 'Failed to check vote' },
      { status: 500 }
    );
  }
} 