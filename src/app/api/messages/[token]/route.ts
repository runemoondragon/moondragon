import { NextResponse } from 'next/server';
import { readMessages, writeMessages } from '../../../../lib/messages';

interface Message {
  id: string;
  title: string;
  message: string;
  createdBy: string;
  timestamp: string;
  token: string;
}

// Get messages for a token
export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const messages = await readMessages(params.token);
    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// Update a message
export async function PUT(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { messageId, title, message } = await request.json();
    const messages = await readMessages(params.token);
    const messageIndex = messages.findIndex((m: Message) => m.id === messageId);
    
    if (messageIndex === -1) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    messages[messageIndex] = {
      ...messages[messageIndex],
      title,
      message,
    };

    await writeMessages(params.token, messages);
    return NextResponse.json({ message: 'Message updated successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}

// Delete a message
export async function DELETE(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { messageId } = await request.json();
    const messages = await readMessages(params.token);
    const filteredMessages = messages.filter((m: Message) => m.id !== messageId);
    
    await writeMessages(params.token, filteredMessages);
    return NextResponse.json({ message: 'Message deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}