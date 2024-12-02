import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId');

    if (!questionId) {
      return NextResponse.json(
        { error: 'Question ID is required' },
        { status: 400 }
      );
    }

    const votesPath = path.join(process.cwd(), 'data', 'votes.json');
    const votes = JSON.parse(await fs.readFile(votesPath, 'utf8'));

    // Filter votes for this question
    const questionVotes = votes.filter((vote: any) => vote.questionId === questionId);

    // Calculate results
    const results = {
      yesVotes: questionVotes.filter((v: any) => v.choice === 'yes').length,
      noVotes: questionVotes.filter((v: any) => v.choice === 'no').length,
      totalVoters: questionVotes.length,
      totalVotingPower: questionVotes.reduce((sum: number, vote: any) => sum + vote.tokenBalance, 0)
    };

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
  }
} 