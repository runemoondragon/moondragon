import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET_KEY || "your-secret-key"
);

const protectedPaths = ["/secret"];

export async function middleware(request: NextRequest) {
  console.log("🛡️ Middleware checking path:", request.nextUrl.pathname);
  
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  if (!isProtectedPath) {
    console.log("✅ Path not protected, proceeding");
    return NextResponse.next();
  }

  console.log("🔒 Protected path detected, checking authentication");
  const token = request.cookies.get("Auth")?.value;

  if (!token) {
    console.log("❌ No auth token found, redirecting to home");
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    console.log("🔍 Verifying JWT token");
    await jose.jwtVerify(token, secret);
    console.log("✅ Token verified, allowing access");
    return NextResponse.next();
  } catch (error) {
    console.log("❌ Invalid token:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}; 