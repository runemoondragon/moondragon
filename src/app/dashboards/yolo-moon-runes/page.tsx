"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLaserEyes } from "@omnisat/lasereyes";
import { NavBar } from "@/components/NavBar";
import { VotingQuestion, VotingResults, Vote } from "@/lib/types";
import { FiClock, FiCheck, FiX } from 'react-icons/fi';
import { fetchOrdAddress } from "@/lib/runebalance";
import { RuneBalance } from "@/lib/runebalance";

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
  timeRemaining,
  votingPower 
}: { 
  question: VotingQuestion;
  onVote: (choice: 'yes' | 'no') => Promise<void>;
  results: VotingResults | null;
  hasVoted: boolean;
  timeRemaining: number;
  votingPower: number;
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
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const hasEnded = timeRemaining <= 0;

  return (
    <div className="p-6 rounded-lg bg-[#1a1f2e]">
      <h3 className="text-2xl font-semibold mb-2">{question.question}</h3>
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <FiClock className="w-4 h-4" />
        {hasEnded ? 'Voting ended' : formatTime(timeRemaining)}
      </div>

      {hasVoted && (
        <div className="text-red-400 mb-4">Already voted</div>
      )}

      {!hasEnded && !hasVoted && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => handleVote('yes')}
            disabled={isVoting}
            className="p-4 rounded-lg bg-green-600 hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <FiCheck className="w-5 h-5" />
            Yes
          </button>
          <button
            onClick={() => handleVote('no')}
            disabled={isVoting}
            className="p-4 rounded-lg bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <FiX className="w-5 h-5" />
            No
          </button>
        </div>
      )}

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="space-y-4">
        <h4 className="font-medium">Current Results</h4>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Yes</span>
              <span>{results?.totalVotingPower ? 
                ((results.yesVotes / results.totalVotingPower) * 100).toFixed(1)
                : '0'}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-500"
                style={{ 
                  width: results?.totalVotingPower ? 
                    `${(results.yesVotes / results.totalVotingPower) * 100}%`
                    : '0%'
                }}
              />
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {results?.yesVotes && results.yesVotes > 0 && 
                `${results.yesVotes.toLocaleString()} votes (${results.yesVotes.toLocaleString()} YOLO)`
              }
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>No</span>
              <span>{results?.totalVotingPower ? 
                ((results.noVotes / results.totalVotingPower) * 100).toFixed(1)
                : '0'}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-500 transition-all duration-500"
                style={{ 
                  width: results?.totalVotingPower ? 
                    `${(results.noVotes / results.totalVotingPower) * 100}%`
                    : '0%'
                }}
              />
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {results?.noVotes && results.noVotes > 0 && 
                `${results.noVotes.toLocaleString()} votes (${results.noVotes.toLocaleString()} YOLO)`
              }
            </div>
          </div>

          <div className="text-sm text-gray-400 mt-2">
            <p>Total votes: {results?.totalVoters || 0}</p>
            <p>Total voting power: {results?.totalVotingPower.toLocaleString() || '0'} YOLO</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add new CompletedVotingSection component
