import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { tokenName, questionId } = await request.json();
    
    if (!tokenName || !questionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const votingDataPath = path.join(process.cwd(), 'data', 'voting-input.json');
    const votingData = JSON.parse(await fs.readFile(votingDataPath, 'utf8'));
    
    const questionIndex = votingData.questions.findIndex(
      (q: any) => q.id === questionId && q.token === tokenName
    );

    if (questionIndex === -1) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Update the status to archived
    votingData.questions[questionIndex].status = 'archived';
    
    await fs.writeFile(
      votingDataPath,
      JSON.stringify(votingData, null, 2),
      'utf8'
    );

    return NextResponse.json({ 
      success: true,
      message: 'Session archived successfully' 
    });
  } catch (error) {
    console.error('Error archiving session:', error);
    return NextResponse.json(
      { error: 'Failed to archive session' },
      { status: 500 }
    );
  }
} 