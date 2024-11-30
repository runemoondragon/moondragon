import { useState } from 'react';
import { FiX, FiPlus } from 'react-icons/fi';
import DateTimePicker from 'react-datetime-picker';
import 'react-datetime-picker/dist/DateTimePicker.css';
import 'react-calendar/dist/Calendar.css';
import 'react-clock/dist/Clock.css';

type Value = Date | null;

interface CreateQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (question: string, startTime: Date, endTime: Date) => Promise<void>;
}

export function CreateQuestionModal({ isOpen, onClose, onSubmit }: CreateQuestionModalProps) {
  const [question, setQuestion] = useState('');
  const [startTime, setStartTime] = useState<Value>(new Date());
  const [endTime, setEndTime] = useState<Value>(new Date());
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!question.trim()) {
      setError('Question is required');
      return;
    }

    if (!startTime || !endTime) {
      setError('Both start and end times are required');
      return;
    }

    if (startTime >= endTime) {
      setError('End time must be after start time');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(question, startTime, endTime);
      setQuestion('');
      setStartTime(new Date());
      setEndTime(new Date());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create question');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Create New Question</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Question</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-gray-700"
              placeholder="Enter your question"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Start Time</label>
            <DateTimePicker
              onChange={(value: Value) => setStartTime(value)}
              value={startTime}
              className="w-full bg-white/10 rounded-lg border border-gray-700"
              minDate={new Date()}
              format="y-MM-dd h:mm a"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">End Time</label>
            <DateTimePicker
              onChange={(value: Value) => setEndTime(value)}
              value={endTime}
              className="w-full bg-white/10 rounded-lg border border-gray-700"
              minDate={startTime || new Date()}
              format="y-MM-dd h:mm a"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              'Creating...'
            ) : (
              <>
                <FiPlus size={20} />
                Create Question
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
} 