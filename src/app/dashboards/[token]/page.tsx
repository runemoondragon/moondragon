"use client";
import { useEffect, useState } from 'react';
import { useLaserEyes } from '@omnisat/lasereyes';
import { toast } from 'react-hot-toast';
import { fetchOrdAddress } from "@/lib/runebalance";
import { NavBar } from "@/components/NavBar";
import { useRouter } from "next/navigation";
import VotingSection from './components/VotingSection';

interface RuneBalance {
  name: string;
  balance: number;
}

export default function TokenDashboard({ params }: { params: { token: string } }) {
  const tokenName = decodeURIComponent(params.token)
    .toUpperCase()
    .replace(/-/g, '•');

  const { address } = useLaserEyes();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [votingPower, setVotingPower] = useState(0);

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

  useEffect(() => {
    setIsMounted(true);
    if (address) {
      fetchVotingPower();
    }
  }, [address]);

  useEffect(() => {
    if (isMounted && !address) {
      router.push("/");
    }
  }, [isMounted, address, router]);

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
    </div>
  );
} 