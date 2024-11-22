"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLaserEyes } from "@omnisat/lasereyes";
import { NavBar } from "@/components/NavBar";
import { TokenInfo } from "@/lib/types";
import { FiActivity, FiBook, FiUsers, FiClock } from 'react-icons/fi';

export default function UncommonGoodsDashboard() {
  const { address } = useLaserEyes();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTokenInfo = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/fetch-token-info');
      if (!response.ok) throw new Error('Failed to fetch token info');
      const data = await response.json();
      setTokenInfo(data);
    } catch (error) {
      console.error('Error fetching token info:', error);
      setTokenInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchTokenInfo();

    // Refresh every 5 minutes
    const interval = setInterval(fetchTokenInfo, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isMounted && !address) {
      router.push("/");
    }
  }, [address, router, isMounted]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:to-black text-black dark:text-white">
      <NavBar address={address} />
      
      <main className="flex flex-col items-start p-8 mt-20 max-w-7xl mx-auto w-full">
        <div className="w-full">
          <h1 className="text-4xl font-bold mb-8">Uncommon Goods Dashboard</h1>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Token Information */}
            <div className="col-span-2 p-6 rounded-lg bg-white/10 backdrop-blur-sm">
              <h2 className="text-xl font-semibold mb-4">Token Information</h2>
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              ) : tokenInfo ? (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Current Supply</p>
                      <p className="text-lg font-semibold">{tokenInfo.totalSupply}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Max Supply</p>
                      <p className="text-lg font-semibold">{tokenInfo.maxSupply}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Mint Status</p>
                      <p className="text-lg font-semibold">{tokenInfo.mintStatus}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Mint Progress</p>
                      <p className="text-lg font-semibold">{tokenInfo.additionalInfo.completedMints}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Mint Blocks</p>
                      <p className="text-sm">Start: {tokenInfo.additionalInfo.mintStartBlock}</p>
                      <p className="text-sm">End: {tokenInfo.additionalInfo.mintEndBlock}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Updated</p>
                      <p className="text-sm">{new Date(tokenInfo.lastUpdated).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-red-500">Failed to load token information</div>
              )}
            </div>

            {/* Statistics Card */}
            <div className="p-6 rounded-lg bg-white/10 backdrop-blur-sm">
              <h2 className="text-xl font-semibold mb-4">Statistics</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-500/10 rounded-lg">
                    <FiUsers className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Divisibility</p>
                    <p className="font-semibold">{tokenInfo?.additionalInfo.divisibility || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <FiClock className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Etched</p>
                    <p className="font-semibold">{tokenInfo?.additionalInfo.etched || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Resources Card */}
            <div className="p-6 rounded-lg bg-white/10 backdrop-blur-sm col-span-full">
              <h2 className="text-xl font-semibold mb-4">Resources</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <a 
                  href="https://www.ord.io/UNCOMMONGOODS"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <FiBook className="w-5 h-5" />
                  <div>
                    <p className="text-sm font-medium">Ord.io</p>
                    <p className="text-xs text-gray-500">View on Ord.io</p>
                  </div>
                </a>
                <a 
                  href="https://luminex.io/rune/UNCOMMON•GOODS"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <FiActivity className="w-5 h-5" />
                  <div>
                    <p className="text-sm font-medium">Luminex</p>
                    <p className="text-xs text-gray-500">Trade on Luminex</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 