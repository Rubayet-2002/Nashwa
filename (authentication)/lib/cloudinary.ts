import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadPDFToCloudinary(fileBuffer: Buffer, fileName: string) {
  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "nashwa_seller_documents",
        resource_type: "raw",
        public_id: fileName,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result?.secure_url as string);
      }
    );
    uploadStream.end(fileBuffer);
  });
}
