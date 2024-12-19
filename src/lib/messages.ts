import fs from 'fs/promises';
import path from 'path';

const messagesPath = path.join(process.cwd(), 'data', 'messages.json');

export async function readMessages(token: string) {
  try {
    const data = await fs.readFile(messagesPath, 'utf-8');
    const messages = JSON.parse(data);
    return messages[token] || [];
  } catch (error) {
    return [];
  }
}

export async function writeMessages(token: string, messages: any[]) {
  try {
    const data = await fs.readFile(messagesPath, 'utf-8');
    const allMessages = JSON.parse(data);
    allMessages[token] = messages;
    await fs.writeFile(messagesPath, JSON.stringify(allMessages, null, 2));
  } catch (error) {
    throw new Error('Failed to write messages');
  }
}
