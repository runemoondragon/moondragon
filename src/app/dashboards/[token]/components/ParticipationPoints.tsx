import { useState, useEffect } from 'react';
import { UserPoints, LeaderboardEntry } from '@/types/points';

interface ParticipationPointsProps {
  address: string;
  isAdmin: boolean;
  token: string;
}

export default function ParticipationPoints({ address, isAdmin, token }: ParticipationPointsProps) {
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const fetchPoints = async () => {
    if (!address) return;
    
    const response = await fetch(`/api/points?walletAddress=${address}&token=${encodeURIComponent(token)}`);
    const data = await response.json();
    setUserPoints(data);
    
    if (isAdmin) {
      const leaderboardResponse = await fetch(`/api/points?token=${encodeURIComponent(token)}`);
      const leaderboardData = await leaderboardResponse.json();
      setLeaderboard(leaderboardData);
    }
  };

  useEffect(() => {
    fetchPoints();
  }, [address, isAdmin]);

  if (!address) return null;

  return (
    <div className="mt-8 p-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <h3 className="text-2xl font-semibold mb-6">Participation Points</h3>
      
      {/* User Points */}
      {userPoints && (
        <div className="mb-6">
          <h4 className="text-lg font-medium mb-4">Your Points</h4>
          <div className="grid grid-cols-3 gap-4">
            {/*<div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Voting Points</div>
              <div className="text-2xl font-bold">{userPoints.votingPoints}</div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Polling Points</div>
              <div className="text-2xl font-bold">{userPoints.pollingPoints}</div>
            </div>*/}
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400"></div>
              <div className="text-2xl font-bold">{userPoints.totalPoints}</div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard - Only visible to admins */}
      {isAdmin && leaderboard.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4">Leaderboard</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 dark:text-gray-400">
                  <th className="pb-2">Rank</th>
                  <th className="pb-2">Wallet</th>
                  <th className="pb-2">Voting</th>
                  <th className="pb-2">Polling</th>
                  <th className="pb-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => (
                  <tr key={entry.walletAddress} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="py-2">{entry.rank}</td>
                    <td className="py-2">{entry.walletAddress.slice(0, 6)}...{entry.walletAddress.slice(-4)}</td>
                    <td className="py-2">{entry.votingPoints}</td>
                    <td className="py-2">{entry.pollingPoints}</td>
                    <td className="py-2">{entry.totalPoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}