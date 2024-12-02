import { useState, useEffect } from 'react';
import { VotingQuestion } from '@/lib/types';

interface Props {
  session: VotingQuestion;
  onVote: (choice: 'yes' | 'no') => Promise<void>;
  userVotingPower: number;
}

export function VotingSession({ session, onVote, userVotingPower }: Props) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'yes' | 'no' | null>(null);

  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(session.endTime).getTime();
      const start = new Date(session.startTime).getTime();
      
      if (now < start) {
        setTimeLeft(`Starts in ${formatTime(start - now)}`);
      } else if (now < end) {
        setTimeLeft(`Ends in ${formatTime(end - now)}`);
      } else {
        setTimeLeft('Voting ended');
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const handleVote = async (choice: 'yes' | 'no') => {
    if (hasVoted) return;
    setSelectedOption(choice);
    try {
      await onVote(choice);
      setHasVoted(true);
    } catch (error) {
      setSelectedOption(null);
      console.error('Failed to submit vote:', error);
    }
  };

  return (
    <div className="p-6 rounded-lg bg-white/5 backdrop-blur-sm">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold">{session.question}</h3>
        <span className="text-sm text-gray-400">{timeLeft}</span>
      </div>

      <div className="space-y-3">
        {['yes', 'no'].map((option) => (
          <button
            key={option}
            onClick={() => handleVote(option as 'yes' | 'no')}
            disabled={hasVoted}
            className={`w-full p-4 rounded-lg border transition-colors ${
              selectedOption === option
                ? 'bg-blue-500 border-blue-600 text-white'
                : 'border-gray-700 hover:bg-gray-700'
            } ${hasVoted && selectedOption !== option ? 'opacity-50' : ''}`}
          >
            {option.toUpperCase()}
          </button>
        ))}
      </div>

      {userVotingPower > 0 && (
        <p className="mt-4 text-sm text-gray-400">
          Your voting power: {userVotingPower.toLocaleString()}
        </p>
      )}

      {session.results && session.status === 'completed' && (
        <div className="mt-6 pt-4 border-t border-gray-700">
          <h4 className="font-medium mb-2">Results</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Yes: {session.results.yesVotes.toLocaleString()}</span>
              <span>{((session.results.yesVotes / session.results.totalVotingPower) * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>No: {session.results.noVotes.toLocaleString()}</span>
              <span>{((session.results.noVotes / session.results.totalVotingPower) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 