import Image from 'next/image';
import Link from 'next/link';

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
              href="https://x.com/Bitboardme"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-500 transition-colors"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
} 