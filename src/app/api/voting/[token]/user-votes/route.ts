import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const votesPath = path.join(process.cwd(), 'data', 'votes.json');
    const votes = JSON.parse(await fs.readFile(votesPath, 'utf8'));

    // Get all question IDs this user has voted on
    const votedQuestionIds = votes
      .filter((vote: any) => vote.walletAddress === walletAddress)
      .map((vote: any) => vote.questionId);

    return NextResponse.json({ votedQuestionIds });
  } catch (error) {
    console.error('Error fetching user votes:', error);
    return NextResponse.json({ error: 'Failed to fetch user votes' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic' 