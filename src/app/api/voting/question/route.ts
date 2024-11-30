import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { VotingQuestion, VotingQuestionsData, VotingSessionStatus, VotingResults, Vote } from '@/lib/types';

const questionsPath = path.join(process.cwd(), 'data/voting-questions.json');

async function getQuestions(): Promise<VotingQuestion[]> {
  const data = await fs.readFile(questionsPath, 'utf8');
  const questionsData = JSON.parse(data) as VotingQuestionsData;
  return questionsData.questions;
}

async function saveQuestions(questions: VotingQuestion[]): Promise<void> {
  await fs.writeFile(questionsPath, JSON.stringify({ questions }, null, 2));
}

async function calculateResults(questionId: string): Promise<VotingResults> {
  const votesData = await fs.readFile(path.join(process.cwd(), 'data/votes.json'), 'utf8');
  const votes: Vote[] = JSON.parse(votesData);
  const questionVotes = votes.filter(v => v.questionId === questionId);
  
  const yesVotes = questionVotes
    .filter(v => v.choice === 'yes')
    .reduce((sum, v) => sum + v.tokenBalance, 0);
  
  const noVotes = questionVotes
    .filter(v => v.choice === 'no')
    .reduce((sum, v) => sum + v.tokenBalance, 0);

  return {
    yesVotes,
    noVotes,
    totalVoters: questionVotes.length,
    totalVotingPower: yesVotes + noVotes,
    winningChoice: yesVotes > noVotes ? 'yes' : noVotes > yesVotes ? 'no' : undefined,
    hasEnded: true
  };
}

export async function GET() {
  try {
    // Read the questions file using async fs
    const data = await fs.readFile(questionsPath, 'utf8');
    const questionsData = JSON.parse(data) as VotingQuestionsData;
    
    // Check and update status for each question
    const currentTime = new Date().getTime();
    let hasUpdates = false;

    questionsData.questions = await Promise.all(questionsData.questions.map(async (question: VotingQuestion) => {
      const endTime = new Date(question.endTime).getTime();
      
      if (currentTime > endTime && question.status === 'active') {
        hasUpdates = true;
        const results = await calculateResults(question.id);
        return {
          ...question,
          status: 'completed',
          results
        };
      }
      return question;
    }));

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