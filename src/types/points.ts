export interface UserPoints {
  walletAddress: string;
  token: string;
  votingPoints: number;
  pollingPoints: number;
  totalPoints: number;
}

export interface LeaderboardEntry extends UserPoints {
  rank: number;
}