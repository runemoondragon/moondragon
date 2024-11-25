import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { VotingQuestion } from '@/lib/types';

const QUESTIONS_PATH = path.join(process.cwd(), 'data', 'voting-questions.json');

async function readQuestions(): Promise<VotingQuestion[]> {
  try {
    const content = await fs.readFile(QUESTIONS_PATH, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const questions = await readQuestions();
    const now = new Date();
    
    // Find active question and check time
    const activeQuestion = questions.find(q => {
      if (!q.isActive) return false;
      
      const startTime = new Date(q.startTime);
      const endTime = new Date(q.endTime);
      
      // Convert all times to UTC timestamps for comparison
      const nowTime = now.getTime();
      const startTimeMs = startTime.getTime();
      const endTimeMs = endTime.getTime();
      
      return q.isActive && startTimeMs <= nowTime && endTimeMs > nowTime;
    });
    
    if (activeQuestion) {
      return NextResponse.json({ 
        success: true, 
        question: activeQuestion
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      question: null 
    });
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json({ error: 'Failed to fetch question' }, { status: 500 });
  }
} 