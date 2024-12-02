import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface VotingResultsProps {
  questionId: string;
}

export default function VotingResults({ questionId }: VotingResultsProps) {
  const { token } = useParams();
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    const fetchResults = async () => {
      const response = await fetch(`/api/voting/${token}/results?questionId=${questionId}`);
      const data = await response.json();
      setResults(data);
    };

    fetchResults();
  }, [questionId, token]);

  if (!results) return <div>Loading results...</div>;

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Results</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Yes votes:</span>
          <span>{results.yesVotes}</span>
        </div>
        <div className="flex justify-between">
          <span>No votes:</span>
          <span>{results.noVotes}</span>
        </div>
        <div className="flex justify-between">
          <span>Total voting power:</span>
          <span>{results.totalVotingPower}</span>
        </div>
      </div>
    </div>
  );
} 