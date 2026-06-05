"use client";

import { useState, useRef, ChangeEvent } from "react";
import { ImageRectangle } from "@mynaui/icons-react";
import ImageCropModal from "@/components/ImageCropModal";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload";

interface ImageUploadProps {
  label?: string;
  folder?: string;
  accept?: string;
  onUploaded?: (url: string | string[]) => void;
  saveEndpoint?: string;
  extraBody?: Record<string, any>;
  multiple?: boolean;
  crop?: boolean;
  aspectRatio?: number;
  circularCrop?: boolean;
}

export default function ImageUpload({
  label,
  folder = "nashwa_uploads",
  accept = "image/*",
  onUploaded,
  saveEndpoint,
  extraBody = {},
  multiple = false,
  crop = true,
  aspectRatio = 1,
  circularCrop = false,
}: ImageUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Crop Queue state for multi-cropping
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [cropIdx, setCropIdx] = useState(0);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const handleFiles = (selected: FileList | null) => {
    if (!selected) return;
    const selectedArr = Array.from(selected);

    if (crop) {
      // Initialize cropping queue
      setCropQueue(selectedArr);
      setCropIdx(0);
      loadCropSource(selectedArr[0]);
    } else {
      // Normal direct upload flow
      const next = multiple ? [...files, ...selectedArr] : [selectedArr[0]];
      const filtered = next.filter(Boolean);
      setFiles(filtered);
      setPreviews(filtered.map((f) => URL.createObjectURL(f)));
    }
  };

  const loadCropSource = (file: File) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setCropSrc(reader.result as string);
    });
    reader.readAsDataURL(file);
  };

  // Convert base64 dataUrl (which react-easy-crop returns) to File/Blob
  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    const originalFile = cropQueue[cropIdx];
    const croppedFile = dataURLtoFile(croppedDataUrl, originalFile.name);

    const nextFiles = multiple ? [...files, croppedFile] : [croppedFile];
    setFiles(nextFiles);
    setPreviews(nextFiles.map((f) => URL.createObjectURL(f)));

    // Proceed to next file in queue
    const nextIdx = cropIdx + 1;
    if (nextIdx < cropQueue.length) {
      setCropIdx(nextIdx);
      loadCropSource(cropQueue[nextIdx]);
    } else {
      // Completed queue
      setCropQueue([]);
      setCropSrc(null);
    }
  };

  const handleRemove = (index: number) => {
    const nextFiles = files.filter((_, i) => i !== index);
    setFiles(nextFiles);
    setPreviews(nextFiles.map((f) => URL.createObjectURL(f)));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const secureUrl = await uploadImageToCloudinary(file, folder);
        uploadedUrls.push(secureUrl);

        if (saveEndpoint) {
          const saveRes = await fetch(saveEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Requested-With": "XMLHttpRequest",
            },
            body: JSON.stringify({ imageUrl: secureUrl, ...extraBody }),
          });
          const r = await saveRes.json();
          if (!saveRes.ok) throw new Error(r.message || "Save failed");
        }
      }

      onUploaded?.(multiple ? uploadedUrls : uploadedUrls[0]);
      setFiles([]);
      setPreviews([]);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {label && <p className="text-xs text-[#787878] font-semibold">{label}</p>}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`w-full flex items-center justify-between border px-4 py-3 cursor-pointer transition-colors ${
          dragOver ? "border-[#BA5B55]/60 bg-[#fff7f6]" : "border-gray-200"
        }`}
        onClick={() => inputRef.current?.click()}
      >
        <div className="flex items-center gap-2 text-sm text-[#787878]">
          <ImageRectangle size={16} stroke={1.5} className="shrink-0" />
          <span className="truncate max-w-50 text-xs">
            {files.length > 0 ? `${files.length} file(s) selected` : "Select image"}
          </span>
        </div>
        <span className="text-xs text-[#BA5B55] font-medium">Browse</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        multiple={multiple}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Selected Cropped Images Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mt-2">
          {previews.map((p, i) => (
            <div key={p} className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#eaeaea]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p} alt={`preview-${i}`} className="object-cover w-full h-full" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(i);
                }}
                className="absolute top-1 right-1 bg-black/60 rounded-full w-4 h-4 flex items-center justify-center text-white text-[10px] cursor-pointer"
                title="Remove"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploading}
            className="px-4 py-2 text-xs font-semibold bg-[#BA5B55] border border-[#BA5B55] hover:bg-white hover:text-[#BA5B55] text-white rounded-xl disabled:opacity-70 transition-all cursor-pointer shadow-xs"
          >
            {isUploading ? "Uploading..." : "Upload Photos"}
          </button>
        </div>
      )}

      {/* Cropper Modal for upload queue */}
      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          circularCrop={circularCrop}
          aspect={aspectRatio}
          title={`Crop Photo ${multiple ? `(${cropIdx + 1} of ${cropQueue.length})` : ""}`}
          onClose={() => {
            setCropQueue([]);
            setCropSrc(null);
          }}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}
