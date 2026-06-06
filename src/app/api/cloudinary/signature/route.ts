import { NextRequest, NextResponse } from "next/server";
import { generateSignature } from "@/lib/cloudinary";
import { authMe } from "@/app/(authentication)/lib/authMe";

export async function POST(req: NextRequest) {
  const { user } = await authMe();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { folder = "nashwa/general", eager } = body;

  const params: Record<string, string | number> = {
    folder,
    upload_preset: "", // using signed upload
  };
  if (eager) params.eager = eager;

  const result = generateSignature(params);
  return NextResponse.json(result);
}
