"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChatMessages, Bookmark, Heart } from "@mynaui/icons-react";

export type FeedProduct = {
  product_uid: string;
  title: string;
  description: string | null;
  price: string;
  currency: string;
  image_url: string | null;
  shop_uid: string;
  shop_name: string;
  shop_location: string;
  shop_university_name: string | null;
};

interface ProductFeedCardProps {
  product: FeedProduct;
}

export default function ProductFeedCard({ product }: ProductFeedCardProps) {
  const [reactCount, setReactCount] = useState(0);
  const [hasReacted, setHasReacted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Array<{ id: number; text: string }>>([]);

  const handleAddComment = () => {
    const text = commentText.trim();
    if (!text) return;
    setComments((current) => [...current, { id: Date.now(), text }]);
    setCommentText("");
    setShowComments(true);
  };

  return (
    <article className="rounded-2xl border border-[#e8e1df] bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#8b8b8b]">
              <span>{product.shop_name}</span>
              {product.shop_university_name && <span>• {product.shop_university_name}</span>}
            </div>
            <h3 className="mt-1 text-lg font-semibold text-[#1a1a1a]">{product.title}</h3>
          </div>
          <Link
            href={`/shop/profile/${product.shop_uid}`}
            className="rounded-full border border-[#e8e1df] px-3 py-1 text-xs font-medium text-[#8e5a52] transition-colors hover:border-[#BA5B55] hover:text-[#BA5B55]"
          >
            Visit shop
          </Link>
        </div>

        <p className="mt-1 text-xs text-[#8b8b8b]">{product.shop_location}</p>

        <div className="mt-4 grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#f4f4f4] border border-[#eee]">
            {product.image_url ? (
              <Image src={product.image_url} alt={product.title} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[#c9c0bd]">
                <Bookmark size={40} />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm leading-relaxed text-[#4f4f4f]">
                {product.description || "No description added yet."}
              </p>
              <div className="mt-3 inline-flex items-center rounded-full border border-[#efe4e2] bg-[#fcf7f6] px-3 py-1 text-xs font-semibold text-[#BA5B55]">
                {product.currency} {Number(product.price).toFixed(2)}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setHasReacted((value) => !value);
                  setReactCount((value) => (hasReacted ? Math.max(0, value - 1) : value + 1));
                }}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                  hasReacted
                    ? "border-[#BA5B55] bg-[#BA5B55]/10 text-[#BA5B55]"
                    : "border-[#e8e1df] text-[#4f4f4f] hover:border-[#BA5B55] hover:text-[#BA5B55]"
                }`}
              >
                <Heart size={14} fill={hasReacted ? "currentColor" : "none"} />
                React ({reactCount})
              </button>
              <button
                type="button"
                onClick={() => setShowComments((value) => !value)}
                className="inline-flex items-center gap-2 rounded-full border border-[#e8e1df] px-3 py-2 text-xs font-medium text-[#4f4f4f] transition-colors hover:border-[#BA5B55] hover:text-[#BA5B55]"
              >
                <ChatMessages size={14} />
                Comment ({comments.length})
              </button>
            </div>

            {showComments && (
              <div className="rounded-2xl border border-[#eee] bg-[#fcfcfd] p-4">
                <div className="flex gap-2">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                    placeholder="Write a comment..."
                    className="min-w-0 flex-1 rounded-full border border-[#e8e1df] bg-white px-4 py-2 text-sm outline-none focus:border-[#BA5B55]"
                  />
                  <button
                    type="button"
                    onClick={handleAddComment}
                    className="rounded-full bg-[#BA5B55] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#a94d48]"
                  >
                    Post
                  </button>
                </div>

                <div className="mt-4 space-y-2">
                  {comments.length === 0 ? (
                    <p className="text-xs text-[#8b8b8b]">No comments yet. Be the first one.</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="rounded-xl border border-[#eee] bg-white px-3 py-2 text-sm text-[#4f4f4f]">
                        <p>{comment.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
