import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { Vote, VotingQuestion } from '@/lib/types';

const updateVotingResults = async (questionId: string, choice: 'yes' | 'no', tokenBalance: number) => {
  const votingDataPath = path.join(process.cwd(), 'data', 'voting-input.json');
  const votingData = JSON.parse(await fs.readFile(votingDataPath, 'utf8'));
  
  const question = votingData.questions.find((q: any) => q.id === questionId);
  if (question) {
    if (choice === 'yes') {
      question.results.yesVotes = Number(question.results.yesVotes || 0) + Number(tokenBalance);
    } else {
      question.results.noVotes = Number(question.results.noVotes || 0) + Number(tokenBalance);
    }
    question.results.totalVoters = Number(question.results.totalVoters || 0) + 1;
    question.results.totalVotingPower = Number(question.results.totalVotingPower || 0) + Number(tokenBalance);

    question.results = {
      yesVotes: Number(question.results.yesVotes),
      noVotes: Number(question.results.noVotes),
      totalVoters: Number(question.results.totalVoters),
      totalVotingPower: Number(question.results.totalVotingPower),
      hasEnded: question.results.hasEnded
    };
  }
  
  await fs.writeFile(votingDataPath, JSON.stringify(votingData, null, 2));
};

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { walletAddress, choice, questionId, tokenBalance } = await request.json();
    
    // Validate input
    if (!walletAddress || !choice || !questionId || !tokenBalance) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Record vote in votes.json
    const votesPath = path.join(process.cwd(), 'data', 'votes.json');
    const votes = JSON.parse(await fs.readFile(votesPath, 'utf8'));
    votes.push({
      questionId,
      walletAddress,
      choice,
      tokenBalance,
      timestamp: new Date().toISOString()
    });
    await fs.writeFile(votesPath, JSON.stringify(votes, null, 2));

    // Update voting results in voting-input.json
    await updateVotingResults(questionId, choice, tokenBalance);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Voting error:', error);
    return NextResponse.json(
      { error: 'Failed to record vote' },
      { status: 500 }
    );
  }
} 