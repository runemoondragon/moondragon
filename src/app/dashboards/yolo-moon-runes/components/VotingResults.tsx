import { VotingSession } from '@/lib/types';

interface Props {
  session: VotingSession;
}

export default function VotingResults({ session }: Props) {
  const { question, options, results } = session;
  if (!results) return null;

  const getPercentage = (option: string) => {
    const votes = results.votingPower[option] || 0;
    return ((votes / results.totalVotingPower) * 100).toFixed(2);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">{question}</h2>
      
      <div className="space-y-4">
        {options.map(option => (
          <div key={option} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className={`font-medium ${option === results.winningOption ? 'text-green-600' : ''}`}>
                {option}
                {option === results.winningOption && ' (Winner)'}
              </span>
              <span>{getPercentage(option)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full ${
                  option === results.winningOption ? 'bg-green-600' : 'bg-blue-600'
                }`}
                style={{ width: `${getPercentage(option)}%` }}
              />
            </div>
            <div className="text-sm text-gray-600">
              {results.votes[option] || 0} votes ({results.votingPower[option] || 0} voting power)
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Total Votes: {results.totalVotes}</span>
          <span>Total Voting Power: {results.totalVotingPower}</span>
        </div>
      </div>
    </div>
  );
} 