import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { VotingQuestion } from '@/lib/types';
import { fetchOrdAddress } from '@/lib/runebalance';

const QUESTIONS_PATH = path.join(process.cwd(), 'data', 'voting-questions.json');

async function readQuestions(): Promise<VotingQuestion[]> {
  try {
    const content = await fs.readFile(QUESTIONS_PATH, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function writeQuestions(questions: VotingQuestion[]) {
  await fs.writeFile(QUESTIONS_PATH, JSON.stringify(questions, null, 2));
}

export async function POST(req: Request) {
  try {
    const { question, duration, adminAddress } = await req.json();

    // Verify admin rights (YOLO•MOON•RUNES holder)
    const balances = await fetchOrdAddress(adminAddress);
    const tokenBalance = balances?.find(token => token.name === "YOLO•MOON•RUNES");
    const hasAccess = tokenBalance && parseInt(tokenBalance.balance) >= 400000;

    if (!hasAccess) {
      return NextResponse.json({ 
        error: 'Unauthorized. You need YOLO•MOON•RUNES tokens to create questions.' 
      }, { status: 401 });
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration * 60000); // duration in minutes

    const newQuestion: VotingQuestion = {
      id: Date.now().toString(),
      question,
      startTime,
      endTime,
      isActive: true,
      createdBy: adminAddress
    };

    const questions = await readQuestions();
    // Deactivate any active questions
    const updatedQuestions = questions.map(q => ({ ...q, isActive: false }));
    await writeQuestions([...updatedQuestions, newQuestion]);

    return NextResponse.json({ success: true, question: newQuestion });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const questions = await readQuestions();
    const activeQuestion = questions.find(q => q.isActive);
    return NextResponse.json({ question: activeQuestion });
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json({ error: 'Failed to fetch question' }, { status: 500 });
  }
} 