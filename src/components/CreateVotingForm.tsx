"use client";
import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';

interface CreateVotingFormProps {
  tokenName: string;
  onSubmit: (data: VotingFormData) => Promise<void>;
  onCancel: () => void;
}

export interface VotingFormData {
  question: string;
  startTime: string;
  endTime: string;
  options: string[];
}

export function CreateVotingForm({ tokenName, onSubmit, onCancel }: CreateVotingFormProps) {
  const [formData, setFormData] = useState<VotingFormData>({
    question: '',
    startTime: '',
    endTime: '',
    options: ['yes', 'no']
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.question || !formData.startTime || !formData.endTime) {
      setError('All fields are required');
      return;
    }

    const startDate = new Date(formData.startTime);
    const endDate = new Date(formData.endTime);
    const now = new Date();

    if (startDate < now) {
      setError('Start time must be in the future');
      return;
    }

    if (endDate <= startDate) {
      setError('End time must be after start time');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create voting session');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 rounded-lg bg-gray-900 border border-gray-800 shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Create New Voting Session</h3>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          aria-label="Close"
        >
          <FiX size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="question" className="block text-sm font-medium mb-1">
            Question
          </label>
          <input
            id="question"
            type="text"
            value={formData.question}
            onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
            className="w-full p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-gray-700"
            placeholder="Enter your question here"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium mb-1">
              Start Time
            </label>
            <input
              id="startTime"
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
              className="w-full p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-gray-700"
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          <div>
            <label htmlFor="endTime" className="block text-sm font-medium mb-1">
              End Time
            </label>
            <input
              id="endTime"
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
              className="w-full p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-gray-700"
              min={formData.startTime || new Date().toISOString().slice(0, 16)}
            />
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-sm" role="alert">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Voting Session'}
          </button>
        </div>
      </form>
    </div>
  );
} 