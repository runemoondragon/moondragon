import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import VotingResults from './VotingResults';

interface VotingProps {
  walletAddress: string;
}

interface Question {
  id: string;
  token: string;
  question: string;
  startTime: string;
  endTime: string;
  status: string;
  results: {
    yesVotes: number;
    noVotes: number;
    totalVoters: number;
    totalVotingPower: number;
    hasEnded: boolean;
  };
}

interface VoteCheck {
  userVoted: boolean;
  results: {
    yesVotes: number;
    noVotes: number;
    totalVoters: number;
    totalVotingPower: number;
    hasEnded: boolean;
  };
  votes: any[];
}

export default function VotingSection({ walletAddress }: VotingProps) {
  const { token } = useParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [votedQuestions, setVotedQuestions] = useState<Set<string>>(new Set());
  const [voteChecks, setVoteChecks] = useState<Record<string, VoteCheck>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkVoteStatus = async (questionId: string) => {
    try {
      const response = await fetch(`/api/voting/${token}/check-vote?questionId=${questionId}&walletAddress=${walletAddress}`);
      if (!response.ok) throw new Error('Failed to check vote status');
      const voteCheck = await response.json();
      console.log('Vote check:', voteCheck);
      setVoteChecks(prev => ({
        ...prev,
        [questionId]: voteCheck
      }));
      if (voteCheck.userVoted) {
        setVotedQuestions(prev => new Set(Array.from(prev).concat([questionId])));
      }
    } catch (error) {
      console.error('Error checking vote status:', error);
    }
  };

  const fetchVotingData = async () => {
    try {
      const response = await fetch(`/api/voting/${token}`);
      if (!response.ok) {
        throw new Error('Failed to fetch voting data');
      }
      const data = await response.json();
      setQuestions(data.questions);
      
      // Check vote status for each question
      data.questions.forEach((q: Question) => checkVoteStatus(q.id));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      fetchVotingData();
    }
  }, [token, walletAddress]);

  const handleVote = async (questionId: string, choice: 'yes' | 'no') => {
    try {
      // Make sure we have the token from params and it's a string
      const tokenParam = token as string;
      if (!tokenParam) {
        throw new Error('Token is required');
      }

      const response = await fetch(`/api/voting/${encodeURIComponent(tokenParam)}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId,
          walletAddress,
          choice,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit vote');
      }

      setVotedQuestions(prev => new Set(Array.from(prev).concat([questionId])));
      await fetchVotingData();
    } catch (error) {
      console.error('Voting error:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit vote');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (questions.length === 0) return <div>No active voting questions</div>;

  return (
    <div className="space-y-6">
      {questions.map(question => (
        <div key={question.id} className="bg-white p-6 rounded-lg shadow">
          {votedQuestions.has(question.id) ? (
            <VotingResults questionId={question.id} />
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-4">{question.question}</h2>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleVote(question.id, 'yes')}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Yes
                </button>
                <button
                  onClick={() => handleVote(question.id, 'no')}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  No
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}