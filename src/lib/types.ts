export interface TokenAssociation {
  walletAddress: string;
  tokenName: string;
  requiredBalance: number;
  associatedUrl?: string;
  createdAt: Date;
}

export interface TokenInfo {
  name: string;
  symbol: string;
  totalSupply: string;
  maxSupply: string;
  holders: string;
  mintStatus: string;
  contractAddress: string;
  lastUpdated: string;
  additionalInfo: {
    divisibility: string;
    etched: string;
    mintStartBlock: string;
    mintEndBlock: string;
    completedMints: string;
    pendingMints: string;
    remainingMints: string;
  };
}

export type VotingSessionStatus = 'active' | 'completed' | 'archived';

export interface VotingQuestion {
  id: string;
  question: string;
  startTime: string;
  endTime: string;
  status: 'active' | 'completed';
  createdBy: string;
}

export interface VotingQuestionsData {
  questions: VotingQuestion[];
}

export interface Vote {
  questionId: string;
  walletAddress: string;
  choice: 'yes' | 'no';
  tokenBalance: number;
  timestamp: string;
}

export interface VotingResults {
  yesVotes: number;
  noVotes: number;
  totalVoters: number;
  totalVotingPower: number;
  winningChoice?: 'yes' | 'no';
}