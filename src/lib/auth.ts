import { getQuestions } from './storage';

export async function validateAdmin(adminAddress: string, tokenName: string): Promise<boolean> {
  // For now, return true to allow any address to create questions
  // TODO: Implement proper admin validation
  return true;
} 