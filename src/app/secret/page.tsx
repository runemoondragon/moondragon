"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SecretPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Checking authentication...");
        const response = await fetch("/api/auth", {
          method: "GET",
          credentials: "include"
        });
        
        console.log("Auth response status:", response.status);
        
        if (!response.ok) {
          console.log("Not authorized, redirecting...");
          router.push("/");
        } else {
          console.log("Authorization successful");
          setIsAuthorized(true);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">{isLoading ? "Loading..." : "Unauthorized"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:to-black text-black dark:text-white">
      <h1 className="text-4xl font-bold mb-8">DRAGON DASHBOARD</h1>
      <p className="text-xl mb-4">Congratulations! You have access to the owners dashboard.</p>
      <p className="text-lg text-center max-w-2xl">
        This page is only accessible to verified holders of at least 1,000,000 RUNE•MOON•DRAGON tokens.
      </p>
      <button
        onClick={async () => {
          await fetch("/api/auth", { 
            method: "DELETE",
            credentials: "include"
          });
          router.push("/");
        }}
        className="mt-8 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
      >
        Logout
      </button>
    </div>
  );
} 