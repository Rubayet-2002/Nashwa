"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useToastStore } from "@/zustand/toastStore";
import { connectSocket } from "@/lib/socket-client";
import ProductCommentThread from "./ProductCommentThread";
import type { FeedProduct } from "./HomeFeedClient";
import {
  UserPlus,
  Heart,
  Message,
  Share,
  Bookmark,
  Star,
  Maximize,
  DotsVertical,
} from "@mynaui/icons-react";

interface Props {
  product: FeedProduct;
  currentUserId: string | null;
  currentUserRole: string | null;
  isFollowing: boolean;
  isSaved: boolean;
  hasReacted: boolean;
  onFollowChange: (shopUid: string, following: boolean) => void;
  onSaveChange: (prodUid: string, saved: boolean) => void;
  onReactChange: (prodUid: string, reacted: boolean) => void;
  hideFollowButton?: boolean;
  compact?: boolean;
}

export default function ProductCard({
  product,
  currentUserId,
  currentUserRole,
  isFollowing,
  isSaved,
  hasReacted,
  onFollowChange,
  onSaveChange,
  onReactChange,
  hideFollowButton = false,
  compact = false,
}: Props) {
  const addToast = useToastStore((s) => s.addToast);
  const [showComments, setShowComments] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [likeCount, setLikeCount] = useState(product.like_count || 0);
  const [reportText, setReportText] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  const images =
    Array.isArray(product.image_urls) && product.image_urls.length > 0
      ? product.image_urls
      : product.image_url
      ? [product.image_url]
      : [];

  const discountedPrice = Number(product.price);
  const originalPrice = product.original_price ? Number(product.original_price) : null;
  const hasDiscount = product.discount_percent && Number(product.discount_percent) > 0;
  const isPreorder = product.product_type === "preorder";

  // Real-time like sync
  useEffect(() => {
    const socket = connectSocket();
    socket.emit("join:product", { productId: product.product_uid });
    socket.on("product:like", (d: { productId: string; count: number }) => {
      if (d.productId === product.product_uid) setLikeCount(d.count);
    });
    return () => {
      socket.off("product:like");
    };
  }, [product.product_uid]);

  const handleReact = async () => {
    if (!currentUserId) {
      addToast("Please sign in to like posts", "error");
      return;
    }
    const prev = hasReacted;
    setLikeCount((n) => (prev ? n - 1 : n + 1));
    onReactChange(product.product_uid, !prev);
    try {
      const r = await fetch(`/api/products/${product.product_uid}/reactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      if (!r.ok) {
        setLikeCount((n) => (prev ? n + 1 : n - 1));
        onReactChange(product.product_uid, prev);
      }
    } catch {
      setLikeCount((n) => (prev ? n + 1 : n - 1));
      onReactChange(product.product_uid, prev);
    }
  };

  const handleSave = async () => {
    if (!currentUserId) {
      addToast("Please sign in to save posts", "error");
      return;
    }
    const prev = isSaved;
    onSaveChange(product.product_uid, !prev);
    try {
      await fetch(`/api/products/${product.product_uid}/save`, {
        method: "POST",
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      addToast(!prev ? "Saved!" : "Removed from saved", "success");
      window.dispatchEvent(new Event("saved-posts:updated"));
    } catch {
      onSaveChange(product.product_uid, prev);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/product/${product.product_uid}`;
    navigator.clipboard
      .writeText(url)
      .then(() => addToast("Link copied!", "success"))
      .catch(() => {});
    fetch(`/api/products/${product.product_uid}/share`, {
      method: "POST",
      headers: { "X-Requested-With": "XMLHttpRequest" },
    }).catch(() => {});
  };

  const handleFollow = async () => {
    if (!currentUserId) {
      addToast("Please sign in to follow shops", "error");
      return;
    }
    const prev = isFollowing;
    onFollowChange(product.shop_uid, !prev);
    try {
      await fetch(`/api/shops/${product.shop_uid}/follow`, {
        method: "POST",
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      addToast(
        !prev ? `Following ${product.shop_name}` : `Unfollowed ${product.shop_name}`,
        "success"
      );
    } catch {
      onFollowChange(product.shop_uid, prev);
    }
  };

  const handleReport = async () => {
    if (!reportText.trim()) return;
    setReportLoading(true);
    try {
      const r = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          productUid: product.product_uid,
          reason: reportText,
        }),
      });
      if (r.ok) {
        addToast("Report submitted. Thank you!", "success");
        setShowReport(false);
        setReportText("");
      } else {
        const d = await r.json();
        addToast(d.message || "Failed to report", "error");
      }
    } catch {
      addToast("Network error", "error");
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <article className="bg-white rounded-xl border border-[#e2e2e2] overflow-hidden shadow-xs">
      {/* Header */}
      <div className="flex justify-between items-start px-3 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link href={`/shop/${product.shop_uid}`} className="shrink-0">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-[#fdf0ef] border border-[#e2e2e2] flex items-center justify-center relative">
              {product.shop_profile_photo_url ? (
                <Image
                  src={product.shop_profile_photo_url}
                  alt={product.shop_name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold text-[#ba5b55]">
                  {product.shop_name[0]?.toUpperCase()}
                </span>
              )}
            </div>
          </Link>

          <div className="min-w-0 flex flex-col gap-1">
            <Link
              href={`/shop/${product.shop_uid}`}
              className="text-sm font-bold text-[#1a1a1a] hover:text-[#ba5b55] truncate leading-none"
            >
              {product.shop_name}
            </Link>
            <p className="text-xs text-[#787878] leading-none truncate">
              {product.shop_university_name || product.shop_location}
            </p>
          </div>
        </div>

        <div className="flex justify-center items-center gap-2 shrink-0">
          {isPreorder && (
            <span className="px-2 py-1 bg-[#fffbeb] border border-[#fde68a] text-[#d97706] text-[10px] font-bold rounded-full">
              Pre-order
            </span>
          )}
          {!hideFollowButton && (
            <button
              onClick={handleFollow}
              className={`flex justify-center items-center gap-1 px-3 py-1.5 leading-none rounded-full border text-xs font-semibold transition-all cursor-pointer ${
                isFollowing
                  ? "border-[#ba5b55] bg-[#ba5b55] text-white hover:bg-white hover:text-[#ba5b55]"
                  : "border-[#dcdcdc] text-[#787878] hover:border-[#ba5b55] hover:text-[#ba5b55]"
              }`}
            >
              <UserPlus size={14} />
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
          <button
            onClick={() => setShowReport(true)}
            className="flex justify-center items-center gap-1 p-1.5 leading-none rounded-full border border-[#dcdcdc] text-gray-500 hover:border-[#ba5b55] hover:text-[#ba5b55] transition cursor-pointer"
          >
            <DotsVertical size={18} stroke={2.5} />
          </button>
        </div>
      </div>

      {/* Caption */}
      <div className="px-3 pb-2">
        <p
          className={`text-xs leading-relaxed text-[#1a1a1a] ${
            showMore ? "" : "line-clamp-2"
          }`}
        >
          {product.description || "No description."}
        </p>
        {(product.description?.length ?? 0) > 120 && (
          <button
            onClick={() => setShowMore(!showMore)}
            className="text-[11px] font-bold text-[#ba5b55] hover:underline mt-1 cursor-pointer"
          >
            {showMore ? "See less" : "See more"}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-3 pt-0">
        <div className={`flex gap-4 flex-col ${compact ? "" : "sm:flex-row"}`}>
          {/* Images */}
          <div className={`shrink-0 mx-auto ${compact ? "w-full" : "w-56 sm:mx-0"}`}>
            <Link href={`/product/${product.product_uid}`}>
              <div className="w-full h-36 bg-[#f4f4f4] border border-[#e2e2e2] rounded overflow-hidden relative cursor-pointer">
                {images[activeImg] ? (
                  <Image
                    src={images[activeImg]}
                    alt={product.title}
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                )}
              </div>
            </Link>

            {images.length > 1 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {images.slice(0, 3).map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`relative h-14 border rounded overflow-hidden cursor-pointer transition-all ${
                      activeImg === i ? "border-[#ba5b55] ring-1 ring-[#ba5b55]" : "border-gray-200"
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover" />
                    {i === 2 && images.length > 3 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[10px] font-bold">
                        +{images.length - 3}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col justify-between flex-1 min-w-0 gap-3">
            <div className="flex flex-col gap-3 border border-[#dcdcdc] px-3 py-3.5 rounded-lg bg-gray-50/50">
              <Link
                href={`/product/${product.product_uid}`}
                className="text-xs font-bold leading-normal text-[#1a1a1a] hover:text-[#ba5b55] line-clamp-2"
              >
                {product.title}
              </Link>

              <div className="flex flex-col gap-1.5">
                <div className="flex text-xs leading-none">
                  <span className="w-14 text-gray-500">Price</span>
                  <span className="w-2.5 text-gray-400">:</span>
                  <span className="text-[#ba5b55] font-bold">
                    ৳{discountedPrice.toFixed(0)}/- Taka
                  </span>
                  {hasDiscount && originalPrice && (
                    <span className="text-[10px] text-gray-400 line-through ml-2">
                      ৳{originalPrice.toFixed(0)}
                    </span>
                  )}
                  {hasDiscount && (
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 ml-1.5">
                      -{Number(product.discount_percent).toFixed(0)}%
                    </span>
                  )}
                </div>
                {product.category && (
                  <div className="flex text-xs leading-none">
                    <span className="w-14 text-gray-500">Category</span>
                    <span className="w-2.5 text-gray-400">:</span>
                    <span className="text-[#1a1a1a] font-semibold">
                      {product.category}
                    </span>
                  </div>
                )}
                <div className="flex text-xs leading-none">
                  <span className="w-14 text-gray-500">Rating</span>
                  <span className="w-2.5 text-gray-400">:</span>
                  <div className="text-[#ba5b55] flex justify-center items-center gap-1 font-semibold">
                    <p>{product.avg_rating ? Number(product.avg_rating).toFixed(1) : "New"}</p>
                    <Star size={11} fill="#ba5b55" className="text-[#ba5b55]" />
                  </div>
                </div>
              </div>
            </div>

            <Link href={`/product/${product.product_uid}`} className="w-full">
              <button className="w-full flex justify-center items-center gap-1.5 px-3 py-2 leading-none border border-[#ba5b55] bg-[#ba5b55] text-white text-xs font-bold hover:bg-white hover:text-[#ba5b55] transition cursor-pointer">
                <Maximize size={14} />
                View Product
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-3 pt-0 text-[10px] text-gray-500 font-medium border-b border-[#f0f0f0]">
        <p>
          {likeCount} {likeCount === 1 ? "like" : "likes"} · {product.comment_count} comments ·{" "}
          {product.sold_count} sold
        </p>
      </div>

      {/* Footer */}
      <footer className="flex justify-around text-gray-500 py-2.5 shrink-0 bg-white">
        <button
          onClick={handleReact}
          className={`flex items-center justify-center p-1.5 hover:text-[#ba5b55] transition-colors cursor-pointer ${
            hasReacted ? "text-[#ba5b55]" : ""
          }`}
          title="Like"
        >
          <Heart size={20} fill={hasReacted ? "#ba5b55" : "none"} />
        </button>
        <button
          onClick={() => {
            if (!currentUserId) {
              addToast("Please sign in to comment", "error");
              return;
            }
            setShowComments(!showComments);
          }}
          className={`flex items-center justify-center p-1.5 hover:text-[#ba5b55] transition-colors cursor-pointer ${
            showComments ? "text-[#ba5b55]" : ""
          }`}
          title="Comment"
        >
          <Message size={20} />
        </button>
        <button
          onClick={handleShare}
          className="flex items-center justify-center p-1.5 hover:text-[#ba5b55] transition-colors cursor-pointer"
          title="Share"
        >
          <Share size={20} />
        </button>
        <button
          onClick={handleSave}
          className={`flex items-center justify-center p-1.5 hover:text-[#ba5b55] transition-colors cursor-pointer ${
            isSaved ? "text-[#ba5b55]" : ""
          }`}
          title="Save"
        >
          <Bookmark size={20} fill={isSaved ? "#ba5b55" : "none"} />
        </button>
      </footer>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-[#f0f0f0] p-4 bg-gray-50/20">
          <ProductCommentThread
            productUid={product.product_uid}
            shopUid={product.shop_uid}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            shopOwnerUid={product.shop_owner_uid}
          />
        </div>
      )}

      {/* Report Modal */}
      {showReport && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-1000 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowReport(false)}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-[#f0f0f0] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#1a1a1a]">Report Post</h3>
              <button
                onClick={() => setShowReport(false)}
                className="text-xl text-gray-400 hover:text-gray-600 cursor-pointer outline-none"
              >
                ×
              </button>
            </div>
            <div className="p-5 flex flex-col gap-3">
              <p className="text-xs text-gray-500">Why are you reporting this post?</p>
              {["Spam or misleading", "Inappropriate content", "Fake product", "Counterfeit goods", "Other"].map((reason) => (
                <button
                  key={reason}
                  onClick={() => setReportText(reason)}
                  className={`w-full text-left px-3 py-2 text-xs border rounded transition-all cursor-pointer ${
                    reportText === reason
                      ? "border-[#ba5b55] bg-[#fdf0ef] font-bold text-[#ba5b55]"
                      : "border-gray-200 text-gray-700 hover:border-[#ba5b55]"
                  }`}
                >
                  {reason}
                </button>
              ))}
              <textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="Describe the issue..."
                rows={3}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded focus:border-[#ba5b55] outline-none resize-none bg-white text-[#1a1a1a]"
              />
              <div className="flex gap-2 justify-end mt-2">
                <button
                  onClick={() => setShowReport(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReport}
                  disabled={!reportText.trim() || reportLoading}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#ba5b55] rounded hover:bg-[#9e4f4a] transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {reportLoading ? "Submitting…" : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
