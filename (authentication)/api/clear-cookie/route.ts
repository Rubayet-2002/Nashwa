import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  
  cookieStore.delete("auth-intent-token");
  cookieStore.delete("access-token");
  cookieStore.delete("refresh-token");

  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"));
}