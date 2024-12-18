"use client";
import { useEffect, useState } from 'react';
import { useLaserEyes } from '@omnisat/lasereyes';
import { toast } from 'react-hot-toast';
import { fetchOrdAddress } from "@/lib/runebalance";
import { NavBar } from "@/components/NavBar";
import { useRouter } from "next/navigation";
import VotingSection from './components/VotingSection';
import { ArchiveConfirmationModal } from '@/components/ArchiveConfirmationModal';
import { VotingSession } from '@/lib/types';
import ParticipationPoints from './components/ParticipationPoints';

interface RuneBalance {
  name: string;
  balance: number;
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

export default function TokenDashboard({ params }: { params: { token: string } }) {
  const tokenName = decodeURIComponent(params.token)
    .toUpperCase()
    .replace(/-/g, '•');

  const { address } = useLaserEyes();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [votingPower, setVotingPower] = useState(0);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<VotingSession | null>(null);
  const [archivedSessions, setArchivedSessions] = useState<VotingSession[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [votingSessions, setVotingSessions] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchVotingPower = async () => {
    if (!address) return;
    try {
      const balances = await fetchOrdAddress(address);
      const tokenBalance = balances?.find((rune: RuneBalance) => rune.name === tokenName)?.balance || 0;
      setVotingPower(tokenBalance);
    } catch (error) {
      console.error('Failed to fetch voting power:', error);
    }
  };

  const fetchPolls = async () => {
    try {
      const response = await fetch(`/api/polls/${encodeURIComponent(tokenName)}`);
      if (response.ok) {
        const data = await response.json();
        setPolls(data);
      }
    } catch (error) {
      console.error('Failed to fetch polls:', error);
    }
  };

  const fetchVotingSessions = async () => {
    try {
      const response = await fetch(`/api/voting/${encodeURIComponent(tokenName)}`);
      if (response.ok) {
        const data = await response.json();
        setVotingSessions(data);
      }
    } catch (error) {
      console.error('Failed to fetch voting sessions:', error);
    }
  };

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

  useEffect(() => {
    setIsMounted(true);
    if (address) {
      fetchVotingPower();
      fetchPolls();
      fetchVotingSessions();
      checkIsAdmin();
    }
  }, [address]);

  useEffect(() => {
    if (isMounted && !address) {
      router.push("/");
    }
  }, [isMounted, address, router]);

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
        const errorData = await pointsResponse.json();
        console.error('Failed to update points:', errorData);
      }

      await fetchPolls();
      toast.success('Vote submitted successfully');
    } catch (error) {
      console.error('Failed to vote:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to vote');
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:to-black text-black dark:text-white">
      <NavBar address={address} />
      
      <main className="flex flex-col items-start p-8 mt-20 max-w-7xl mx-auto w-full">
        <div className="w-full">
          <h1 className="text-4xl font-bold mb-8">{tokenName} Dashboard</h1>
          
          <div className="mb-6 p-4 rounded-lg bg-white/10 backdrop-blur-sm">
            <h2 className="text-lg text-gray-400">Your Voting Power</h2>
            <p className="text-3xl font-bold">{votingPower.toLocaleString()} {tokenName}</p>
          </div>
          
          {address && (
            <VotingSection walletAddress={address} />
          )}
        </div>
      </main>
      <ParticipationPoints address={address} isAdmin={isAdmin} token={tokenName} />
    </div>
  );
} 