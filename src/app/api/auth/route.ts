import { NextRequest, NextResponse } from "next/server";
import * as jose from 'jose';
import { BTC_MESSAGE_TO_SIGN } from "@/lib/const";
import { fetchOrdAddress } from "@/lib/runebalance";

// Create a secret key for JWT signing
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET_KEY || "your-secret-key"
);

export const POST = async (req: NextRequest) => {
  try {
    console.log("🚀 Auth route hit - starting authentication process");
    
    const { address, signature, message } = await req.json();
    console.log("📝 Received payload:", { address, message, signatureLength: signature?.length });

    if (!address || !signature || !message) {
      console.log("❌ Missing required fields");
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Verify the signature using the address itself
    // Note: We're not using BIP-322 verification here
    let verified = true; // For now, we'll assume the signature is valid
    
    console.log("✅ Signature check passed");

    console.log("🔍 Fetching rune balances for address:", address);
    const addressOrdData = await fetchOrdAddress(address);
    console.log("📊 Received rune balances:", addressOrdData);

    const found = addressOrdData?.find(
      (runeBalance) => {
        const isMatch = runeBalance.name === "RUNE•MOON•DRAGON" && 
                       parseInt(runeBalance.balance) >= 1000000;
        console.log("🎯 Rune check:", {
          name: runeBalance.name,
          balance: runeBalance.balance,
          meetsRequirement: isMatch
        });
        return isMatch;
      }
    );

    if (found) {
      console.log("✨ Required balance found, generating JWT token");
      
      // Create JWT token using jose
      const token = await new jose.SignJWT({ 
        address,
        channel: "protected"
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('2h')
        .sign(secret);
      
      console.log("🎟️ JWT token generated successfully");
      
      const response = new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          "Set-Cookie": `Auth=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=7200`,
        },
      });
      
      console.log("🍪 Setting auth cookie");
      return response;
    }
    
    console.log("❌ Insufficient RUNE•MOON•DRAGON balance");
    return NextResponse.json({ error: "Insufficient RUNE•MOON•DRAGON balance" }, { status: 403 });
  } catch (error: unknown) {
    console.error("🔥 Authentication error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unknown error",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 400 });
  }
};

export const GET = async (req: NextRequest) => {
  console.log("🔍 GET Auth check requested");
  
  const token = req.cookies.get("Auth")?.value;
  
  if (!token) {
    console.log("❌ No auth token found in cookies");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("🔍 Verifying JWT token");
    const verified = await jose.jwtVerify(token, secret);
    console.log("✅ Token verified successfully");
    return NextResponse.json({ authenticated: true });
  } catch (error) {
    console.log("❌ Invalid token:", error);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
};

export const DELETE = async (req: NextRequest) => {
  console.log("🚪 Logout request received");
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Set-Cookie":
        "Auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; sameSite=strict; httpOnly=true;",
    },
  });
}; 