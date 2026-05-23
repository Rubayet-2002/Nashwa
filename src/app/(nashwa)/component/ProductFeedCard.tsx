"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Store } from "@mynaui/icons-react";
import ProductCommentThread from "./ProductCommentThread";
import { useToastStore } from "@/zustand/toastStore";

export type FeedProduct = {
  product_uid: string;
  title: string;
  description: string | null;
  price: string;
  currency: string;
  image_url: string | null;
  image_urls: string[] | null;
  comment_count: number | null;
  shop_uid: string;
  shop_name: string;
  shop_location: string;
  shop_profile_photo_url: string | null;
  shop_university_name: string | null;
};

interface ProductFeedCardProps {
  product: FeedProduct;
}

export default function ProductFeedCard({ product }: ProductFeedCardProps) {
  const addToast = useToastStore((s) => s.addToast);
  const [showComments, setShowComments] = useState(false);

  // Social reaction state
  const [reactCount, setReactCount] = useState(0);
  const [hasReacted, setHasReacted] = useState(false);
  const [loadingReact, setLoadingReact] = useState(true);

  // Dynamic image switching
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const images = product.image_urls && product.image_urls.length > 0
    ? product.image_urls
    : (product.image_url ? [product.image_url] : []);
  const activeImage = images[activeImageIndex] || null;

  useEffect(() => {
    let active = true;
    fetch(`/shop/api/product-reactions?productUid=${encodeURIComponent(product.product_uid)}`)
      .then((res) => res.json())
      .then((data) => {
        if (active && data) {
          setReactCount(data.count || 0);
          setHasReacted(!!data.reacted);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingReact(false);
      });
    return () => {
      active = false;
    };
  }, [product.product_uid]);

  const handleReact = async () => {
    try {
      const res = await fetch("/shop/api/product-reactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ productUid: product.product_uid }),
      });
      const data = await res.json();
      if (res.ok) {
        setReactCount(data.count || 0);
        setHasReacted(!!data.reacted);
      }
    } catch (err) {}
  };

  const handleShare = () => {
    const url = `${window.location.origin}/shop/profile/${product.shop_uid}`;
    navigator.clipboard.writeText(url).then(() => {
      addToast("Shop profile link copied to clipboard!", "success");
    });
  };

  return (
    <article className="rounded-3xl border border-[#eadfdb] bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* 1. Header Row (Shop Info) */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {/* Shop Profile Image */}
          <Link
            href={`/shop/profile/${product.shop_uid}`}
            className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-[#eadfdb] bg-[#f5f1ee] shadow-sm"
          >
            {product.shop_profile_photo_url ? (
              <Image src={product.shop_profile_photo_url} alt={product.shop_name} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[#BA5B55]">
                <Store size={18} />
              </div>
            )}
          </Link>

          {/* Shop Text Info */}
          <div className="min-w-0">
            <Link
              href={`/shop/profile/${product.shop_uid}`}
              className="block truncate text-sm font-semibold text-[#1a1a1a] transition-colors hover:text-[#BA5B55]"
            >
              {product.shop_name}
            </Link>
            <p className="mt-0.5 truncate text-[11px] uppercase tracking-[0.18em] text-[#BA5B55]">
              {product.shop_university_name || "Independent Shop"}
            </p>
          </div>
        </div>

        {/* Visit Shop Link Styled like the Follow Button */}
        <Link
          href={`/shop/profile/${product.shop_uid}`}
          className="rounded border border-[#e6e2df] px-3.5 py-1.5 text-xs font-semibold text-[#4f4f4f] hover:border-[#BA5B55] hover:text-[#BA5B55] transition-all flex items-center gap-1.5 bg-white shadow-sm"
        >
          <Store size={14} className="text-[#BA5B55]" />
          Visit Shop
        </Link>
      </div>

      {/* 2. Product Description */}
      <p className="mt-4 text-xs text-[#4f4f4f] leading-relaxed font-light">
        {product.description || "No description added yet."}
      </p>

      {/* 3. Core Grid Layout (2 Columns) */}
      <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {/* Left Column: Product Image, Gallery, and Stats */}
        <div className="flex flex-col">
          {/* Main Product Image Container */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[#eee] bg-[#fafafa]">
            {activeImage ? (
              <Image src={activeImage} alt={product.title} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[#c9c0bd]">
                <Store size={40} />
              </div>
            )}
          </div>

          {/* Gallery Thumbnails dynamically loaded from DB */}
          {images.length > 1 && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border-2 bg-[#fafafa] shadow-sm transition-all cursor-pointer ${
                    activeImageIndex === idx ? "border-[#BA5B55]" : "border-[#e6e2df] hover:border-[#BA5B55]/50"
                  }`}
                >
                  <Image src={img} alt={`thumbnail ${idx + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Engagement Statistics */}
          <div className="mt-3 flex items-center gap-4 text-[11px] text-[#787878] font-light">
            <span>{reactCount} {reactCount === 1 ? "like" : "likes"}</span>
            <span>{product.comment_count ?? 0} {product.comment_count === 1 ? "comment" : "comments"}</span>
          </div>
        </div>

        {/* Right Column: Key Details Box and Purchase Actions */}
        <div className="flex flex-col justify-between">
          {/* Light Pink/Coral details box mimicking Reference UI */}
          <div className="rounded-2xl border border-[#efe4e2] bg-[#fcf7f6] p-4 flex flex-col gap-2.5 shadow-sm">
            <h4 className="font-semibold text-sm text-[#1a1a1a] pb-1 border-b border-[#f2eae7] truncate">
              {product.title}
            </h4>

            <div className="grid grid-cols-[65px_12px_1fr] gap-y-1.5 text-xs text-[#555] font-light">
              <span>Price</span>
              <span>:</span>
              <span className="font-semibold text-[#BA5B55]">{product.currency} {Number(product.price).toFixed(2)}</span>

              <span>Location</span>
              <span>:</span>
              <span className="truncate">{product.shop_location}</span>

              <span>Shop</span>
              <span>:</span>
              <span className="truncate">{product.shop_name}</span>
            </div>
          </div>

          {/* Action Buttons mimicking Reference UI */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => addToast(`Added "${product.title}" to cart!`, "success")}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[#e6e2df] py-2.5 text-xs font-semibold text-[#4f4f4f] hover:border-[#BA5B55] hover:text-[#BA5B55] transition-all bg-white shadow-sm cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              Add To Cart
            </button>
            <Link
              href={`/shop/profile/${product.shop_uid}`}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[#e6e2df] py-2.5 text-xs font-semibold text-[#4f4f4f] hover:border-[#BA5B55] hover:text-[#BA5B55] transition-all bg-white shadow-sm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"></path><path d="M9 21H3v-6"></path><path d="M21 3l-7 7M3 21l7-7"></path></svg>
              View Details
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Bottom Social Action Bar */}
      <div className="mt-4 border-t border-[#f2eae7] pt-3 flex items-center justify-between px-2">
        {/* Heart React Button */}
        <button
          type="button"
          onClick={handleReact}
          disabled={loadingReact}
          className="p-1 text-[#555] hover:text-[#BA5B55] transition-colors cursor-pointer animate-in fade-in"
          title="React"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill={hasReacted ? "#BA5B55" : "none"}
            stroke={hasReacted ? "#BA5B55" : "currentColor"}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform active:scale-125 duration-150"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>

        {/* Comment Drawer Toggle */}
        <button
          type="button"
          onClick={() => setShowComments(!showComments)}
          className="p-1 text-[#555] hover:text-[#BA5B55] transition-colors cursor-pointer"
          title="Toggle Comments"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className="p-1 text-[#555] hover:text-[#BA5B55] transition-colors cursor-pointer"
          title="Share Shop Link"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform active:scale-95 duration-100"
          >
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
        </button>
      </div>

      {/* 5. Comments Section Drawer */}
      {showComments && (
        <div className="mt-4 border-t border-[#f2f4f7] pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <ProductCommentThread productUid={product.product_uid} mode="customer" />
        </div>
      )}
    </article>
  );
}
