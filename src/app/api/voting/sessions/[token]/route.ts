import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const votingDataPath = path.join(process.cwd(), 'data', 'voting-input.json');
    const votingData = JSON.parse(await fs.readFile(votingDataPath, 'utf8'));
    
    // Filter questions for this token and ensure we always return an array
    const questions = (votingData.questions || []).filter(
      (q: any) => q.token === decodeURIComponent(params.token)
    );

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error fetching voting sessions:', error);
    // Return empty questions array on error
    return NextResponse.json({ questions: [] });
  }
}

export const dynamic = 'force-dynamic' 