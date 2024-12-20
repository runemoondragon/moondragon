"use client";
import { useEffect, useState } from 'react';
import { useLaserEyes } from '@omnisat/lasereyes';
import { VotingFormData, CreateVotingForm } from '@/components/CreateVotingForm';
import { PollForm, PollFormData } from '@/components/PollForm';
import { toast } from 'react-hot-toast';
import { fetchOrdAddress } from "@/lib/runebalance";
import { NavBar } from "@/components/NavBar";
import { useRouter } from "next/navigation";
import ParticipationPoints from '@/app/dashboards/[token]/components/ParticipationPoints';
import MessageBoard from '@/components/MessageBoard';

interface VotingSession {
  id: string;
  question: string;
  startTime: string;
  endTime: string;
  status: 'active' | 'completed' | 'archived';
  results: {
    yesVotes: number;
    noVotes: number;
    totalVoters: number;
    totalVotingPower: number;
  };
  hasVoted?: boolean;
}

interface Poll {
  id: string;
  pollQuestion: string;
  options: string[];
  token: string;
  startTime: string;
  endTime: string;
  status: 'active' | 'completed' | 'archived';
  results: {
    voters: string[];
    totalVoters: number;
    totalVotingPower: number;
    hasEnded: boolean;
    winner?: string;
    winningPercentage?: number;
    [key: `poll${number}`]: number;
  };
}

interface Rune {
  name: string;
  balance: number;
}

