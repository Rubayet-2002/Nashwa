import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get("access-token")?.value;
  const refreshToken = request.cookies.get("refresh-token")?.value;

  let isLikelyAuthenticated = false;
  let userRole: string | null = null;

  if (accessToken) {
    try {
      const { payload } = await jwtVerify(accessToken, secret);
      isLikelyAuthenticated = true;
      userRole = payload.role as string;
    } catch {}
  }

  if (!isLikelyAuthenticated && refreshToken) {
    try {
      const { payload } = await jwtVerify(refreshToken, secret);
      isLikelyAuthenticated = true;
      userRole = payload.role as string;
    } catch {}
  }

  const { pathname } = request.nextUrl;

  const protectedRoutes = ["/profile", "/shop-dashboard"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (isProtectedRoute && !isLikelyAuthenticated) {
    return NextResponse.redirect(new URL("/account-email", request.url));
  }

  // Role based redirection for protected routes
  if (isLikelyAuthenticated) {
    if (pathname.startsWith("/shop-dashboard") && userRole !== "seller") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    
    // Exact match for homepage
    if (pathname === "/" && userRole === "seller") {
      return NextResponse.redirect(new URL("/shop-dashboard", request.url));
    }
  }

  const authRoutes = [
    "/account-email",
    "/account-password",
    "/account-register",
    "/proceed-to-create",
    "/forgot-password",
    "/verify-otp",
    "/new-password",
    "/seller-register"
  ];
  
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isAuthRoute && isLikelyAuthenticated) {
    if (userRole === "seller") {
      return NextResponse.redirect(new URL("/shop-dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
