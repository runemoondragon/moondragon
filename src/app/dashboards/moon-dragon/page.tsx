"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLaserEyes } from "@omnisat/lasereyes";

export default function MoonDragonDashboard() {
  const { address } = useLaserEyes();
  const router = useRouter();

  useEffect(() => {
    if (!address) {
      router.push("/");
    }
  }, [address, router]);

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8">Moon Dragon Dashboard</h1>
      {/* Add dashboard content here */}
    </div>
  );
} 