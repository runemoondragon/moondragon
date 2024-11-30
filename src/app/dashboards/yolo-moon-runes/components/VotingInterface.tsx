import { useState, useEffect } from 'react';
import { VotingQuestion } from '@/lib/types';

interface Props {
  session: VotingQuestion;
  onSessionEnd: (session: VotingQuestion) => void;
}

export default function VotingInterface({ session, onSessionEnd }: Props) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const endTime = new Date(session.endTime).getTime();
      const now = new Date().getTime();
      const difference = endTime - now;

      if (difference <= 0) {
        onSessionEnd(session);
        return 0;
      }

      return difference;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [session, onSessionEnd]);

  const formatTimeLeft = () => {
    const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
    const seconds = Math.floor((timeLeft / 1000) % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVote = async (option: string) => {
    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          option
        }),
      });

      if (response.ok) {
        setSelectedOption(option);
        setHasVoted(true);
      }
    } catch (error) {
      console.error('Failed to submit vote:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">{session.question}</h2>
        <div className="text-xl font-mono">{formatTimeLeft()}</div>
      </div>

      <div className="space-y-4">
        {session.options.map((option: 'yes' | 'no') => (
          <button
            key={option}
            onClick={() => handleVote(option)}
            disabled={hasVoted}
            className={`w-full p-4 text-left rounded-lg border transition-colors ${
              selectedOption === option
                ? 'bg-blue-100 border-blue-500'
                : 'hover:bg-gray-50 border-gray-200'
            } ${hasVoted && selectedOption !== option ? 'opacity-50' : ''}`}
          >
            {option}
          </button>
        ))}
      </div>

      {hasVoted && (
        <div className="mt-6 text-center text-green-600">
          Your vote has been recorded!
        </div>
      )}
    </div>
  );
} 