"use client";

import { useState } from "react";
import ProductCard from "../home/ProductCard";
import type { FeedProduct } from "../home/HomeFeedClient";

interface Props {
  initialProducts: FeedProduct[];
  currentUserId: string;
  initialFollowedShops: string[];
  initialReactedProducts: string[];
}

export default function SavedPostsClient({
  initialProducts,
  currentUserId,
  initialFollowedShops,
  initialReactedProducts,
}: Props) {
  const [products] = useState<FeedProduct[]>(initialProducts);
  const [followedShops, setFollowedShops] = useState<Set<string>>(new Set(initialFollowedShops));
  const [reactedProducts, setReactedProducts] = useState<Set<string>>(new Set(initialReactedProducts));
  const [savedProducts, setSavedProducts] = useState<Set<string>>(
    new Set(initialProducts.map((p) => p.product_uid))
  );

  return (
    <div className="flex flex-col gap-4 max-w-xl mx-auto w-full">
      {products.length === 0 ? (
        <div className="bg-white border border-[#e2e2e2] rounded-xl p-8 text-center flex flex-col items-center justify-center">
          <div className="text-4xl mb-3">🔖</div>
          <p className="font-bold text-sm text-[#1a1a1a]">No saved posts yet</p>
          <p className="text-xs text-gray-500 mt-1">
            Bookmark products you like to find them here later!
          </p>
        </div>
      ) : (
        products.map((product) => {
          const isSaved = savedProducts.has(product.product_uid);
          if (!isSaved) return null;

          return (
            <ProductCard
              key={product.product_uid}
              product={product}
              currentUserId={currentUserId}
              currentUserRole="customer"
              isFollowing={followedShops.has(product.shop_uid)}
              isSaved={true}
              hasReacted={reactedProducts.has(product.product_uid)}
              onFollowChange={(shopUid, following) => {
                setFollowedShops((prev) => {
                  const next = new Set(prev);
                  if (following) next.add(shopUid);
                  else next.delete(shopUid);
                  return next;
                });
              }}
              onSaveChange={(prodUid, saved) => {
                setSavedProducts((prev) => {
                  const next = new Set(prev);
                  if (saved) next.add(prodUid);
                  else next.delete(prodUid);
                  return next;
                });
              }}
              onReactChange={(prodUid, reacted) => {
                setReactedProducts((prev) => {
                  const next = new Set(prev);
                  if (reacted) next.add(prodUid);
                  else next.delete(prodUid);
                  return next;
                });
              }}
            />
          );
        })
      )}
    </div>
  );
}
