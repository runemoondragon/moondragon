"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { isMobile, isIOS, isAndroid } from 'react-device-detect';

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
    downloadUrl: "xverse://browser?url=www.bitboard.me",
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
      const appUrl = "www.bitboard.me";
  
      if (isMobile) {
        const isInWalletBrowser = !!(window as any).xverse || !!(window as any).unisat;
  
        // If we're already in a wallet browser, use desktop-like connection
        if (isInWalletBrowser) {
          await connect(provider);
          setIsOpen(false);
          return;
        }
  
        // If not in wallet browser, redirect to wallet app
        switch (provider) {
          case "xverse":
            // Generate a WalletConnect URI
            const wcUri = await connect("xverse"); // Trigger WalletConnect session for xverse
  
            // Redirect to xverse with WalletConnect URI
            const xverseLink = `xverse://wc?uri=${encodeURIComponent(appUrl)}`;
            window.location.href = xverseLink;
            return;

          case "unisat":
            const unisatLink = `unisat://v1/connect?origin=${encodeURIComponent(appUrl)}`;
            window.location.href = unisatLink;
            return;

          case "okx":
            window.location.href = "okx://";
            return;

          case "leather":
            window.location.href = "leather://";
            return;

          case "magic-eden":
            window.location.href = "magiceden://";
            return;

          case "phantom":
            window.location.href = "phantom://";
            return;
        }
      }

      // Desktop connect
      await connect(provider);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to connect:", error);
      const wallet = wallets.find(w => w.name === provider);
      if (wallet) {
        window.location.href = wallet.downloadUrl;
      }
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
                  onClick={() => isMobile ? handleConnect(wallet.name) : (hasWallet[wallet.name] ? handleConnect(wallet.name) : null)}
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
