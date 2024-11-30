import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { VotingQuestion, VotingQuestionsData, VotingSessionStatus } from '@/lib/types';

const questionsPath = path.join(process.cwd(), 'data/voting-questions.json');

async function getQuestions(): Promise<VotingQuestion[]> {
  const data = await fs.readFile(questionsPath, 'utf8');
  const questionsData = JSON.parse(data) as VotingQuestionsData;
  return questionsData.questions;
}

async function saveQuestions(questions: VotingQuestion[]): Promise<void> {
  await fs.writeFile(questionsPath, JSON.stringify({ questions }, null, 2));
}

export async function GET() {
  try {
    // Read the questions file using async fs
    const data = await fs.readFile(questionsPath, 'utf8');
    const questionsData = JSON.parse(data) as VotingQuestionsData;
    
    // Check and update status for each question
    const currentTime = new Date().getTime();
    let hasUpdates = false;

    questionsData.questions = questionsData.questions.map((question: VotingQuestion) => {
      const endTime = new Date(question.endTime).getTime();
      
      if (currentTime > endTime && question.status === 'active') {
        hasUpdates = true;
        return {
          ...question,
          status: 'completed'
        };
      }
      return question;
    });

    // Save updates if any status changed
    if (hasUpdates) {
      await fs.writeFile(questionsPath, JSON.stringify(questionsData, null, 2));
    }

    // Find current question (either active or most recent completed)
    let currentQuestion = questionsData.questions.find(q => q.status === 'active');
    
    if (!currentQuestion) {
      const completedQuestions = questionsData.questions
        .filter(q => q.status === 'completed')
        .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime());
      currentQuestion = completedQuestions[0];
    }

    return NextResponse.json({ question: currentQuestion || null });

  } catch (error) {
    console.error('Error processing voting questions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { question, duration, adminAddress } = await request.json();
    
    // Validate admin rights here...
    
    const questions = await getQuestions();
    
    // Archive any completed questions
    const updatedQuestions = questions.map((q) => {
      if (q.status === 'completed') {
        return { ...q, status: 'archived' as VotingSessionStatus };
      }
      return q;
    });

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration * 60000);

    const newQuestion: VotingQuestion = {
      id: Date.now().toString(),
      question,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      status: 'active',
      createdBy: adminAddress,
      options: ['yes', 'no']
    };

    updatedQuestions.push(newQuestion);
    await saveQuestions(updatedQuestions);

    return NextResponse.json({ question: newQuestion });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}