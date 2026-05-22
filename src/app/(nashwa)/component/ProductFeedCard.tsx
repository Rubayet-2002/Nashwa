"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChatMessages, Bookmark } from "@mynaui/icons-react";
import ProductCommentThread from "./ProductCommentThread";
import ProductReactionButton from "./ProductReactionButton";

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
              <ProductReactionButton productUid={product.product_uid} />
              <button
                type="button"
                onClick={() => {
                  const commentsElement = document.getElementById(`comments-${product.product_uid}`);
                  commentsElement?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="inline-flex items-center gap-2 rounded-full border border-[#e8e1df] px-3 py-2 text-xs font-medium text-[#4f4f4f] transition-colors hover:border-[#BA5B55] hover:text-[#BA5B55]"
              >
                <ChatMessages size={14} />
                Comment
              </button>
            </div>

            <div id={`comments-${product.product_uid}`} className="scroll-mt-6">
              <ProductCommentThread productUid={product.product_uid} mode="customer" />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
