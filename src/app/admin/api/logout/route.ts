import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
    redirect: "/admin/login",
  });

  response.cookies.delete("access-token");
  response.cookies.delete("refresh-token");
  return response;
}
