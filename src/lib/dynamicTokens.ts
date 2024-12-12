import fs from 'fs/promises';
import path from 'path';
import { AccessToken } from './const';

const DYNAMIC_TOKENS_PATH = path.join(process.cwd(), 'data', 'dynamic-tokens.json');

export async function getDynamicAccessTokens(): Promise<AccessToken[]> {
  try {
    const content = await fs.readFile(DYNAMIC_TOKENS_PATH, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

export async function writeDynamicAccessTokens(tokens: AccessToken[]) {
  await fs.writeFile(DYNAMIC_TOKENS_PATH, JSON.stringify(tokens, null, 2));
} 