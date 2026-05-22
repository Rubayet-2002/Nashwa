"use client";

import ImageUpload from "../component/ImageUpload";
import { useRouter } from "next/navigation";

export default function ProfilePhotoEditor() {
  const router = useRouter();

  return (
    <div>
      <ImageUpload
        label="Profile photo"
        folder="nashwa_profile_photos"
        accept="image/*"
        saveEndpoint="/api/user/update-avatar"
        onUploaded={() => router.refresh()}
      />
    </div>
  );
}
