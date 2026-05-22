"use client";

import { useState, useRef } from "react";
import { ImageRectangle } from "@mynaui/icons-react";

export default function ImageUpload({
  label,
  folder = "nashwa_uploads",
  accept = "image/*",
  onUploaded,
  saveEndpoint,
  extraBody = {},
  multiple = false,
}: {
  label?: string;
  folder?: string;
  accept?: string;
  onUploaded?: (url: string | string[]) => void;
  saveEndpoint?: string;
  extraBody?: Record<string, any>;
  multiple?: boolean;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (selected: FileList | null) => {
    if (!selected) return;
    const arr = Array.from(selected);
    const next = multiple ? [...files, ...arr] : [arr[0]];
    setFiles(next.filter(Boolean));
    setPreviews(next.map((f) => URL.createObjectURL(f)));
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
      const sigRes = await fetch("/api/get-cloudinary-signature-image", { method: "POST" });
      if (!sigRes.ok) {
        const err = await sigRes.json().catch(() => ({ message: 'Signature request failed' }));
        throw new Error(err.message || 'Failed to get signature');
      }
      const sig = await sigRes.json();
      const { signature, timestamp, apiKey, cloudName, publicId } = sig;
      console.log('get-cloudinary-signature-image response', sig);
      if (!signature || !timestamp || !apiKey || !cloudName) {
        throw new Error('Invalid signature response');
      }

      const uploadedUrls: string[] = [];

      for (const file of files) {
        const body = new FormData();
        body.append("file", file);
        body.append("signature", signature);
        body.append("timestamp", timestamp);
        body.append("api_key", apiKey);
        body.append("folder", folder);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body,
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json || !json.secure_url) {
          const message = (json && (json.error && (json.error.message || json.error)) ) || (json && json.message) || `Cloudinary upload failed (status ${res.status})`;
          console.error('Cloudinary upload error:', json);
          alert(`Upload failed: ${message}`);
          throw new Error(message);
        }
        uploadedUrls.push(json.secure_url);

        if (saveEndpoint) {
          const saveRes = await fetch(saveEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
            body: JSON.stringify({ imageUrl: json.secure_url, ...extraBody }),
          });
          const r = await saveRes.json();
          if (!saveRes.ok) throw new Error(r.message || "Save failed");
        }
      }

      onUploaded?.(multiple ? uploadedUrls : uploadedUrls[0]);
      // clear local previews/files
      setFiles([]);
      setPreviews([]);
    } catch (err) {
      console.error(err);
      alert("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {label && <p className="text-xs text-[#787878]">{label}</p>}

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
          <span className="truncate max-w-50">{files.length > 0 ? `${files.length} file(s) selected` : "Select image"}</span>
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

      {previews.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mt-2">
          {previews.map((p, i) => (
            <div key={p} className="relative w-24 h-24 rounded-sm overflow-hidden border border-[#eaeaea]">
              <img src={p} alt={`preview-${i}`} className="object-cover w-full h-full" />
              <button
                onClick={(e) => { e.stopPropagation(); handleRemove(i); }}
                className="absolute top-1 right-1 bg-white/90 rounded-full p-0.5 text-xs border"
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-2">
        <button
          onClick={handleUpload}
          disabled={files.length === 0 || isUploading}
          className="px-3 py-2 text-sm bg-[#BA5B55] border border-[#BA5B55] hover:bg-white hover:text-[#BA5B55] text-white disabled:opacity-70"
        >
          {isUploading ? "Uploading..." : "Upload"}
        </button>
      </div>
    </div>
  );
}
