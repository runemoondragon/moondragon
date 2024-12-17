export interface PollResults {
  totalVoters: number;
  totalVotingPower: number;
  hasEnded: boolean;
  voters: string[];
  [key: `poll${number}`]: number;
}

export interface PollingData {
  pollquestions: Array<{
    id: string;
    token: string;
    pollQuestion: string;
    options: string[];
    startTime: string;
    endTime: string;
    status: string;
    createdBy: string;
    results: PollResults;
  }>;
} 