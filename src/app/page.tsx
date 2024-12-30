/* eslint-disable react/no-unescaped-entities */
"use client";
import { useLaserEyes, LaserEyesLogo } from "@omnisat/lasereyes";
import ConnectWallet from "@/components/ConnectWallet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState, useEffect } from "react";
import { fetchOrdAddress, RuneBalance } from "@/lib/runebalance";
import { BTC_MESSAGE_TO_SIGN, ACCESS_TOKENS, AccessToken } from "@/lib/const";
import { useRouter } from "next/navigation";
import { FiCopy, FiTwitter } from 'react-icons/fi';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavBar } from "@/components/NavBar";
import * as Tooltip from '@radix-ui/react-tooltip';
import { Footer } from "@/components/Footer";
import { isMobile } from 'react-device-detect';

const truncateAddress = (address: string) => {
  if (!address) return '';
  const start = address.slice(0, 6);
  const end = address.slice(-4);
  return `${start}...${end}`;
};

export default function Home() {
  const { address, signMessage } = useLaserEyes();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [runeBalances, setRuneBalances] = useState<RuneBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string | JSX.Element>("");
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [tokenRequirements, setTokenRequirements] = useState<Record<string, boolean>>({});
  const [filteredTokens, setFilteredTokens] = useState<AccessToken[]>([]);
  const [dynamicTokens, setDynamicTokens] = useState<AccessToken[]>([]);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<keyof typeof cardContents>('About');
  const [showAboutTooltip, setShowAboutTooltip] = useState(false);
  const [showDashboardsTooltip, setShowDashboardsTooltip] = useState(false);
  const [showRequirementsTooltip, setShowRequirementsTooltip] = useState(false);

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

  useEffect(() => {
    const checkAllTokens = async () => {
      if (!runeBalances.length) return;

      const requirements: Record<string, boolean> = {};
      
      for (const token of ACCESS_TOKENS) {
        try {
          const runeBalance = runeBalances.find(rune => rune.name === token.name);
          const currentBalance = runeBalance ? parseInt(runeBalance.balance.replace(/,/g, '')) : 0;
          const requiredBalance = token.requiredBalance;

          requirements[token.name] = currentBalance >= requiredBalance;
        } catch (error) {
          requirements[token.name] = false;
        }
      }

      setTokenRequirements(requirements);
    };

    if (address && runeBalances.length > 0) {
      checkAllTokens();
    }
  }, [address, runeBalances]);

  useEffect(() => {
    if (!runeBalances.length) return;
    
    const fetchAndFilterTokens = async () => {
      try {
        // Get dynamic tokens
        const response = await fetch('/api/dynamic-tokens');
        if (!response.ok) throw new Error('Failed to fetch dynamic tokens');
        const dynamicTokens = await response.json();
        
        // Combine with static tokens from const.ts
        const allTokens = [...ACCESS_TOKENS, ...dynamicTokens];
        
        const filtered = allTokens.filter(token => {
          const runeBalance = runeBalances.find(rune => rune.name === token.name);
          const currentBalance = runeBalance ? parseInt(runeBalance.balance.replace(/,/g, '')) : 0;
          
          if (token.name === "BITBOARD•DASH") return true;
          return currentBalance >= token.requiredBalance;
        });
        
        const sortedFiltered = filtered.sort((a, b) => {
          if (a.name === "BITBOARD•DASH") return -1;
          if (b.name === "BITBOARD•DASH") return 1;
          return 0;
        });
        
        setFilteredTokens(sortedFiltered);
      } catch (error) {
        console.error('Error fetching dynamic tokens:', error);
        // Fallback to static tokens if dynamic tokens fetch fails
        const filtered = ACCESS_TOKENS.filter(token => {
          const runeBalance = runeBalances.find(rune => rune.name === token.name);
          const currentBalance = runeBalance ? parseInt(runeBalance.balance.replace(/,/g, '')) : 0;
          return token.name === "BITBOARD•DASH" || currentBalance >= token.requiredBalance;
        });
        setFilteredTokens(filtered);
      }
    };
    
    fetchAndFilterTokens();
  }, [runeBalances]);

  useEffect(() => {
    const fetchDynamicTokens = async () => {
      try {
        const response = await fetch('/api/dynamic-tokens');
        if (!response.ok) throw new Error('Failed to fetch tokens');
        const tokens = await response.json();
        setDynamicTokens(tokens);
      } catch (error) {
        console.error('Error fetching tokens:', error);
      }
    };

    fetchDynamicTokens();
  }, []);

  const handleAccessAttempt = async (token: AccessToken) => {
    if (!address || !signMessage) {
      setVerificationMessage("Please connect your wallet first");
      return;
    }

    setSelectedToken(token.name);
    setVerificationMessage("");
    setIsVerifying(true);

    const runeBalance = runeBalances.find(rune => rune.name === token.name);
    const currentBalance = runeBalance ? parseInt(runeBalance.balance.replace(/,/g, '')) : 0;
    const hasAccess = currentBalance >= token.requiredBalance;

    console.log(`Access attempt for ${token.name}:`, {
      currentBalance,
      requiredBalance: token.requiredBalance,
      hasAccess
    });

    if (!hasAccess) {
      setVerificationMessage(
        <span>
          Insufficient {token.name} balance. You must hold a minimum of {token.requiredBalance.toLocaleString()} tokens, you have {currentBalance.toLocaleString()}.{" "}
          <a 
            href={`https://luminex.io/rune/${encodeURIComponent(token.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 underline"
          >
            Get tokens
          </a>
        </span>
      );
      setIsVerifying(false);
      return;
    }

    try {
      const signature = await signMessage(BTC_MESSAGE_TO_SIGN);
      
      const payload = {
        address,
        signature,
        message: BTC_MESSAGE_TO_SIGN,
        tokenName: token.name
      };
      
      const response = await fetch('/api/auth', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.externalUrl) {
          window.open(data.externalUrl, '_blank');
          return;
        }

        setVerificationMessage(
          <span className="text-green-500">
            Access Granted: Welcome to the {token.name} Dashboard.
          </span>
        );
        router.push(token.dashboardPath);
      } else {
        setVerificationMessage(data.error || "Verification failed");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationMessage("Failed to verify wallet ownership");
    } finally {
      setIsVerifying(false);
    }
  };

  const cardContents = {
    'About': {
      title: 'About',
      content: 'Bitboard enables token-gated dashboards for Rune tokens, providing exclusive access to holders. Users can vote, manage proposals, and track results seamlessly, all without on-chain costs, ensuring efficient and scalable governance.'
    },
    'Dashboards': {
      title: 'Dashboards',
      content: 'Use BITBOARD•DASH to access the main dashboard, add tokens, set participation requirements, start voting and polls, and distribute tokens with the mass Rune send feature—streamlining community engagement and rewards'
    },
    'Requirements': {
      title: 'Requirements',
      content: 'You’ll need BITBOARD•DASH tokens to add your project. Set custom token requirements for your dashboard, Only users who meet the token requirements you set can interact with the dashboards you create.'
    }
  };

  const handleCardClick = (cardType: keyof typeof cardContents) => {
    if (isModalOpen && modalContent === cardType) {
      setIsModalOpen(false);
    } else {
      setModalContent(cardType);
      setIsModalOpen(true);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:to-black text-black dark:text-white">
      <NavBar address={address} />
      
      <main className="flex flex-col items-center justify-center flex-1 p-8 mt-16">
        <div className="flex flex-col items-center gap-8 max-w-4xl w-full">
          {/* Hero Section */}
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-5xl font-bold">
              Unlock Access with Your Rune Tokens
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Bitboard verifies rune wallet balance to grant exclusive access to governance, voting, and other privileges.
            </p>
          </div>
          {/* Connect Wallet Button */}
          {!address && (
            <div className="flex justify-center mb-15">
              <ConnectWallet />
            </div>
          )}

          {/* Add Token Grid before wallet connection */}
          {!address && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12 w-full">
              {dynamicTokens.slice(0, 9).map((token, index) => (
                <div
                  key={index}
                  className="p-6 rounded-lg bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-gray-800 hover:border-gray-700 transition-colors"
                  onClick={() => {
                    if (isMobile) {
                      window.location.href = 'https://luminex.io/rune/BITBOARD•DASH';
                    }
                  }}
                >
                  <h3 className="text-xl font-semibold mb-2">{token.name}</h3>
                  <p className="text-gray-400 mb-4">Required Balance: {token.requiredBalance.toLocaleString()}</p>
                  <div className="text-sm text-gray-500">
                    {token.description}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Wallet Connected Content */}
          {address && (
            <div className="w-full flex flex-col items-center gap-12">
              {/* Centered Rune Balances Section */}
              <div className="max-w-xl w-full">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-gray-800">
                  <h2 className="text-xl font-semibold mb-4">Your Rune Balances</h2>
                  {isLoading ? (
                    <p>Loading rune balances...</p>
                  ) : runeBalances.length > 0 ? (
                    <div className="space-y-3">
                      {runeBalances.map((rune, index) => (
                        <div
                          key={index}
                          className="p-4 rounded-lg bg-white/5"
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

                {/* Centered Access Button */}
                <div className="mt-6 flex flex-col items-center gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="px-6 py-2 text-white bg-orange-500 hover:bg-orange-600 rounded-lg flex items-center gap-2"
                        disabled={isVerifying}
                      >
                        {isVerifying ? "Verifying..." : "Access Dash"} <ChevronDown className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64">
                      {filteredTokens.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500 text-center">
                          No dashboard available for access with your current Connected wallet address
                        </div>
                      ) : (
                        filteredTokens.map((token) => {
                          const runeBalance = runeBalances.find(rune => rune.name === token.name);
                          const currentBalance = runeBalance ? parseInt(runeBalance.balance.replace(/,/g, '')) : 0;
                          const hasAccess = currentBalance >= token.requiredBalance;
                          
                          return (
                            <DropdownMenuItem
                              key={token.name}
                              onClick={() => handleAccessAttempt(token)}
                              className={cn(
                                "flex flex-col items-start gap-1 p-3",
                                hasAccess 
                                  ? "hover:bg-green-50 dark:hover:bg-green-900/20"
                                  : "hover:bg-red-50 dark:hover:bg-red-900/20"
                              )}
                            >
                              <div className="font-medium">{token.name}</div>
                              <div className="text-sm text-gray-500">
                                Required: {token.requiredBalance.toLocaleString()} tokens
                                <br />
                                Current: {currentBalance.toLocaleString()} tokens
                              </div>
                              <div className="text-xs mt-1">
                                {hasAccess ? (
                                  <span className="text-green-500">✅ Requirements met</span>
                                ) : (
                                  <span className="text-red-500">❌ Insufficient balance ({currentBalance.toLocaleString()} / {token.requiredBalance.toLocaleString()})</span>
                                )}
                              </div>
                            </DropdownMenuItem>
                          );
                        })
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  {verificationMessage && (
                    <p className="text-center text-yellow-500 max-w-md">
                      {verificationMessage}
                    </p>
                  )}
                </div>
              </div>

              {/* Info Cards at Bottom */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mt-8">
                <Tooltip.Provider>
                  {/* About Card */}
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <div
                        className="p-6 rounded-lg bg-white/10 backdrop-blur-sm border border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-white/20 transition-colors"
                        onClick={() => handleCardClick('About')}
                        onMouseEnter={() => {
                          if (!isMobile) {
                            setShowTooltip(true);
                          }
                        }}
                        onMouseLeave={() => {
                          if (!isMobile) {
                            setShowTooltip(false);
                          }
                        }}
                      >
                        <h2 className="text-xl font-semibold text-center">About</h2>
                      </div>
                    </Tooltip.Trigger>
                  </Tooltip.Root>
                  

                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <div
                        className="p-6 rounded-lg bg-white/10 backdrop-blur-sm border border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-white/20 transition-colors"
                        onClick={() => handleCardClick('Dashboards')}
                        onMouseEnter={() => {
                          if (!isMobile) {
                            setShowTooltip(true);
                          }
                        }}
                        onMouseLeave={() => {
                          if (!isMobile) {
                            setShowTooltip(false);
                          }
                        }}
                      >
                        <h2 className="text-xl font-semibold text-center">Dashboards</h2>
                      </div>
                    </Tooltip.Trigger>
                    {showTooltip && (
                      <Tooltip.Portal>
                        <Tooltip.Content
                          className="max-w-xs p-4 bg-gray-900 text-white text-sm rounded-lg shadow-lg"
                          sideOffset={5}
                        >
                          <p className="space-y-2">
                            Use BITBOARD•DASH to integrate your token and establish a tailored governance system.
                            <br /><br />
                            Set minimum requirements, initiate voting sessions, and effortlessly distribute Rune tokens to participants using the built-in mass Rune send feature.
                          </p>
                          <Tooltip.Arrow className="fill-gray-900" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    )}
                  </Tooltip.Root>

                  {/* Requirements Card */}
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <div
                        className="p-6 rounded-lg bg-white/10 backdrop-blur-sm border border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-white/20 transition-colors"
                        onClick={() => handleCardClick('Requirements')}
                        onMouseEnter={() => {
                          if (!isMobile) {
                            setShowTooltip(true);
                          }
                        }}
                        onMouseLeave={() => {
                          if (!isMobile) {
                            setShowTooltip(false);
                          }
                        }}
                      >
                        <h2 className="text-xl font-semibold text-center">Requirements</h2>
                      </div>
                    </Tooltip.Trigger>
                    
                  </Tooltip.Root>
                </Tooltip.Provider>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Modal for displaying content */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false);
            }
          }}
        >
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg max-w-xs">
            <h2 className="text-xl font-semibold mb-4">{cardContents[modalContent].title}</h2>
            <p className="space-y-2">
              {cardContents[modalContent].content}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
