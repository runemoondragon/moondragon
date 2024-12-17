import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  endTime: string;
  status: 'active' | 'completed';
  voters: string[];
}

interface PollDisplayProps {
  poll: Poll;
  onVote: (pollId: string, optionId: string) => Promise<void>;
  userAddress?: string;
  votingPower: number;
}

export function PollDisplay({ poll, onVote, userAddress, votingPower }: PollDisplayProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  
  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
  const hasVoted = userAddress && poll.voters.includes(userAddress);
  
  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date();
      const end = new Date(poll.endTime);
      const diff = end.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft('Ended');
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft(`${days}d ${hours}h ${minutes}m`);
    };
    
    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000);
    return () => clearInterval(interval);
  }, [poll.endTime]);

  const handleVote = async (optionId: string) => {
    if (!userAddress || !votingPower || hasVoted || isVoting) return;
    
    setIsVoting(true);
    try {
      await onVote(poll.id, optionId);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="p-6 rounded-lg bg-white/10 backdrop-blur-sm space-y-4">
      <h3 className="text-xl font-semibold">{poll.question}</h3>
      
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
        </svg>
        {timeLeft}
      </div>

      <div className="space-y-3">
        {poll.options.map((option) => {
          const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
          
          return (
            <div key={option.id} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{option.text}</span>
                <span>{percentage.toFixed(1)}%</span>
              </div>
              
              <div className="relative h-10">
                <motion.div
                  className="absolute inset-0 bg-gray-700 rounded-lg"
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5 }}
                />
                
                <button
                  onClick={() => handleVote(option.id)}
                  disabled={!votingPower || hasVoted || isVoting}
                  className="relative z-10 w-full h-full px-4 text-left hover:bg-white/5 rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {option.votes} votes
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {!votingPower && (
        <div className="text-sm text-red-400 text-center">
          You need to hold tokens to vote
        </div>
      )}
      
      {hasVoted && (
        <div className="text-sm text-blue-400 text-center">
          You have already voted
        </div>
      )}
    </div>
  );
} 