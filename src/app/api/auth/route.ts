import { NextRequest, NextResponse } from "next/server";
import * as jose from 'jose';
import { BTC_MESSAGE_TO_SIGN, ACCESS_TOKENS } from "@/lib/const";
import { fetchOrdAddress } from "@/lib/runebalance";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET_KEY || "your-secret-key"
);

export const POST = async (req: NextRequest) => {
  try {
    console.log("🚀 Auth route hit - starting authentication process");
    
    const { address, signature, message, tokenName } = await req.json();
    console.log("📝 Received payload:", { address, tokenName, signatureLength: signature?.length });

    if (!address || !signature || !message || !tokenName) {
      console.log("❌ Missing required fields");
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Get token requirements
    const token = ACCESS_TOKENS.find(t => t.name === tokenName);
    if (!token) {
      console.log("❌ Invalid token:", tokenName);
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    // If it's an external URL token (like MAGA•FIGHT•FIGHT), handle differently
    if (token.externalUrl) {
      console.log("🔗 External URL token detected, skipping balance check");
      const jwtToken = await new jose.SignJWT({ 
        address,
        tokenName,
        channel: "external"
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('2h')
        .sign(secret);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          "Set-Cookie": `Auth=${jwtToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=7200`,
        },
      });
    }

    console.log("🔍 Fetching rune balances for address:", address);
    const balances = await fetchOrdAddress(address);
    console.log("📊 Received balances:", balances);

    if (!balances || balances.length === 0) {
      console.log("❌ No balances found for address");
      return NextResponse.json({ 
        error: 'No rune balances found' 
      }, { status: 403 });
    }

    const tokenBalance = balances.find(b => b.name === tokenName);
    console.log("🎯 Token balance found:", tokenBalance);

    if (!tokenBalance) {
      console.log(`❌ No ${tokenName} balance found`);
      return NextResponse.json({ 
        error: `No ${tokenName} balance found` 
      }, { status: 403 });
    }

    const currentBalance = parseInt(tokenBalance.balance.replace(/,/g, ''));
    const hasRequiredBalance = currentBalance >= token.requiredBalance;

    console.log("💰 Balance check:", {
      token: tokenName,
      current: currentBalance,
      required: token.requiredBalance,
      hasEnough: hasRequiredBalance
    });

    if (!hasRequiredBalance) {
      console.log(`❌ Insufficient ${tokenName} balance`);
      return NextResponse.json({ 
        error: `Insufficient ${tokenName} balance. Required: ${token.requiredBalance.toLocaleString()}, Current: ${currentBalance.toLocaleString()}` 
      }, { status: 403 });
    }

    console.log("✅ Balance check passed, generating JWT");
    const jwtToken = await new jose.SignJWT({ 
      address,
      tokenName,
      channel: "protected"
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('2h')
      .sign(secret);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Set-Cookie": `Auth=${jwtToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=7200`,
      },
    });

  } catch (error: unknown) {
    console.error("🔥 Authentication error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unknown error",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
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