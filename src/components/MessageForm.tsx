import { useState } from 'react';

interface Message {
  id: string;
  title: string;
  message: string;
  createdBy: string;
  timestamp: string;
  token: string;
}

interface MessageFormProps {
  initialData: Message | null;
  onSubmit: (data: { title: string; message: string }) => Promise<void>;
  onClose: () => void;
}

export default function MessageForm({ initialData, onSubmit, onClose }: MessageFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [message, setMessage] = useState(initialData?.message || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ title, message });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 rounded-lg bg-white/5 border border-gray-700"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full p-2 rounded-lg bg-white/5 border border-gray-700 min-h-[100px]"
          required
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
        >
          {initialData ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}
