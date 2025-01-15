import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { questionId, status, hasEnded } = await request.json();
    
    const votingDataPath = path.join(process.cwd(), 'data', 'voting-input.json');
    const votingData = JSON.parse(await fs.readFile(votingDataPath, 'utf8'));
    
    const question = votingData.questions.find((q: any) => q.id === questionId);
    if (question) {
      question.status = status;
      question.results.hasEnded = hasEnded;

      // Calculate final results
      if (hasEnded) {
        const votesPath = path.join(process.cwd(), 'data', 'votes.json');
        const votes = JSON.parse(await fs.readFile(votesPath, 'utf8'));
        const questionVotes = votes.filter((v: any) => v.questionId === questionId);

        question.results = {
          ...question.results,
          yesVotes: questionVotes
            .filter((v: any) => v.choice === 'yes')
            .reduce((sum: number, v: any) => sum + Number(v.tokenBalance), 0),
          noVotes: questionVotes
            .filter((v: any) => v.choice === 'no')
            .reduce((sum: number, v: any) => sum + Number(v.tokenBalance), 0),
          totalVoters: questionVotes.length,
          totalVotingPower: questionVotes
            .reduce((sum: number, v: any) => sum + Number(v.tokenBalance), 0),
          hasEnded: true
        };
      }

      await fs.writeFile(votingDataPath, JSON.stringify(votingData, null, 2));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Question not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error updating status:', error);
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    );
  }
} 