import { useState } from 'react';
import { VotingQuestion } from '@/lib/types';

interface Props {
  session: VotingQuestion;
  onVote: (choice: 'yes' | 'no') => Promise<void>;
  votingPower: number;
}

export default function VotingInterface({ session, onVote, votingPower }: Props) {
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (choice: 'yes' | 'no') => {
    try {
      setIsVoting(true);
      await onVote(choice);
    } catch (error) {
      console.error('Failed to vote:', error);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="p-6 rounded-lg bg-[#1a1f2d] space-y-4">
      <h3 className="text-2xl font-semibold mb-4">{session.question}</h3>
      
      <div className="text-sm text-gray-400 mb-4">
        {new Date(session.startTime).toLocaleString()} - {new Date(session.endTime).toLocaleString()}
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => handleVote('yes')}
          disabled={isVoting || !votingPower}
          className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          Yes ({session.results?.yesVotes.toLocaleString() || 0})
        </button>
        <button
          onClick={() => handleVote('no')}
          disabled={isVoting || !votingPower}
          className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          No ({session.results?.noVotes.toLocaleString() || 0})
        </button>
      </div>

      {!votingPower && (
        <div className="text-sm text-red-400 text-center">
          You need to hold tokens to vote
        </div>
      )}
    </div>
  );
} 