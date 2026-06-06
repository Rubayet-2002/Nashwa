"use client";

import { useEffect, useCallback } from "react";
import Image from "next/image";

interface LightboxProps {
  // Single image mode
  src?: string;
  alt?: string;

  // Multi image mode
  images?: string[];
  current?: number;
  onNavigate?: (index: number) => void;

  // Shared
  onClose: () => void;
}

export default function Lightbox({
  src,
  alt = "Image",
  images,
  current = 0,
  onClose,
  onNavigate,
}: LightboxProps) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (images && onNavigate) {
        if (e.key === "ArrowRight" && current < images.length - 1) onNavigate(current + 1);
        if (e.key === "ArrowLeft" && current > 0) onNavigate(current - 1);
      }
    },
    [current, images, onClose, onNavigate]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [handleKey]);

  // Render Single Image Lightbox
  if (src) {
    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md"
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.9)", backdropFilter: "blur(6px)" }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 16, padding: 8, borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", border: "1px solid rgba(255,255,255,0.2)"
          }}
          title="Close"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div
          onClick={(e) => e.stopPropagation()}
          style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh", borderRadius: 8, boxShadow: "0 8px 40px rgba(0,0,0,0.5)", overflow: "hidden" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-[85vh] object-contain select-none"
            style={{ maxWidth: "100%", maxHeight: "85vh", objectFit: "contain" }}
          />
          {alt && (
            <div style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#fff", textAlign: "center", padding: "8px 0", fontSize: 12, position: "absolute", bottom: 0, left: 0, right: 0, backdropFilter: "blur(4px)" }}>
              {alt}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render Multi-Image Slider Lightbox
  if (!images || !onNavigate) return null;

  return (
    <div
      className="modal-backdrop"
      style={{ padding: 0, background: "rgba(0,0,0,0.92)", position: "fixed", inset: 0, zIndex: 9999 }}
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: "fixed", top: 20, right: 24, zIndex: 1001,
          background: "rgba(255,255,255,0.12)", border: "none",
          color: "#fff", fontSize: 28, width: 44, height: 44,
          borderRadius: "50%", cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(8px)",
        }}
        aria-label="Close"
      >
        ×
      </button>

      {/* Navigation */}
      {current > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(current - 1); }}
          style={{
            position: "fixed", left: 20, top: "50%", transform: "translateY(-50%)",
            zIndex: 1001, background: "rgba(255,255,255,0.12)",
            border: "none", color: "#fff", width: 44, height: 44,
            borderRadius: "50%", cursor: "pointer", fontSize: 22,
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(8px)",
          }}
          aria-label="Previous"
        >
          ‹
        </button>
      )}
      {current < images.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(current + 1); }}
          style={{
            position: "fixed", right: 20, top: "50%", transform: "translateY(-50%)",
            zIndex: 1001, background: "rgba(255,255,255,0.12)",
            border: "none", color: "#fff", width: 44, height: 44,
            borderRadius: "50%", cursor: "pointer", fontSize: 22,
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(8px)",
          }}
          aria-label="Next"
        >
          ›
        </button>
      )}

      {/* Image */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          maxWidth: "88vw",
          maxHeight: "88vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          src={images[current]}
          alt={`Image ${current + 1}`}
          width={1200}
          height={900}
          style={{
            maxWidth: "88vw",
            maxHeight: "88vh",
            objectFit: "contain",
            borderRadius: 8,
            boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
          }}
          priority
        />
      </div>

      {/* Dots */}
      {images.length > 1 && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
            display: "flex", gap: 8, zIndex: 1001,
          }}
        >
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => onNavigate(i)}
              style={{
                width: i === current ? 24 : 8, height: 8,
                borderRadius: 99, border: "none", cursor: "pointer",
                background: i === current ? "#fff" : "rgba(255,255,255,0.4)",
                transition: "all 0.2s ease",
              }}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
