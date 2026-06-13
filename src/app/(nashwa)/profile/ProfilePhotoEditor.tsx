"use client";

import { useState, useRef, ChangeEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/zustand/toastStore";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload";
import ImageCropModal from "@/components/ImageCropModal";
import Lightbox from "@/components/Lightbox";

interface ProfilePhotoEditorProps {
  currentPhotoUrl: string | null;
  username: string;
}

export default function ProfilePhotoEditor({
  currentPhotoUrl,
  username,
}: ProfilePhotoEditorProps) {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setSelectedImage(reader.result as string);
      });
      reader.readAsDataURL(file);
    }
  };

  

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  

  const handleCropComplete = async (croppedBlob: Blob) => {
    setSelectedImage(null);
    setIsUploading(true);
    try {
      

      const secureUrl = await uploadImageToCloudinary(
        croppedBlob,
        "nashwa_profile_photos"
      );

      

      const res = await fetch("/api/user/update-avatar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ imageUrl: secureUrl }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update profile picture");
      }

      addToast("Profile picture updated successfully!", "success");
      router.refresh();
    } catch (err: any) {
      console.error("Avatar upload error:", err);
      addToast(err?.message || "Failed to upload avatar", "error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center gap-4">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Avatar Container */}
      <div className="relative group">
        {currentPhotoUrl ? (
          <div className="relative p-1 border-4 w-24 h-24 flex justify-center items-center rounded-full border-[rgba(103,101,101,0.2)] hover:border-[#BA5B55]/50 bg-white shadow-sm transition-all duration-200">
            <div
              onClick={() => setShowLightbox(true)}
              className="relative w-full h-full rounded-full overflow-hidden cursor-pointer"
            >
              <Image
                src={currentPhotoUrl}
                alt={username}
                fill
                className="object-cover rounded-full"
              />
            </div>

            {/* Hover overlay to change photo */}
            <div
              onClick={triggerFileSelect}
              className="absolute inset-1 bg-black/45 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer text-[10px] font-medium"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-0.5">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Change
            </div>
          </div>
        ) : (
          <div className="relative w-full max-w-xs rounded-sm border border-dashed border-[#d9d9d9] bg-[#fcfcfd] px-4 py-5 flex flex-col items-center justify-center gap-3 text-center">
            <div
              onClick={triggerFileSelect}
              className="w-24 h-24 rounded-full border-4 border-[#eaeaea] bg-white flex items-center justify-center text-[#BA5B55] overflow-hidden cursor-pointer hover:border-[#BA5B55]/30 hover:scale-102 transition-all duration-200"
              title="Click to upload"
            >
              {isUploading ? (
                <div className="w-5 h-5 border-2 border-[#BA5B55] border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#BA5B55]">Add</span>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-[#1a1a1a]">Add profile photo</p>
              <p className="text-[10px] text-[#787878] mt-0.5">
                Upload a photo to complete your account.
              </p>
            </div>
          </div>
        )}

        {/* Uploading overlay if in progress */}
        {isUploading && currentPhotoUrl && (
          <div className="absolute inset-0 bg-white/70 rounded-full flex items-center justify-center backdrop-blur-xs">
            <div className="w-6 h-6 border-2 border-[#BA5B55] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Button options if photo exists */}
      {currentPhotoUrl && (
        <button
          type="button"
          disabled={isUploading}
          onClick={triggerFileSelect}
          className="px-3.5 py-1.5 text-[11px] font-semibold border border-[#e8e8e8] text-[#555] rounded-full hover:border-[#BA5B55] hover:text-[#BA5B55] transition-colors cursor-pointer bg-white"
        >
          {isUploading ? "Uploading..." : "Change photo"}
        </button>
      )}

      {/* Crop Modal */}
      {selectedImage && (
        <ImageCropModal
          imageSrc={selectedImage}
          circularCrop={true}
          aspectRatio={1}
          title="Crop Profile Photo"
          onClose={() => setSelectedImage(null)}
          onCropComplete={handleCropComplete}
        />
      )}

      {/* Lightbox for full photo viewing */}
      {showLightbox && currentPhotoUrl && (
        <Lightbox
          src={currentPhotoUrl}
          alt={`${username}'s Profile Photo`}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </div>
  );
}
