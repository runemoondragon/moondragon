import { VotingSession } from '@/lib/types';

interface Props {
  session: VotingSession;
}

export default function NextSessionInfo({ session }: Props) {
  const startTime = new Date(session.startTime);
  const now = new Date();
  const timeUntilStart = startTime.getTime() - now.getTime();
  
  const formatTimeRemaining = () => {
    const minutes = Math.floor(timeUntilStart / (1000 * 60));
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    return `${hours} hours ${minutes % 60} minutes`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Next Voting Session</h3>
      <p className="mb-2">Starting in: {formatTimeRemaining()}</p>
      <p className="text-gray-600">
        {startTime.toLocaleString()}
      </p>
    </div>
  );
} 