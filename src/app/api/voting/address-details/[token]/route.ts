import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    // Read only necessary data files
    const votesPath = path.join(process.cwd(), 'data', 'votes.json');
    const votingInputPath = path.join(process.cwd(), 'data', 'voting-input.json');

    const [votesData, votingInputData] = await Promise.all([
      fs.readFile(votesPath, 'utf8').then(JSON.parse),
      fs.readFile(votingInputPath, 'utf8').then(JSON.parse)
    ]);

    // First, get all question IDs associated with this token
    const tokenQuestions = votingInputData.questions.filter(
      (q: any) => q.token === params.token
    ).map((q: any) => q.id);

    // Filter votes for only the questions associated with this token
    const relevantVotes = votesData.filter(
      (vote: any) => tokenQuestions.includes(vote.questionId)
    );

    // Group votes by questionId
    const groupedVotes: { [key: string]: { questionText: string; votes: any[] } } = {};
    
    relevantVotes.forEach((vote: any) => {
      if (!groupedVotes[vote.questionId]) {
        const questionData = votingInputData.questions.find(
          (q: any) => q.id === vote.questionId
        );
        groupedVotes[vote.questionId] = {
          questionText: questionData?.question || 'Unknown Question',
          votes: []
        };
      }

      groupedVotes[vote.questionId].votes.push({
        walletAddress: vote.walletAddress,
        choice: vote.choice,
        tokenBalance: vote.tokenBalance,
        timestamp: vote.timestamp
      });
    });

    return NextResponse.json({ 
      votes: groupedVotes,
      success: true 
    });
  } catch (error) {
    console.error('Error fetching vote details:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch voting details',
        success: false 
      },
      { status: 500 }
    );
  }
}