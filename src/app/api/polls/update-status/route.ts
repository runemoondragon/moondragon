import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const pollingInputFile = path.join(process.cwd(), 'data/polling-input.json');

export async function POST(request: Request) {
  try {
    const { pollId, token, status, hasEnded } = await request.json();

    if (!pollId || !token || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const pollingData = JSON.parse(await fs.readFile(pollingInputFile, 'utf8'));
    const pollIndex = pollingData.pollquestions.findIndex(
      (p: any) => p.id === pollId && p.token === token
    );

    if (pollIndex === -1) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    pollingData.pollquestions[pollIndex].status = status;
    if (hasEnded !== undefined) {
      pollingData.pollquestions[pollIndex].results.hasEnded = hasEnded;
    }

    await fs.writeFile(pollingInputFile, JSON.stringify(pollingData, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Poll status updated successfully'
    });

  } catch (error) {
    console.error('Failed to update poll status:', error);
    return NextResponse.json(
      { error: 'Failed to update poll status' },
      { status: 500 }
    );
  }
} 