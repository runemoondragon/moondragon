"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLaserEyes } from "@omnisat/lasereyes";
import { NavBar } from "@/components/NavBar";
import { VotingQuestion, VotingResults } from "@/lib/types";
import { FiClock, FiCheck, FiX, FiActivity } from 'react-icons/fi';

// Create Question Form Component
const CreateQuestionForm = ({ onSubmit }: { onSubmit: (question: string, duration: number) => Promise<void> }) => {
  const [question, setQuestion] = useState('');
  const [duration, setDuration] = useState(60); // Default 60 minutes
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await onSubmit(question, duration);
      setQuestion('');
      setDuration(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create question');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Question</label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-gray-700"
          placeholder="Enter your question..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value))}
          className="w-full p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-gray-700"
          min="1"
          required
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50"
      >
        {isSubmitting ? 'Creating...' : 'Create Question'}
      </button>
    </form>
  );
};

// Voting Component
const VotingSection = ({ 
  question, 
  onVote, 
  results, 
  hasVoted, 
  timeRemaining 
}: { 
  question: VotingQuestion;
  onVote: (choice: 'yes' | 'no') => Promise<void>;
  results: VotingResults | null;
  hasVoted: boolean;
  timeRemaining: number;
}) => {
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState('');

  const handleVote = async (choice: 'yes' | 'no') => {
    setError('');
    setIsVoting(true);
    try {
      await onVote(choice);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit vote');
    } finally {
      setIsVoting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const hasEnded = timeRemaining <= 0;

  return (
    <div className="p-6 rounded-lg bg-white/10 backdrop-blur-sm">
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">{question.question}</h3>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <FiClock className="w-4 h-4" />
          {hasEnded ? 'Voting ended' : `Time remaining: ${formatTime(timeRemaining)}`}
        </div>
      </div>

      {!hasEnded && !hasVoted && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => handleVote('yes')}
            disabled={isVoting}
            className="p-4 rounded-lg bg-green-500/10 hover:bg-green-500/20 transition-colors flex items-center justify-center gap-2"
          >
            <FiCheck className="w-5 h-5" />
            Yes
          </button>
          <button
            onClick={() => handleVote('no')}
            disabled={isVoting}
            className="p-4 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
          >
            <FiX className="w-5 h-5" />
            No
          </button>
        </div>
      )}

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {(hasVoted || hasEnded) && results && (
        <div className="space-y-4">
          <h4 className="font-medium">Results</h4>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Yes</span>
                <span>{((results.yesVotes / (results.yesVotes + results.noVotes)) * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${(results.yesVotes / (results.yesVotes + results.noVotes)) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>No</span>
                <span>{((results.noVotes / (results.yesVotes + results.noVotes)) * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 transition-all duration-500"
                  style={{ width: `${(results.noVotes / (results.yesVotes + results.noVotes)) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-400">Total votes: {results.totalVoters}</p>
        </div>
      )}
    </div>
  );
};

export default function YoloMoonRunesDashboard() {
  const { address } = useLaserEyes();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<VotingQuestion | null>(null);
  const [results, setResults] = useState<VotingResults | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    const checkAdminRights = async () => {
      if (!address) return;
      try {
        const response = await fetch('/api/check-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address })
        });
        const data = await response.json();
        setIsAdmin(data.isAdmin);
      } catch (error) {
        console.error('Failed to check admin rights:', error);
        setIsAdmin(false);
      }
    };

    const fetchActiveQuestion = async () => {
      try {
        const response = await fetch('/api/voting/question');
        const data = await response.json();
        if (response.ok && data.question) {
          setActiveQuestion(data.question);
          fetchResults();
        }
      } catch (error) {
        console.error('Failed to fetch active question:', error);
      }
    };

    const fetchResults = async () => {
      if (!activeQuestion) return;
      try {
        const response = await fetch(`/api/voting/vote?questionId=${activeQuestion.id}`);
        const data = await response.json();
        if (response.ok) {
          setResults(data);
        }
      } catch (error) {
        console.error('Failed to fetch results:', error);
      }
    };

    setIsMounted(true);
    if (address) {
      checkAdminRights();
      fetchActiveQuestion();
    }
  }, [address, activeQuestion]);

  useEffect(() => {
    if (isMounted && !address) {
      router.push("/");
    }
  }, [address, router, isMounted]);

  useEffect(() => {
    if (activeQuestion) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const end = new Date(activeQuestion.endTime).getTime();
        const remaining = Math.max(0, Math.floor((end - now) / 1000));
        setTimeRemaining(remaining);

        if (remaining === 0) {
          fetchResults();
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [activeQuestion, fetchResults]);

  const handleCreateQuestion = async (question: string, duration: number) => {
    if (!address) return;
    try {
      const response = await fetch('/api/voting/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          duration,
          adminAddress: address
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create question');
      }

      fetchActiveQuestion();
    } catch (error) {
      throw error;
    }
  };

  const handleVote = async (choice: 'yes' | 'no') => {
    if (!address || !activeQuestion) return;
    try {
      const response = await fetch('/api/voting/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: activeQuestion.id,
          walletAddress: address,
          choice
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit vote');
      }

      setHasVoted(true);
      fetchResults();
    } catch (error) {
      throw error;
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:to-black text-black dark:text-white">
      <NavBar address={address} />
      
      <main className="flex flex-col items-start p-8 mt-20 max-w-7xl mx-auto w-full">
        <div className="w-full">
          <h1 className="text-4xl font-bold mb-8">YOLO•MOON•RUNES Dashboard</h1>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Active Question Section */}
            <div className="col-span-2">
              {activeQuestion ? (
                <VotingSection
                  question={activeQuestion}
                  onVote={handleVote}
                  results={results}
                  hasVoted={hasVoted}
                  timeRemaining={timeRemaining}
                />
              ) : (
                <div className="p-6 rounded-lg bg-white/10 backdrop-blur-sm">
                  <p className="text-gray-400">No active question at the moment.</p>
                </div>
              )}
            </div>

            {/* Create Question Section (Admin Only) */}
            {isAdmin && !activeQuestion && (
              <div className="col-span-2 md:col-span-1">
                <div className="p-6 rounded-lg bg-white/10 backdrop-blur-sm">
                  <h2 className="text-xl font-semibold mb-4">Create New Question</h2>
                  <CreateQuestionForm onSubmit={handleCreateQuestion} />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 