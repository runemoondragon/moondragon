import { NextResponse } from 'next/server';
import { writeMessages, readMessages } from '../../../../lib/messages';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const { title, message, token, createdBy } = await request.json();
    
    const messages = await readMessages(token);
    const newMessage = {
      id: uuidv4(),
      title,
      message,
      token,
      createdBy,
      timestamp: new Date().toISOString()
    };
    
    messages.push(newMessage);
    await writeMessages(token, messages);
    
    return NextResponse.json({ message: 'Message created successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}