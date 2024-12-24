"use client";
import Image from 'next/image';
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from 'next/link';
import { FiCopy } from 'react-icons/fi';
import ConnectWallet from "@/components/ConnectWallet";

const truncateAddress = (address: string) => {
  if (!address) return '';
  const start = address.slice(0, 6);
  const end = address.slice(-4);
  return `${start}...${end}`;
};

export function NavBar({ address }: { address?: string }) {
  return (
    <nav className="flex items-center justify-between px-4 md:px-6 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/logo.png"
          alt="BitBoard Logo"
          width={32}
          height={32}
          className="w-8 h-8"
          priority
          unoptimized
        />
        <span className="hidden md:flex items-center font-bold text-xl hover:text-orange-500 transition-colors gap-2">
          BitBoard
          <span className="text-xs px-2 py-0.5 bg-orange-500 text-white rounded-full">Beta</span>
        </span>
      </Link>

      <div className="flex items-center gap-3 md:gap-6">
        {address && (
          <div className="hidden md:block bg-yellow-50 dark:bg-yellow-900/20 px-4 py-2 rounded-lg">
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
        {/* Mobile address display */}
        {address && (
          <button 
            onClick={() => navigator.clipboard.writeText(address)}
            className="md:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <FiCopy size={20} />
          </button>
        )}
        <ConnectWallet />
        <ThemeToggle />
      </div>
    </nav>
  );
} 