const formatTimeRemaining = (endTime: string): string => {
  const end = new Date(endTime).getTime();
  const now = new Date().getTime();
  const diff = end - now;

  if (diff <= 0) return '0s';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${hours}h ${minutes}m ${seconds}s`;
};

const calculateVoteResults = (yesVotes: number, noVotes: number) => {
  const totalVotes = yesVotes + noVotes;
  if (totalVotes === 0) return null;

  const yesPercentage = (yesVotes / totalVotes) * 100;
  const noPercentage = (noVotes / totalVotes) * 100;
  const margin = Math.abs(yesPercentage - noPercentage);
  
  return {
    winner: yesVotes > noVotes ? 'Yes' : 'No',
    winningPercentage: Math.max(yesPercentage, noPercentage),
    margin: margin,
    color: yesVotes > noVotes ? 'text-green-500' : 'text-red-500'
  };
};

export default function TokenDashboard() {
  const { address } = useLaserEyes();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [votingSessions, setVotingSessions] = useState<VotingSession[]>([]);
  const [votingPower, setVotingPower] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showVotingForm, setShowVotingForm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<Record<string, string>>({});
  const [polls, setPolls] = useState<Poll[]>([]);
  const [showPollForm, setShowPollForm] = useState(false);

  const tokenName = "DOG•GO•TO•THE•MOON";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !address) {
      router.push("/");
    }
  }, [address, router, isMounted]);

  useEffect(() => {
    if (address) {
      fetchVotingSessions();
      fetchVotingPower();
      checkIsAdmin();
      fetchPolls();
    }
  }, [address]);

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeRemaining: Record<string, string> = {};
      votingSessions.forEach(session => {
        newTimeRemaining[session.id] = formatTimeRemaining(session.endTime);
        checkSessionStatus(session);
      });
      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [votingSessions]);

  const checkIsAdmin = async () => {
    if (!address) return;
    try {
      const response = await fetch(`/api/user-token?address=${address}`);
      const data = await response.json();
      setIsAdmin(data.token?.tokenName === tokenName);
    } catch (error) {
      console.error('Failed to check admin status:', error);
    }
  };

  const fetchVotingPower = async () => {
    if (!address) return;
    try {
      const balances = await fetchOrdAddress(address);
      const tokenBalance = balances?.find((rune: Rune) => rune.name === tokenName)?.balance || 0;
      setVotingPower(tokenBalance);
    } catch (error) {
      console.error('Failed to fetch voting power:', error);
    }
  };

  const fetchVotingSessions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/voting/sessions/${encodeURIComponent(tokenName)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch voting sessions');
      }

      // Get user's voted questions
      const votesResponse = await fetch(`/api/voting/${encodeURIComponent(tokenName)}/user-votes?walletAddress=${address}`);
      const { votedQuestionIds } = await votesResponse.json();
      const votedQuestions = new Set(votedQuestionIds);
      
      // Filter out archived sessions and format remaining ones
      const formattedSessions = (data.questions || [])
        .filter((q: any) => q.status !== 'archived')
        .map((q: any) => ({
          id: q.id,
          question: q.question,
          startTime: q.startTime,
          endTime: q.endTime,
          status: q.status,
          hasVoted: votedQuestions.has(q.id),
          results: {
            yesVotes: Number(q.results.yesVotes),
            noVotes: Number(q.results.noVotes),
            totalVoters: Number(q.results.totalVoters),
            totalVotingPower: Number(q.results.totalVotingPower)
          }
        }));

      setVotingSessions(formattedSessions);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (sessionId: string, choice: 'yes' | 'no') => {
    if (!address || !votingPower) return;
    try {
      const response = await fetch(`/api/voting/${encodeURIComponent(tokenName)}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: sessionId,
          walletAddress: address,
          choice,
          tokenBalance: votingPower
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit vote');
      }

      // Update points after voting
      await fetch('/api/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          token: tokenName,
          type: 'voting'
        })
      });

      await fetchVotingSessions();
      toast.success('Vote submitted successfully');
    } catch (error) {
      console.error('Failed to submit vote:', error);
      toast.error('Failed to submit vote');
    }
  };

  const handleCreateVoting = async (data: VotingFormData) => {
    try {
      const response = await fetch('/api/voting/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: data.question,
          startTime: data.startTime,
          endTime: data.endTime,
          token: tokenName,
          createdBy: address || 'system'
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create voting session');
      }

      setShowVotingForm(false);
      toast.success('Voting session created successfully!');
      await fetchVotingSessions();
    } catch (error) {
      console.error('Error creating voting session:', error);
      toast.error('Failed to create voting session');
    }
  };

  const checkSessionStatus = async (session: VotingSession) => {
    const now = new Date().getTime();
    const endTime = new Date(session.endTime).getTime();
    
    if (now >= endTime && session.status === 'active') {
      try {
        const response = await fetch(`/api/voting/${encodeURIComponent(tokenName)}/update-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId: session.id,
            status: 'completed',
            hasEnded: true
          })
        });

        if (response.ok) {
          await fetchVotingSessions();
        }
      } catch (error) {
        console.error('Failed to update session status:', error);
      }
    }
  };

  const handleArchiveSession = async (session: VotingSession) => {
    if (!isAdmin) {
      toast.error('Only token admin can archive sessions');
      return;
    }

    try {
      const response = await fetch('/api/voting/archive-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenName,
          questionId: session.id,
          adminAddress: address
        })
      });

      if (!response.ok) {
        throw new Error('Failed to archive session');
      }

      toast.success('Session archived successfully');
      fetchVotingSessions();
    } catch (error) {
      console.error('Error archiving session:', error);
      toast.error('Failed to archive session');
    }
  };

  const fetchPolls = async () => {
    try {
      const response = await fetch(`/api/polls/${encodeURIComponent(tokenName)}`);
      const data = await response.json();
      if (response.ok) {
        // Filter out only archived polls, keep active and completed
        const filteredPolls = data.polls.filter((poll: any) => poll.status !== 'archived');
        setPolls(filteredPolls);
        
        // Check status of active polls
        filteredPolls.forEach((poll: any) => {
          if (poll.status === 'active') {
            checkPollStatus(poll);
          }
        });
      }
    } catch (error) {
      console.error('Failed to fetch polls:', error);
    }
  };

  const handlePollVote = async (pollId: string, optionId: string) => {
    if (!address || !votingPower) return;
    
    try {
      const voteResponse = await fetch('/api/polls/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId,
          optionId,
          walletAddress: address,
          votingPower: votingPower,
          token: tokenName
        })
      });

      if (!voteResponse.ok) {
        const errorData = await voteResponse.json();
        throw new Error(errorData.error || 'Failed to submit vote');
      }

      // Update points after poll voting
      const pointsResponse = await fetch('/api/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          token: tokenName,
          type: 'polling'
        })
      });

      if (!pointsResponse.ok) {
        console.error('Failed to update points');
      }

      await fetchPolls();
      toast.success('Vote submitted successfully');
    } catch (error) {
      console.error('Failed to vote:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to vote');
    }
  };

  const handleArchivePoll = async (pollId: string) => {
    if (!isAdmin) return;
    
    try {
      const response = await fetch(`/api/polls/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId,
          token: tokenName
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to archive poll');
      }

      await fetchPolls();
      toast.success('Poll archived successfully');
    } catch (error) {
      console.error('Failed to archive poll:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to archive poll');
    }
  };

  const checkPollStatus = async (poll: any) => {
    const now = new Date().getTime();
    const endTime = new Date(poll.endTime).getTime();
    
    if (now >= endTime && poll.status === 'active') {
      try {
        const response = await fetch(`/api/polls/update-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pollId: poll.id,
            token: tokenName,
            status: 'completed',
            hasEnded: true
          })
        });

        if (response.ok) {
          await fetchPolls();
        }
      } catch (error) {
        console.error('Failed to update poll status:', error);
      }
    }
  };

  if (!isMounted) return null;
  
  const handleCreatePoll = async (data: PollFormData) => {
  try {
    const response = await fetch('/api/polls/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        token: tokenName,
        createdBy: address
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create poll');
    }

    setShowPollForm(false);
    toast.success('Poll created successfully!');
    await fetchPolls();
  } catch (error) {
    console.error('Error creating poll:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to create poll');
  }
};

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:to-black text-black dark:text-white">
      <NavBar address={address} />
      
      <main className="flex flex-col items-start p-8 mt-20 max-w-7xl mx-auto w-full">
        <div className="w-full">
          <h1 className="text-4xl font-bold mb-8">{tokenName} Dashboard</h1>

          {/* Token Balance Section */}
          <div className="mb-8 p-6 rounded-lg bg-white dark:bg-white/10 backdrop-blur-sm border border-gray-200 dark:border-transparent">
            <h2 className="text-xl font-semibold mb-4">Your Voting Power</h2>
            <div className="text-3xl font-bold">
              {votingPower.toLocaleString()} {tokenName}
            </div>
          </div>

          {/* Voting Sessions Section */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-8">Loading voting sessions...</div>
            ) : error ? (
              <div className="text-red-500 text-center py-8">{error}</div>
            ) : (
              <>
                {votingSessions && votingSessions.length > 0 ? (
                  votingSessions.map((session: any) => (
                    <div key={session.id} className="p-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <h3 className="text-2xl font-semibold mb-4">{session.question}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        {timeRemaining[session.id] || formatTimeRemaining(session.endTime)}
                      </div>

                      {session.hasVoted && (
                        <div className="text-red-400 mb-4">Already voted</div>
                      )}

                      <div className="space-y-4">
                        {/* Always show results section */}
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold">
                            {session.status === 'completed' ? 'Final Results' : 'Current Results'}
                          </h4>
                          
                          {/* Yes Votes */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Yes</span>
                              <span>{((session.results.yesVotes / session.results.totalVotingPower) * 100).toFixed(1)}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 transition-all duration-500"
                                style={{ 
                                  width: `${(session.results.yesVotes / session.results.totalVotingPower) * 100}%` 
                                }}
                              />
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {session.results.yesVotes.toLocaleString()} votes ({session.results.yesVotes.toLocaleString()} {tokenName})
                            </div>
                          </div>

                          {/* No Votes */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>No</span>
                              <span>{((session.results.noVotes / session.results.totalVotingPower) * 100).toFixed(1)}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-red-500 transition-all duration-500"
                                style={{ 
                                  width: `${(session.results.noVotes / session.results.totalVotingPower) * 100}%` 
                                }}
                              />
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {session.results.noVotes.toLocaleString()} votes ({session.results.noVotes.toLocaleString()} {tokenName})
                            </div>
                          </div>
                        </div>

                        {/* Voting buttons - only show if active and not voted */}
                        {session.status === 'active' && votingPower > 0 && !session.hasVoted && (
                          <div className="flex gap-4">
                            <button
                              onClick={() => handleVote(session.id, 'yes')}
                              className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => handleVote(session.id, 'no')}
                              className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                            >
                              No
                            </button>
                          </div>
                        )}

                        {/* Summary Section */}
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                          Total votes: {session.results.totalVoters}
                          <br />
                          Total voting power: {session.results.totalVotingPower.toLocaleString()} {tokenName}
                        </div>

                        {/* Status Messages */}
                        {session.status === 'completed' && (
                          <div className="text-sm text-gray-400 mt-2 space-y-1">
                            <div>Voting has ended</div>
                            {(() => {
                              const results = calculateVoteResults(session.results.yesVotes, session.results.noVotes);
                              if (results) {
                                return (
                                  <>
                                    <div>
                                      Winner: <span className={results.color}>{results.winner}</span> ({results.winningPercentage.toFixed(1)}%)
                                    </div>
                                    <div>
                                      Winning margin: {results.margin.toFixed(1)}%
                                    </div>
                                    {isAdmin && (
                                      <button
                                        onClick={() => handleArchiveSession(session)}
                                        className="mt-4 w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                      >
                                        Archive This Session
                                      </button>
                                    )}
                                  </>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No voting sessions available
                  </p>
                )}
              </>
            )}
          </div>

          {/* Create New Voting Button - Only shown to admin */}
          {isAdmin && (
            <div className="mt-8">
              <button
                onClick={() => setShowVotingForm(true)}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
              >
                Create New Voting Session
              </button>
            </div>
          )}

          {/* Voting Form Modal */}
          {showVotingForm && (
            <CreateVotingForm
              isOpen={showVotingForm}
              onClose={() => setShowVotingForm(false)}
              onSubmit={handleCreateVoting}
            />
          )}
        </div>

        {/* Active Polls Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Active Polls</h2>
          {polls && polls.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {polls.map(poll => (
                <div key={poll.id} className="p-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  {/* Poll Header */}
                  <h3 className="text-2xl font-semibold mb-4">{poll.pollQuestion}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    {poll.status === 'completed' ? 'Ended' : formatTimeRemaining(poll.endTime)}
                  </div>

                  {/* Poll Options */}
                  <div className="space-y-4">
                    {poll.options.map((option, index) => {
                      const votes = poll.results[`poll${index + 1}`] || 0;
                      const totalVotes = poll.results.totalVotingPower || 0;
                      const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                      
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">{option}</span>
                            <span>{percentage.toFixed(1)}%</span>
                          </div>
                          
                          <div className="relative">
                            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 transition-all duration-500 ease-out"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            
                            <button
                              onClick={() => handlePollVote(poll.id, `poll${index + 1}`)}
                              disabled={!votingPower || poll.results.voters?.includes(address || '')}
                              className="mt-2 w-full px-4 py-2 text-left text-sm hover:bg-white/5 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {votes.toLocaleString()} votes ({votes.toLocaleString()} {tokenName})
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Poll Summary */}
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                      <div>Total votes: {poll.results.totalVoters?.toLocaleString() || 0}</div>
                      <div>Total voting power: {poll.results.totalVotingPower?.toLocaleString() || 0} {tokenName}</div>
                      
                      {poll.status === 'completed' && (
                        <div className="mt-4">
                          <div className="font-semibold text-base">Final Results</div>
                          {poll.options.map((option, index) => {
                            const votes = poll.results[`poll${index + 1}`] || 0;
                            const percentage = poll.results.totalVotingPower > 0 
                              ? (votes / poll.results.totalVotingPower) * 100 
                              : 0;
                            return (
                              <div key={index} className="flex justify-between mt-2">
                                <span>{option}</span>
                                <span>{percentage.toFixed(1)}% ({votes.toLocaleString()} {tokenName})</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Admin Archive Button */}
                    {isAdmin && poll.status === 'completed' && (
                      <button
                        onClick={() => handleArchivePoll(poll.id)}
                        className="mt-4 w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                      >
                        Archive Poll
                      </button>
                    )}
                  </div>
                  
                  {poll.results.voters?.includes(address || '') && (
                    <div className="mt-4 text-sm text-blue-400 text-center">
                      You have already voted
                    </div>
                  )}

                  {poll.status === 'completed' && (
                    <div className="mt-4 text-sm text-gray-400 text-center">
                      Voting has ended
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No active polls available
            </p>
          )}
        </div>

        {/* Create New Poll Button - Only shown to admin */}
        {isAdmin && (
          <div className="mt-8">
            <button
              onClick={() => setShowPollForm(true)}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
            >
              Create New Poll
            </button>
          </div>
        )}

        {/* Poll Form Modal */}
        <PollForm
          isOpen={showPollForm}
          onClose={() => setShowPollForm(false)}
          onSubmit={handleCreatePoll}
          tokenName={tokenName}
        />
    {/* Message Board and Participation Points Section */}
<div className="mt-8 flex flex-col md:flex-row gap-4 w-full">
  {/* Participation Points Section */}
  <div className="flex-1 md:max-w-sm">
    <ParticipationPoints
      address={address}
      isAdmin={isAdmin}
      token={tokenName}
    />
  </div>
  {/* Message Board Section */}
  <div className="flex-1">
    <MessageBoard
      tokenName={tokenName}
      isAdmin={isAdmin}
      address={address || ''}
    />
  </div>
</div>
      </main>
    </div>
  );
}