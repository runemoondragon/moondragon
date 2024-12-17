import { Dialog } from '@headlessui/react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface PollFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PollFormData) => Promise<void>;
  tokenName: string;
}

export interface PollFormData {
  question: string;
  options: string[];
  endTime: string;
  tokenName: string;
}

export function PollForm({ isOpen, onClose, onSubmit, tokenName }: PollFormProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [endTime, setEndTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    } else {
      toast.error('Maximum 6 options allowed');
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        question,
        options: options.filter(opt => opt.trim() !== ''),
        endTime,
        tokenName
      });
      onClose();
    } catch (error) {
      console.error('Failed to create poll:', error);
      toast.error('Failed to create poll');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-lg bg-gray-900 p-6 text-white">
          <Dialog.Title className="text-xl font-semibold mb-4">
            Create New Poll
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Question</label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full p-2 rounded-lg bg-white/10 border border-gray-700"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium mb-1">Options</label>
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="flex-1 p-2 rounded-lg bg-white/10 border border-gray-700"
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="p-2 text-red-500 hover:text-red-400"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              
              {options.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  + Add Option
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-2 rounded-lg bg-white/10 border border-gray-700"
                required
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Poll'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 