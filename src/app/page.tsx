/* eslint-disable react/no-unescaped-entities */
"use client";
import { useLaserEyes, LaserEyesLogo } from "@omnisat/lasereyes";
import ConnectWallet from "@/components/ConnectWallet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState, useEffect } from "react";
import { fetchOrdAddress, RuneBalance } from "@/lib/runebalance";
import { BTC_MESSAGE_TO_SIGN } from "@/lib/const";
import { useRouter } from "next/navigation";
import { FiCopy, FiTwitter } from 'react-icons/fi';
import Link from 'next/link';

const truncateAddress = (address: string) => {
  if (!address) return '';
  const start = address.slice(0, 6);
  const end = address.slice(-4);
  return `${start}...${end}`;
};

const NavBar = ({ address }: { address?: string }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-2">
        <LaserEyesLogo width={32} color={address ? "green" : "orange"} />
        <span className="font-bold text-xl">RuneCheck</span>
      </div>
      
      <div className="flex items-center gap-6">
        <Link 
          href="/support" 
          className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Support
        </Link>
        
        <a 
          href="https://x.com/liquidordinals" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <FiTwitter size={20} />
        </a>

        {address && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 px-4 py-2 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-300">
                {truncateAddress(address)}
              </span>
              <button 
                onClick={() => navigator.clipboard.writeText(address)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <FiCopy size={16} />
              </button>
            </div>
          </div>
        )}

        <ConnectWallet />
        <ThemeToggle />
      </div>
    </nav>
  );
};

export default function Home() {
  const { address, signMessage } = useLaserEyes();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [runeBalances, setRuneBalances] = useState<RuneBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string | JSX.Element>("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const getRuneBalances = async () => {
      if (!address) return;
      
      setIsLoading(true);
      try {
        const balances = await fetchOrdAddress(address);
        setRuneBalances(balances || []);
      } catch (error) {
        console.error("Error fetching rune balances:", error);
        setRuneBalances([]);
      } finally {
        setIsLoading(false);
      }
    };

    getRuneBalances();
  }, [address]);

  const handleVerification = async () => {
    if (!address || !signMessage) {
      console.log("Missing address or signMessage function");
      return;
    }
    
    setVerificationMessage("");
    setIsVerifying(true);
    try {
      console.log("Attempting to sign message:", BTC_MESSAGE_TO_SIGN);
      const signature = await signMessage(BTC_MESSAGE_TO_SIGN);
      console.log("Got signature:", signature);
      
      const payload = {
        address,
        signature,
        message: BTC_MESSAGE_TO_SIGN,
        paymentAddress: address,
      };
      
      console.log("Sending auth request with payload:", payload);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/auth`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        }
      );

      console.log("Auth response status:", response.status);
      const data = await response.json();
      console.log("Auth response data:", data);

      if (response.ok) {
        router.push(process.env.NODE_ENV === 'production' ? '/moondragon/secret' : '/secret');
      } else {
        if (data.error === "Insufficient RUNE•MOON•DRAGON balance") {
          setVerificationMessage(
            <span>
              Oops, you don&apos;t have enough RUNE•MOON•DRAGON. Grab some{" "}
              <a 
                href="https://luminex.io/rune/RUNE•MOON•DRAGON" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 underline"
              >
                here
              </a>
              ! Don&apos;t let the dragons down!
            </span>
          );
        } else {
          setVerificationMessage(data.error || "Verification failed");
        }
      }
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationMessage("Failed to verify wallet ownership");
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isMounted) return null;

  const hasRequiredBalance = runeBalances.some(
    (rune) => rune.name === "RUNE•MOON•DRAGON" && parseInt(rune.balance) >= 1000000
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:to-black text-black dark:text-white">
      <NavBar address={address} />
      
      <main className="flex flex-col items-center justify-center flex-1 p-8 mt-16">
        <div className="flex flex-col items-center gap-8 max-w-3xl w-full">
          <h1 className="text-5xl font-bold text-center">
            Unlock Access with Your Rune Balance
          </h1>
          <p className="text-xl text-center text-gray-600 dark:text-gray-300">
            RuneCheck verifies your wallet balance to grant exclusive access to governance, voting, and other privileges.
          </p>

          {/* Rest of your content */}
          {address && (
            <div className="w-full">
              {/* Rune Balances Section */}
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-3">Your Rune Balances</h2>
                {isLoading ? (
                  <p>Loading rune balances...</p>
                ) : runeBalances.length > 0 ? (
                  <div className="grid gap-3">
                    {runeBalances.map((rune, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg bg-white/10 backdrop-blur-sm"
                      >
                        <p className="font-semibold">{rune.name}</p>
                        <p>Balance: {rune.balance}</p>
                        <p>Symbol: {rune.symbol}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No rune balances found</p>
                )}
              </div>

              {/* Verification Section */}
              <div className="flex flex-col items-center gap-3 mt-8">
                <button
                  onClick={handleVerification}
                  disabled={isVerifying}
                  className={`px-6 py-2 text-white rounded-lg disabled:opacity-50 ${
                    hasRequiredBalance 
                      ? 'bg-orange-500 hover:bg-orange-600' 
                      : 'bg-gray-500 hover:bg-gray-600'
                  }`}
                >
                  {isVerifying ? "Verifying..." : "Access Dragon Dashboard"}
                </button>
                
                {verificationMessage && (
                  <p className={`text-center ${
                    typeof verificationMessage === 'string' && verificationMessage.includes('broke boy') 
                      ? 'text-red-500 font-bold animate-bounce' 
                      : 'text-yellow-500'
                  }`}>
                    {verificationMessage}
                  </p>
                )}
                
                {!hasRequiredBalance && !verificationMessage && (
                  <p className="text-sm text-gray-500 text-center">
                    You need at least 1,000,000 RUNE•MOON•DRAGON tokens to access the Dragon dashboard
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
