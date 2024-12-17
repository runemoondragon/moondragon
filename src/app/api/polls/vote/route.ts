import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const pollsFile = path.join(process.cwd(), 'data/polls.json');
const pollingInputFile = path.join(process.cwd(), 'data/polling-input.json');

const updatePollingResults = async (pollId: string, optionIndex: number, tokenBalance: number, walletAddress: string) => {
  const pollingData = JSON.parse(await fs.readFile(pollingInputFile, 'utf8'));
  const poll = pollingData.pollquestions.find((p: any) => p.id === pollId);
  
  if (poll) {
    // Convert string to number if needed and add vote
    const choiceKey = `poll${optionIndex + 1}`;
    poll.results[choiceKey] = Number(poll.results[choiceKey] || 0) + Number(tokenBalance);
    poll.results.totalVoters = Number(poll.results.totalVoters || 0) + 1;
    poll.results.totalVotingPower = Number(poll.results.totalVotingPower || 0) + Number(tokenBalance);

    // Ensure all numbers are properly stored
    poll.results = {
      ...poll.results,
      [choiceKey]: Number(poll.results[choiceKey]),
      totalVoters: Number(poll.results.totalVoters),
      totalVotingPower: Number(poll.results.totalVotingPower),
      hasEnded: poll.results.hasEnded,
      voters: [...(poll.results.voters || []), walletAddress]
    };
  }
  
  await fs.writeFile(pollingInputFile, JSON.stringify(pollingData, null, 2));
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received vote request:', body);

    const { pollId, optionId, walletAddress, votingPower } = body;
    
    // Extract the numeric choice from optionId (e.g., 'poll1' -> 0)
    const choice = parseInt(optionId.replace('poll', '')) - 1;
    
    // Detailed validation logging
    if (!pollId) console.log('Missing pollId');
    if (optionId === undefined) console.log('Missing optionId');
    if (!walletAddress) console.log('Missing walletAddress');
    if (!votingPower) console.log('Missing votingPower');

    if (!pollId || optionId === undefined || !walletAddress || !votingPower) {
      return NextResponse.json(
        { error: 'Missing required fields', details: { pollId, optionId, walletAddress, votingPower } },
        { status: 400 }
      );
    }

    // Validate poll exists
    const pollingData = JSON.parse(await fs.readFile(pollingInputFile, 'utf8'));
    const poll = pollingData.pollquestions.find((p: any) => p.id === pollId);
    
    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    // Validate choice is within range
    if (isNaN(choice) || choice < 0 || choice >= poll.options.length) {
      return NextResponse.json(
        { error: 'Invalid option ID', details: { optionId, choice } },
        { status: 400 }
      );
    }

    // Read or initialize polls.json
    let votes = [];
    try {
      const content = await fs.readFile(pollsFile, 'utf8');
      votes = JSON.parse(content);
    } catch (error) {
      console.log('Initializing votes file');
      await fs.writeFile(pollsFile, JSON.stringify([]));
    }

    // Check if user already voted
    if (votes.some((vote: any) => vote.pollId === pollId && vote.walletAddress === walletAddress)) {
      return NextResponse.json(
        { error: 'Already voted' },
        { status: 400 }
      );
    }

    // Record vote in polls.json
    const voteRecord = {
      pollId,
      walletAddress,
      choice: optionId,
      tokenBalance: Number(votingPower),
      timestamp: new Date().toISOString()
    };
    
    console.log('Recording vote:', voteRecord);
    
    votes.push(voteRecord);
    await fs.writeFile(pollsFile, JSON.stringify(votes, null, 2));

    // Update poll results (only once)
    await updatePollingResults(pollId, choice, Number(votingPower), walletAddress);

    return NextResponse.json({ 
      success: true,
      message: 'Vote recorded successfully'
    });
  } catch (error) {
    console.error('Failed to record vote:', error);
    return NextResponse.json(
      { error: 'Failed to record vote', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 