const CompletedVotingSection = ({ 
  question, 
  results 
}: { 
  question: VotingQuestion;
  results: VotingResults;
}) => {
  if (!results || !results.winningChoice) return null;

  const winningPercentage = results.winningChoice === 'yes' 
    ? (results.yesVotes / results.totalVotingPower) * 100
    : (results.noVotes / results.totalVotingPower) * 100;

  return (
    <div className="p-6 rounded-lg bg-[#1a1f2e]">
      <div className="mb-4">
        <h3 className="text-2xl font-semibold mb-2">{question.question}</h3>
        <div className="text-sm text-gray-400">
          Voting ended {new Date(question.endTime).toLocaleDateString()}
        </div>
      </div>

      <div className="mb-6">
        <div className="text-xl font-medium flex items-center gap-2">
          <span>Winner:</span>
          <span className={`${
            results.winningChoice === 'yes' ? 'text-green-500' : 'text-red-500'
          }`}>
            {results.winningChoice === 'yes' ? 'Yes' : 'No'}
          </span>
          <span className="text-gray-400">
            ({winningPercentage.toFixed(1)}%)
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Final Results</h4>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Yes</span>
              <span>{results?.totalVotingPower ? 
                ((results.yesVotes / results.totalVotingPower) * 100).toFixed(1)
                : '0'}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-500"
                style={{ 
                  width: results?.totalVotingPower ? 
                    `${(results.yesVotes / results.totalVotingPower) * 100}%`
                    : '0%'
                }}
              />
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {results?.yesVotes && results.yesVotes > 0 && 
                `${results.yesVotes.toLocaleString()} votes (${results.yesVotes.toLocaleString()} YOLO)`
              }
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>No</span>
              <span>{results?.totalVotingPower ? 
                ((results.noVotes / results.totalVotingPower) * 100).toFixed(1)
                : '0'}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-500 transition-all duration-500"
                style={{ 
                  width: results?.totalVotingPower ? 
                    `${(results.noVotes / results.totalVotingPower) * 100}%`
                    : '0%'
                }}
              />
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {results?.noVotes && results.noVotes > 0 && 
                `${results.noVotes.toLocaleString()} votes (${results.noVotes.toLocaleString()} YOLO)`
              }
            </div>
          </div>

          <div className="text-sm text-gray-400 mt-2">
            <p>Total votes: {results?.totalVoters || 0}</p>
            <p>Total voting power: {results?.totalVotingPower.toLocaleString() || '0'} YOLO</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const DisplayResults = ({
  results,
  question
}: {
  results: VotingResults;
  question: VotingQuestion;
}) => {
  if (!results || !results.winningChoice) return null;

  const winningPercentage = results.winningChoice === 'yes' 
    ? (results.yesVotes / results.totalVotingPower) * 100
    : (results.noVotes / results.totalVotingPower) * 100;

  return (
    <div className="p-6 rounded-lg bg-[#1a1f2e]">
      <div className="mb-4">
        <h3 className="text-2xl font-semibold mb-2">{question.question}</h3>
        <div className="text-sm text-gray-400">
          Voting ended {new Date(question.endTime).toLocaleDateString()}
        </div>
      </div>

      <div className="mb-6">
        <div className="text-xl font-medium flex items-center gap-2">
          <span>Winner:</span>
          <span className={`${
            results.winningChoice === 'yes' ? 'text-green-500' : 'text-red-500'
          }`}>
            {results.winningChoice === 'yes' ? 'Yes' : 'No'}
          </span>
          <span className="text-gray-400">
            ({winningPercentage.toFixed(1)}%)
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Final Results</h4>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Yes</span>
              <span>{results?.totalVotingPower ? 
                ((results.yesVotes / results.totalVotingPower) * 100).toFixed(1)
                : '0'}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-500"
                style={{ 
                  width: results?.totalVotingPower ? 
                    `${(results.yesVotes / results.totalVotingPower) * 100}%`
                    : '0%'
                }}
              />
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {results?.yesVotes && results.yesVotes > 0 && 
                `${results.yesVotes.toLocaleString()} votes (${results.yesVotes.toLocaleString()} YOLO)`
              }
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>No</span>
              <span>{results?.totalVotingPower ? 
                ((results.noVotes / results.totalVotingPower) * 100).toFixed(1)
                : '0'}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-500 transition-all duration-500"
                style={{ 
                  width: results?.totalVotingPower ? 
                    `${(results.noVotes / results.totalVotingPower) * 100}%`
                    : '0%'
                }}
              />
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {results?.noVotes && results.noVotes > 0 && 
                `${results.noVotes.toLocaleString()} votes (${results.noVotes.toLocaleString()} YOLO)`
              }
            </div>
          </div>

          <div className="text-sm text-gray-400 mt-2">
            <p>Total votes: {results?.totalVoters || 0}</p>
            <p>Total voting power: {results?.totalVotingPower.toLocaleString() || '0'} YOLO</p>
          </div>
        </div>
      </div>
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
  const [votingPower, setVotingPower] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [nextSessionTime, setNextSessionTime] = useState<string | null>(null);

  // First, define checkIfVoted
  const checkIfVoted = useCallback(async () => {
    if (!address || !activeQuestion) return;
    try {
      const response = await fetch('/api/voting/vote?questionId=' + activeQuestion.id);
      const data = await response.json();
      
      const userVoted = data.votes?.some((vote: Vote) => 
        vote.walletAddress.toLowerCase() === address.toLowerCase()
      );
      
      setHasVoted(userVoted);
      
      if (data.results) {
        setResults(data.results);
      }
      
      console.log('Vote check:', {
        userVoted,
        results: data.results,
        votes: data.votes
      });
    } catch (error) {
      console.error('Failed to check vote status:', error);
    }
  }, [address, activeQuestion]);

  // Then define fetchResults
  const fetchResults = useCallback(async () => {
    if (!activeQuestion) return;
    try {
      const response = await fetch(`/api/voting/vote?questionId=${activeQuestion.id}`);
      const data = await response.json();
      console.log('Fetched results:', data);
      
      if (response.ok) {
        setResults(data.results);
        if (address) {
          const userVoted = data.votes?.some((vote: Vote) => 
            vote.walletAddress.toLowerCase() === address.toLowerCase()
          );
          setHasVoted(userVoted);
        }
      }
    } catch (error) {
      console.error('Failed to fetch results:', error);
    }
  }, [activeQuestion, address]);

  // Finally define fetchActiveQuestion
  const fetchActiveQuestion = useCallback(async () => {
    try {
      const response = await fetch('/api/voting/question');
      const data = await response.json();
      
      if (response.ok && data.question) {
        setActiveQuestion(data.question);
        await fetchResults();
        
        if (data.question.status === 'active') {
          await checkIfVoted();
        }
        
        if (data.question.nextSessionStart) {
          setNextSessionTime(data.question.nextSessionStart);
        }
      }
    } catch (error) {
      console.error('Failed to fetch question:', error);
    }
  }, [fetchResults, checkIfVoted]);

  // Define checkAdminRights using useCallback
  const checkAdminRights = useCallback(async () => {
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
  }, [address]);

  // Replace verifyAccess with getRuneBalance
  const getRuneBalance = useCallback(async () => {
    if (!address) return;
    
    setIsLoading(true);
    try {
      const balances = await fetchOrdAddress(address);
      const yoloToken = balances?.find((rune: RuneBalance) => rune.name === 'YOLO•MOON•RUNES');
      if (yoloToken) {
        setVotingPower(parseInt(yoloToken.balance));
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("Error fetching rune balance:", error);
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  }, [address, router]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (address && isMounted) {
      const initializeData = async () => {
        try {
          await getRuneBalance();
          await checkAdminRights();
          await fetchActiveQuestion();
          if (activeQuestion) {
            await fetchResults();
            await checkIfVoted();
          }
        } catch (error) {
          console.error('Failed to initialize data:', error);
        }
      };
      
      initializeData();
    }
  }, [
    address, 
    isMounted, 
    activeQuestion, 
    checkAdminRights, 
    checkIfVoted, 
    fetchActiveQuestion, 
    fetchResults, 
    getRuneBalance
  ]);

  useEffect(() => {
    if (isMounted && !address) {
      router.push("/");
    }
  }, [address, router, isMounted]);

  useEffect(() => {
    if (activeQuestion) {
      const now = new Date().getTime();
      const end = new Date(activeQuestion.endTime).getTime();
      const remaining = Math.max(0, Math.floor((end - now) / 1000));
      setTimeRemaining(remaining);

      if (remaining > 0) {
        const interval = setInterval(() => {
          const currentTime = new Date().getTime();
          const newRemaining = Math.max(0, Math.floor((end - currentTime) / 1000));
          setTimeRemaining(newRemaining);

          if (newRemaining === 0) {
            clearInterval(interval);
            fetchResults();
          }
        }, 1000);

        return () => clearInterval(interval);
      }
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
    if (!address || !activeQuestion || !votingPower) return;
    try {
      const response = await fetch('/api/voting/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: activeQuestion.id,
          walletAddress: address,
          choice,
          tokenBalance: votingPower
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit vote');
      }

      setHasVoted(true);
      await fetchResults();
    } catch (error) {
      throw error;
    }
  };

  // Add function for admins to schedule next session
  const scheduleNextSession = async (startTime: string) => {
    if (!isAdmin || !address) return;
    
    try {
      const response = await fetch('/api/voting/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminAddress: address,
          startTime
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setNextSessionTime(data.nextSessionStart);
      }
    } catch (error) {
      console.error('Failed to schedule next session:', error);
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
          
          {/* Add Voting Power Display */}
          <div className="mb-6 p-4 rounded-lg bg-white/10 backdrop-blur-sm">
            <h2 className="text-lg text-gray-400">Your Voting Power</h2>
            <p className="text-3xl font-bold">{votingPower.toLocaleString()} YOLO</p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="col-span-2">
              {activeQuestion ? (
                activeQuestion.status === 'active' ? (
                  <VotingSection
                    question={activeQuestion}
                    onVote={handleVote}
                    results={results}
                    hasVoted={hasVoted}
                    timeRemaining={timeRemaining}
                    votingPower={votingPower}
                  />
                ) : activeQuestion.status === 'completed' && results ? (
                  <CompletedVotingSection
                    question={activeQuestion}
                    results={results}
                  />
                ) : null
              ) : (
                <div className="p-6 rounded-lg bg-white/10 backdrop-blur-sm">
                  <p className="text-gray-400 mb-2">No active or completed questions.</p>
                  {nextSessionTime && (
                    <p className="text-sm text-gray-500">
                      Next voting session starts: {new Date(nextSessionTime).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Admin controls */}
            {isAdmin && (
              <div className="col-span-2 md:col-span-1">
                {activeQuestion?.status !== 'active' && (
                  <div className="p-6 rounded-lg bg-white/10 backdrop-blur-sm">
                    <h2 className="text-xl font-semibold mb-4">Admin Controls</h2>
                    <CreateQuestionForm onSubmit={handleCreateQuestion} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 