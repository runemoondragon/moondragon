"use client";
import { useLaserEyes } from "@omnisat/lasereyes";
import { useState, useEffect } from "react";
import { fetchOrdAddress, RuneBalance } from "@/lib/runebalance";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/NavBar";

export default function DogGoToTheMoonDashboard() {
  const { address } = useLaserEyes();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [dogGoToTheMoonBalance, setDogGoToTheMoonBalance] = useState<RuneBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const getRuneBalance = async () => {
      if (!address) return;
      
      setIsLoading(true);
      try {
        const balances = await fetchOrdAddress(address);
        const dogGoToTheMoon = balances?.find((rune: RuneBalance) => rune.name === 'DOG•GO•TO•THE•MOON') || null;
        setDogGoToTheMoonBalance(dogGoToTheMoon);
      } catch (error) {
        console.error("Error fetching rune balance:", error);
        setDogGoToTheMoonBalance(null);
      } finally {
        setIsLoading(false);
      }
    };

    getRuneBalance();
  }, [address]);

  useEffect(() => {
    if (isMounted && !address) {
      router.push("/");
    }
  }, [address, router, isMounted]);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:to-black text-black dark:text-white">
      <NavBar address={address} />
      
      <main className="flex flex-col items-start p-8 mt-20 max-w-7xl mx-auto w-full">
        <div className="w-full">
          <h1 className="text-4xl font-bold mb-8">Dog Go To The Moon Dashboard</h1>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Rune Balance Section */}
            <div className="col-span-2">
              <h2 className="text-xl font-semibold mb-3">Your DOG•GO•TO•THE•MOON Balance</h2>
              {isLoading ? (
                <p>Loading balance...</p>
              ) : dogGoToTheMoonBalance ? (
                <div className="p-4 rounded-lg bg-white/10 backdrop-blur-sm">
                  <p className="font-semibold">{dogGoToTheMoonBalance.name}</p>
                  <p>Balance: {dogGoToTheMoonBalance.balance}</p>
                  <p>Symbol: {dogGoToTheMoonBalance.symbol}</p>
                </div>
              ) : (
                <p>No DOG•GO•TO•THE•MOON balance found</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 