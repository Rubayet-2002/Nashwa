import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { authMe } from "@/app/(authentication)/lib/authMe";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST() {
  try {
    const { user } = await authMe();
    if (!user) {
      console.warn('get-cloudinary-signature-image: unauthorized');
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Cloudinary credentials missing in env');
      return NextResponse.json({ message: 'Cloudinary not configured' }, { status: 500 });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const publicId = `${user.uid}_${timestamp}`;

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder: "nashwa_uploads" },
      process.env.CLOUDINARY_API_SECRET!,
    );

    console.log('get-cloudinary-signature-image: generated signature for', user.uid);

    return NextResponse.json({
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      publicId,
    });
  } catch (err) {
    console.error('get-cloudinary-signature-image error', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
