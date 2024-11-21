"use client";
import { LaserEyesLogo } from "@omnisat/lasereyes";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from 'next/link';
import { FiCopy, FiTwitter } from 'react-icons/fi';
import ConnectWallet from "@/components/ConnectWallet";

const truncateAddress = (address: string) => {
  if (!address) return '';
  const start = address.slice(0, 6);
  const end = address.slice(-4);
  return `${start}...${end}`;
};

export function NavBar({ address }: { address?: string }) {
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
} 