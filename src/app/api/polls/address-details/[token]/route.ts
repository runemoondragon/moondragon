import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    // Read all necessary data files
    const pollsPath = path.join(process.cwd(), 'data', 'polling-input.json');
    const votesPath = path.join(process.cwd(), 'data', 'polls.json');

    const [pollsData, votesData] = await Promise.all([
      fs.readFile(pollsPath, 'utf8').then(JSON.parse),
      fs.readFile(votesPath, 'utf8').then(JSON.parse).catch(() => [])
    ]);

    // Get all polls for this token
    const tokenPolls = pollsData.pollquestions.filter(
      (poll: any) => poll.token === decodeURIComponent(params.token)
    );

    // Filter votes to only include those for this token's polls
    const relevantVotes = votesData.filter((vote: any) => {
      const pollBelongsToToken = tokenPolls.some((poll: { id: string }) => poll.id === vote.pollId);
      return pollBelongsToToken;
    });

    // Group votes by pollId
    const groupedVotes: { [key: string]: { pollQuestion: string; votes: any[] } } = {};
    
    relevantVotes.forEach((vote: any) => {
      if (!groupedVotes[vote.pollId]) {
        const pollData = tokenPolls.find((p: any) => p.id === vote.pollId);
        groupedVotes[vote.pollId] = {
          pollQuestion: pollData?.pollQuestion || 'Unknown Poll',
          votes: []
        };
      }

      groupedVotes[vote.pollId].votes.push({
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
    console.error('Error fetching poll details:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch poll details',
        success: false 
      },
      { status: 500 }
    );
  }
} 