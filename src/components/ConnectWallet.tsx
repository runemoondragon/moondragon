"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

import {
  LEATHER,
  MAGIC_EDEN,
  OKX,
  OYL,
  ORANGE,
  PHANTOM,
  UNISAT,
  useLaserEyes,
  WalletIcon,
  WIZZ,
  XVERSE,
  LaserEyesLogo,
} from "@omnisat/lasereyes";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Define the valid wallet types as string literals
type WalletProvider = "orange" | "magic-eden" | "unisat" | "oyl" | "phantom" | "leather" | "xverse" | "wizz" | "okx";

const wallets: Array<{
  name: WalletProvider;
  downloadUrl: string;
}> = [
  {
    name: "unisat",
    downloadUrl: "https://unisat.io/download",
  },
  {
    name: "xverse",
    downloadUrl: "https://www.xverse.app/download",
  },
  {
    name: "leather",
    downloadUrl: "https://leather.io/download",
  },
  {
    name: "okx",
    downloadUrl: "https://www.okx.com/download",
  },
  {
    name: "oyl",
    downloadUrl: "https://oyl.app",
  },
  {
    name: "magic-eden",
    downloadUrl: "https://magiceden.io/wallet",
  },
  {
    name: "phantom",
    downloadUrl: "https://phantom.app/download",
  },
  {
    name: "wizz",
    downloadUrl: "https://www.wizz.cash/download",
  },
  {
    name: "orange",
    downloadUrl: "https://orange.xyz",
  }
] as const;

