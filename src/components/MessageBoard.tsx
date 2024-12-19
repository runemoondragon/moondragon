import { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Modal from '@/components/Modal';
import MessageForm from './MessageForm';
import { shortenAddress } from '@/lib/utils';

interface Message {
  id: string;
  title: string;
  message: string;
  createdBy: string;
  timestamp: string;
  token: string;
}

interface MessageBoardProps {
  tokenName: string;
  isAdmin: boolean;
  address: string;
}

export default function MessageBoard({ tokenName, isAdmin, address }: MessageBoardProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages/${encodeURIComponent(tokenName)}`);
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setMessages([]);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [tokenName]);

  const handleCreateMessage = async (data: { title: string; message: string }) => {
    try {
      const response = await fetch('/api/messages/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          token: tokenName,
          createdBy: address
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create message');
      }

      setShowCreateForm(false);
      await fetchMessages();
      toast.success('Message created successfully');
    } catch (error) {
      toast.error('Failed to create message');
    }
  };

  const handleEditMessage = async (messageId: string, data: { title: string; message: string }) => {
    try {
      const response = await fetch(`/api/messages/${encodeURIComponent(tokenName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          ...data,
          updatedBy: address
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update message');
      }

      setEditingMessage(null);
      await fetchMessages();
      toast.success('Message updated successfully');
    } catch (error) {
      toast.error('Failed to update message');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${encodeURIComponent(tokenName)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      await fetchMessages();
      toast.success('Message deleted successfully');
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Message Board</h2>
        {isAdmin && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
          >
            Create Note
          </button>
        )}
      </div>

      <div className="space-y-4">
        {Array.isArray(messages) && messages.length > 0 ? (
          messages.map((message) => (
            <div
              key={message.id}
              className="p-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-semibold">{message.title}</h3>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingMessage(message)}
                      className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteMessage(message.id)}
                      className="p-2 hover:bg-red-700 rounded-full transition-colors"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              <p className="mt-2 text-gray-600 dark:text-gray-300">{message.message}</p>
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Posted by: {message.token} Dash Admin ({shortenAddress(message.createdBy)})
                <br />
                {new Date(message.timestamp).toLocaleString()}
              </div>
            </div>
          ))
        ) : (
          <p>No messages available.</p>
        )}
      </div>

      {/* Create/Edit Message Modal */}
      <Modal
        isOpen={showCreateForm || !!editingMessage}
        onClose={() => {
          setShowCreateForm(false);
          setEditingMessage(null);
        }}
      >
        <MessageForm
          initialData={editingMessage}
          onSubmit={(data: { title: string; message: string }) => {
            if (editingMessage) {
              return handleEditMessage(editingMessage.id, data);
            } else {
              return handleCreateMessage(data);
            }
          }}
          onClose={() => {
            setShowCreateForm(false);
            setEditingMessage(null);
          }}
        />
      </Modal>
    </div>
  );
}