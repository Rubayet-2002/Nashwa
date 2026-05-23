import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const response = NextResponse.redirect(new URL("/", baseUrl));

  // Delete cookies on the response object so Set-Cookie headers are sent to the browser
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  };

  response.cookies.set("access-token", "", cookieOptions);
  response.cookies.set("refresh-token", "", cookieOptions);
  response.cookies.set("auth-intent-token", "", cookieOptions);

  return response;
}