"use client";

import { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";

interface ImageCropModalProps {
  src?: string;
  imageSrc?: string;
  aspect?: number;
  aspectRatio?: number;
  circularCrop?: boolean;
  onCropComplete: (cropped: any) => void;
  onClose: () => void;
  title?: string;
}

async function getCroppedImage(
  imageSrc: string,
  pixelCrop: Area,
  outputWidth: number,
  outputHeight: number
): Promise<string> {
  const image = await createImageBitmap(await (await fetch(imageSrc)).blob());
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputWidth,
    outputHeight
  );
  return canvas.toDataURL("image/jpeg", 0.92);
}

const dataURLtoBlob = (dataurl: string): Blob => {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

export default function ImageCropModal({
  src,
  imageSrc,
  aspect,
  aspectRatio,
  circularCrop = false,
  onCropComplete,
  onClose,
  title = "Crop Image",
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const activeSrc = src || imageSrc || "";
  const activeAspect = aspect !== undefined ? aspect : (aspectRatio !== undefined ? aspectRatio : 1);

  const onCropAreaChange = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleDone = async () => {
    if (!croppedAreaPixels || !activeSrc) return;
    setProcessing(true);
    try {
      const outputW = activeAspect >= 1 ? 800 : Math.round(800 * activeAspect);
      const outputH = activeAspect >= 1 ? Math.round(800 / activeAspect) : 800;
      const resultDataUrl = await getCroppedImage(activeSrc, croppedAreaPixels, outputW, outputH);
      
      if (imageSrc !== undefined) {
        

        const blob = dataURLtoBlob(resultDataUrl);
        onCropComplete(blob);
      } else {
        

        onCropComplete(resultDataUrl);
      }
      onClose();
    } catch (e) {
      console.error("Crop error:", e);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/48 backdrop-blur-[3px] z-[1000] flex items-center justify-center p-5 animate-in fade-in duration-150" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-xl w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-200" style={{ maxWidth: 520 }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, color: "var(--text-muted)", cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        {/* Crop area */}
        <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ height: 340 }}>
          <Cropper
            image={activeSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={activeAspect}
            cropShape={circularCrop ? "round" : "rect"}
            showGrid={!circularCrop}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropAreaChange}
          />
        </div>

        {/* Controls */}
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label className="block text-xs font-semibold text-[#555] uppercase tracking-wider mb-1.5">Zoom</label>
            <input
              type="range" min={1} max={3} step={0.05}
              value={zoom} onChange={(e) => setZoom(Number(e.target.value))}
              style={{ accentColor: "var(--brand)" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label className="block text-xs font-semibold text-[#555] uppercase tracking-wider mb-1.5">Rotation</label>
            <input
              type="range" min={-180} max={180} step={1}
              value={rotation} onChange={(e) => setRotation(Number(e.target.value))}
              style={{ accentColor: "var(--brand)" }}
            />
          </div>

          <div className="flex gap-2.5 justify-end">
            <button className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-200 bg-transparent text-[#555] hover:bg-[#f4f4f4] hover:border-gray-400 rounded transition-all cursor-pointer" onClick={onClose}>Cancel</button>
            <button className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#BA5B55] text-white hover:bg-[#9e4f4a] rounded transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleDone} disabled={processing}>
              {processing ? "Processing…" : "Apply Crop"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
