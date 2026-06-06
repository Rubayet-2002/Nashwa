"use server";

import { v2 as cloudinary } from "cloudinary";
import { authMe } from "@/app/(authentication)/lib/authMe";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function getCloudinarySignature() {
  const { user } = await authMe();
  if (!user) throw new Error("Unauthorized");

  const timestamp = Math.round(new Date().getTime() / 1000);
  const publicId = `${user.uid}_${timestamp}`;

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp: timestamp,
      folder: "nashwa_shop_NID",
      public_id: publicId,
    },
    process.env.CLOUDINARY_API_SECRET!,
  );

  return {
    timestamp,
    signature,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    publicId,
  };
}
