import Image from 'next/image';
import Link from 'next/link';
import { FiTwitter } from 'react-icons/fi';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Logo and Copyright Section */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <Image 
                src="/logo.png"
                alt="BitBoard Logo"
                width={24}
                height={24}
                className="w-6 h-6"
                priority
                unoptimized
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                © BitBoard 2024 – All Rights Reserved
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Unlock Utility for Your Rune Token
            </p>
          </div>

          {/* Explore Section */}
          <div className="flex items-center gap-6">
            <Link 
              href="https://bitboard.gitbook.io/bitboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-500 transition-colors text-sm"
            >
              Docs
            </Link>
            <Link 
              href="https://bitboard.gitbook.io/bitboard/getting-started/publish-your-docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-500 transition-colors text-sm"
            >
              FAQ
            </Link>
            <Link 
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-500 transition-colors"
            >
              <FiTwitter size={16} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
} 