import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const pollingInputFile = path.join(process.cwd(), 'data/polling-input.json');

export async function POST(request: Request) {
  try {
    const { pollId, token } = await request.json();

    if (!pollId || !token) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Read current polling data
    const pollingData = JSON.parse(await fs.readFile(pollingInputFile, 'utf8'));
    
    // Find the poll to archive
    const pollIndex = pollingData.pollquestions.findIndex(
      (p: any) => p.id === pollId && p.token === token
    );

    if (pollIndex === -1) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    // Update poll status to archived
    pollingData.pollquestions[pollIndex].status = 'archived';

    // Calculate final results before archiving
    const poll = pollingData.pollquestions[pollIndex];
    const results = poll.results;
    
    // Find the winning option
    let maxVotes = 0;
    let winningOptionIndex = 0;

    poll.options.forEach((option: string, index: number) => {
      const votes = results[`poll${index + 1}`] || 0;
      if (votes > maxVotes) {
        maxVotes = votes;
        winningOptionIndex = index;
      }
    });

    // Calculate winning percentage
    const winningPercentage = results.totalVotingPower > 0
      ? (maxVotes / results.totalVotingPower) * 100
      : 0;

    // Add winner information to results
    pollingData.pollquestions[pollIndex].results = {
      ...results,
      winner: poll.options[winningOptionIndex],
      winningPercentage,
      hasEnded: true
    };

    // Save updated data
    await fs.writeFile(pollingInputFile, JSON.stringify(pollingData, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Poll archived successfully'
    });

  } catch (error) {
    console.error('Failed to archive poll:', error);
    return NextResponse.json(
      { error: 'Failed to archive poll', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 