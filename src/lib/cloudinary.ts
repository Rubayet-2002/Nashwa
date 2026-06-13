import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export { cloudinary };


export async function uploadToCloudinary(
  data: string,
  folder: string,
  options?: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
    format?: string;
    resourceType?: "image" | "video" | "raw" | "auto";
  }
): Promise<{ url: string; public_id: string }> {
  const result = await cloudinary.uploader.upload(data, {
    folder,
    resource_type: options?.resourceType || "auto",
    transformation: options
      ? [
          {
            width: options.width,
            height: options.height,
            crop: options.crop || "fill",
            quality: options.quality || "auto",
            fetch_format: options.format || "auto",
          },
        ]
      : [{ quality: "auto", fetch_format: "auto" }],
  });
  return { url: result.secure_url, public_id: result.public_id };
}


export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}


export function generateSignature(
  params: Record<string, string | number>
): { signature: string; timestamp: number; api_key: string; cloud_name: string } {
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = { ...params, timestamp };
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );
  return {
    signature,
    timestamp,
    api_key: process.env.CLOUDINARY_API_KEY!,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  };
}