export default function ConnectWallet({ className }: { className?: string }) {
  const {
    connect,
    disconnect,
    isConnecting,
    address,
    provider,
    hasUnisat,
    hasXverse,
    hasOyl,
    hasMagicEden,
    hasOkx,
    hasLeather,
    hasPhantom,
    hasWizz,
    hasOrange,
  } = useLaserEyes();
  const [isOpen, setIsOpen] = useState(false);

  const hasWallet: Record<WalletProvider, boolean> = {
    unisat: hasUnisat,
    xverse: hasXverse,
    oyl: hasOyl,
    "magic-eden": hasMagicEden,
    okx: hasOkx,
    leather: hasLeather,
    phantom: hasPhantom,
    wizz: hasWizz,
    orange: hasOrange,
  };

  const handleConnect = async (provider: WalletProvider) => {
    try {
      if (isMobileDevice()) {
        const deepLinkUrl = getDeepLinkUrl(provider);
        if (deepLinkUrl) {
          // For iOS, we need to use window.location.href
          if (/(iPhone|iPod|iPad)/i.test(navigator.userAgent)) {
            window.location.href = deepLinkUrl;
          } else {
            // For Android, we can try to open in a new window first
            const newWindow = window.open(deepLinkUrl, '_blank');
            
            // If window.open fails, fallback to location.href
            if (!newWindow) {
              window.location.href = deepLinkUrl;
            }
          }
          return;
        }
      }
      // Fallback to the default connect method for non-mobile devices
      await connect(provider);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to connect:", error);
    }
  };

  // Helper function to determine if the device is mobile
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Add this function to generate a random nonce
  const generateNonce = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  // Helper function to get the deep link URL for a wallet provider
  const getDeepLinkUrl = (provider: WalletProvider) => {
    // Get the current URL for the return URL
    const appUrl = 'https://www.bitboard.me';
    
    switch (provider) {
      case "unisat":
        const nonce = generateNonce();
        // Using the recommended format from UniSat docs
        return isMobileDevice() 
          ? `unisat://v1/connect?origin=${encodeURIComponent(appUrl)}`
          : `unisat://request?method=connect&from=BitBoard&nonce=${nonce}`;
      
      case "xverse":
        // Using the correct format for Xverse mobile
        if (isMobileDevice()) {
          if (/(iPhone|iPod|iPad)/i.test(navigator.userAgent)) {
            // iOS deep link with return URL
            return `xverse://?action=connect&returnUrl=${encodeURIComponent(appUrl)}`;
          } else {
            // Android intent with return URL
            return `intent://xverse/?action=connect&returnUrl=${encodeURIComponent(appUrl)}#Intent;scheme=xverse;package=com.xverse.wallet;end`;
          }
        }
        // Desktop format
        const params = new URLSearchParams({
          url: appUrl,
          chain: 'bitcoin',
          network: 'mainnet',
        });
        return `https://wallet.xverse.app/connect?${params.toString()}`;
      
      case "leather":
        return "leather://";
      case "okx":
        return "okx://";
      case "oyl":
        return "oyl://";
      case "magic-eden":
        return "magiceden://";
      case "phantom":
        return "phantom://";
      case "wizz":
        return "wizz://";
      case "orange":
        return "orange://";
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {address ? (
        <Button
          onClick={() => disconnect()}
          className={cn(
            "text-black dark:text-white font-medium px-6 py-2 rounded-lg",
            "bg-orange-100 dark:bg-orange-900/20",
            "hover:bg-orange-200 dark:hover:bg-orange-800/30",
            "transition-colors",
            className
          )}
        >
          Disconnect
        </Button>
      ) : (
        <DialogTrigger asChild>
          <Button
            className={cn(
              "text-white font-medium px-6 py-2 rounded-lg",
              "bg-orange-500",
              "hover:bg-orange-600",
              "transition-colors",
              className
            )}
          >
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="dialog-content w-full h-full md:w-auto md:h-auto max-w-[85%] max-h-[85%] md:max-w-md mx-auto my-auto">
        <DialogHeader className="px-6 pt-5 pb-3">
          <DialogTitle className="text-center text-[22px] font-medium text-black dark:text-white">
            Connect Wallet
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-6">
          <DialogDescription className="flex flex-col gap-2 w-full">
            {wallets.map((wallet) => {
              const isConnected = provider === wallet.name;
              const isMissingWallet = !hasWallet[wallet.name];
              return (
                <Button
                  key={wallet.name}
                  onClick={
                    isMissingWallet
                      ? () => null
                      : () => handleConnect(wallet.name as WalletProvider)
                  }
                  variant="ghost"
                  className={cn(
                    "w-full bg-white dark:bg-gray-800",
                    "hover:bg-gray-50 dark:hover:bg-gray-700",
                    "text-black dark:text-white",
                    "font-normal justify-between",
                    "h-[60px] text-base rounded-xl px-4",
                    "border border-gray-100 dark:border-gray-700",
                    "transition-colors duration-200",
                    "group"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="min-w-[32px] min-h-[32px] w-[32px] h-[32px] flex items-center justify-center">
                      <WalletIcon
                        size={32}
                        walletName={wallet.name}
                        className="!w-[32px] !h-[32px]"
                      />
                    </div>
                    <span className="text-lg">
                      {wallet.name
                        .replace(/[-_]/g, " ")
                        .split(" ")
                        .map(
                          (word) =>
                            word.charAt(0).toUpperCase() +
                            word.slice(1).toLowerCase()
                        )
                        .join(" ")}
                    </span>
                  </div>
                  {hasWallet[wallet.name] ? (
                    <div className="flex items-center">
                      <div className="flex items-center gap-2 group-hover:hidden">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Installed
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 hidden group-hover:block" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-4 h-4 md:hidden" />
                      <a
                        href={wallet.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden md:flex items-center gap-2 text-blue-500 hover:text-blue-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-sm">Install</span>
                      </a>
                    </div>
                  )}
                </Button>
              );
            })}
          </DialogDescription>
        </div>

        <div className="w-full bg-gray-50 dark:bg-gray-900 p-4 pt-5 border-t border-gray-200 dark:border-gray-800 group relative">
          <div className="text-gray-500 dark:text-gray-400 text-sm text-center transition-opacity duration-300 ease-in-out opacity-100 group-hover:opacity-0">
            <a
              href="https://www.lasereyes.build/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Powered by LaserEyes
            </a>
          </div>
          <div className="absolute top-5 left-0 right-0 transition-opacity duration-500 ease-in-out opacity-0 group-hover:opacity-100">
            <a
              href="https://www.lasereyes.build/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex justify-center"
            >
              <LaserEyesLogo width={48} color={"blue"} />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
