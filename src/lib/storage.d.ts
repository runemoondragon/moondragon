import { VotingQuestion } from './types';

export function getQuestions(): Promise<VotingQuestion[]>;
export function saveQuestions(questions: VotingQuestion[]): Promise<void>; 