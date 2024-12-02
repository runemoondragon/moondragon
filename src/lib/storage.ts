import fs from 'fs/promises';
import path from 'path';
import { VotingQuestion, Vote } from './types';

const QUESTIONS_PATH = path.join(process.cwd(), 'data', 'voting-questions.json');
const VOTES_PATH = path.join(process.cwd(), 'data', 'votes.json');

export async function getQuestions(): Promise<VotingQuestion[]> {
  try {
    // Check if file exists
    try {
      await fs.access(QUESTIONS_PATH);
      console.log('✅ voting-questions.json exists');
    } catch {
      console.log('❌ voting-questions.json does not exist');
      // Create the file with empty questions array
      await fs.writeFile(QUESTIONS_PATH, JSON.stringify({ questions: [] }, null, 2));
      console.log('Created empty voting-questions.json');
    }

    console.log('Reading from:', QUESTIONS_PATH);
    const data = await fs.readFile(QUESTIONS_PATH, 'utf-8');
    console.log('File contents:', data);
    
    const parsed = JSON.parse(data);
    console.log('Parsed questions:', parsed);
    
    return parsed.questions || [];
  } catch (error) {
    console.error('Error reading questions:', error);
    return [];
  }
}

export async function saveQuestions(questions: VotingQuestion[]): Promise<void> {
  try {
    console.log('Saving questions:', questions);
    await fs.writeFile(QUESTIONS_PATH, JSON.stringify({ questions }, null, 2));
    console.log('Successfully saved questions');
  } catch (error) {
    console.error('Error saving questions:', error);
    throw error;
  }
}

export async function getVotes(): Promise<Vote[]> {
  try {
    const data = await fs.readFile(VOTES_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export async function saveVotes(votes: Vote[]): Promise<void> {
  await fs.writeFile(VOTES_PATH, JSON.stringify(votes, null, 2));
}

export async function updateVotingQuestion(question: VotingQuestion): Promise<void> {
  const questions = await readJsonFile<VotingQuestion[]>('data/voting-questions.json');
  const updatedQuestions = questions.map(q => 
    q.id === question.id ? question : q
  );
  await writeJsonFile('data/voting-questions.json', updatedQuestions);
}

export async function recordVote(vote: Vote): Promise<void> {
  const votes = await readJsonFile<Vote[]>('data/votes.json');
  votes.push(vote);
  await writeJsonFile('data/votes.json', votes);
}

// Helper function to read JSON files
async function readJsonFile<T>(path: string): Promise<T> {
  const data = await fs.readFile(path, 'utf-8');
  return JSON.parse(data);
}

// Helper function to write JSON files
async function writeJsonFile(path: string, data: any): Promise<void> {
  await fs.writeFile(path, JSON.stringify(data, null, 2));
} 