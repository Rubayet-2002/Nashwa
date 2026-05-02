import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJWT } from "../../lib/jwtUtils";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-email-token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const payload = await verifyJWT(token);
  if (!payload || payload.step !== 4 || payload.purpose !== "seller-registration") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder: "nashwa_seller_documents" },
    process.env.CLOUDINARY_API_SECRET!,
  );

  return NextResponse.json({
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  });
}
