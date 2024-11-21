"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLaserEyes } from "@omnisat/lasereyes";
import { NavBar } from "@/components/NavBar";

export default function MoonDragonDashboard() {
  const { address } = useLaserEyes();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
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
          
          {/* Add your dashboard content here */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Example dashboard cards */}
            <div className="p-6 rounded-lg bg-white/10 backdrop-blur-sm">
              <h2 className="text-xl font-semibold mb-4">Statistics</h2>
              {/* Add statistics content */}
            </div>
            
            <div className="p-6 rounded-lg bg-white/10 backdrop-blur-sm">
              <h2 className="text-xl font-semibold mb-4">Activities</h2>
              {/* Add activities content */}
            </div>
            
            <div className="p-6 rounded-lg bg-white/10 backdrop-blur-sm">
              <h2 className="text-xl font-semibold mb-4">Resources</h2>
              {/* Add resources content */}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 