import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin/api") ||
    pathname.startsWith("/shop/api")
  ) {
    return;
  }

  const adminToken = request.cookies.get("admin-token")?.value;
  let isAdminAuthenticated = false;

  if (adminToken) {
    try {
      const decodedAdmin = await jwtVerify(adminToken, secret);
      isAdminAuthenticated = !!decodedAdmin;
    } catch (error) {}
  }

  if (isAdminAuthenticated) {
    if (pathname === "/admin/login" || !pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  } else {
    if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  const accessToken = request.cookies.get("access-token")?.value;
  const refreshToken = request.cookies.get("refresh-token")?.value;

  let payload: any = null;

  try {
    const availableToken = accessToken || refreshToken;

    if (availableToken) {
      const decoded = await jwtVerify(availableToken, secret);
      payload = decoded.payload;
    }
  } catch (error) {}

  const isAuthenticated = !!payload;
  const activeShopUid = payload?.activeShopUid;

  const authRoutes = [
    "/email",
    "/password",
    "/registration",
    "/proceed",
    "/forgot-password",
    "/otp-verification",
    "/change-password",
  ];
  const protectedRoutes = ["/profile", "/shop/dashboard", "/shop/create-shop"];

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL("/email", request.url));
  }

  if (isAuthenticated) {
    if (isAuthRoute) {
      const destination = activeShopUid ? "/shop/dashboard" : "/";
      return NextResponse.redirect(new URL(destination, request.url));
    }

    if (pathname === "/" && activeShopUid) {
      return NextResponse.redirect(new URL("/shop/dashboard", request.url));
    }
  }
}
