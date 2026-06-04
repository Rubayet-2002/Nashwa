"use client";

import { useState, useCallback } from "react";
import FilterBar, { FilterState } from "./FilterBar";
import ProductCard from "./ProductCard";

export type FeedProduct = {
  product_uid: string;
  title: string;
  description: string | null;
  price: string;
  original_price: string | null;
  discount_percent: string | null;
  currency: string;
  category: string | null;
  product_type: string;
  inside_delivery_charge: string;
  outside_delivery_charge: string;
  free_on_campus_delivery: boolean;
  image_url: string | null;
  image_urls: string[];
  comment_count: number;
  sold_count: number;
  like_count: number;
  avg_rating: string | null;
  shop_uid: string;
  shop_name: string;
  shop_location: string;
  shop_profile_photo_url: string | null;
  shop_university_name: string | null;
  shop_blocked: boolean;
  event_status: string | null;
  shop_owner_uid?: string;
};

interface Props {
  initialProducts: FeedProduct[];
  communities: { university_uid: string; university_name: string; logo_url?: string | null }[];
  currentUserId: string | null;
  currentUserRole: string | null;
  initialFollowedShops: string[];
  initialSavedProducts: string[];
  initialReactedProducts: string[];
}

export default function HomeFeedClient({
  initialProducts,
  communities,
  currentUserId,
  currentUserRole,
  initialFollowedShops,
  initialSavedProducts,
  initialReactedProducts,
}: Props) {
  const [products, setProducts] = useState<FeedProduct[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [followedShops, setFollowedShops] = useState<Set<string>>(new Set(initialFollowedShops));
  const [savedProducts, setSavedProducts] = useState<Set<string>>(new Set(initialSavedProducts));
  const [reactedProducts, setReactedProducts] = useState<Set<string>>(new Set(initialReactedProducts));

  const fetchFeed = useCallback(async (filters: FilterState) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        tab: filters.tab,
        minPrice: String(filters.minPrice),
        maxPrice: String(filters.maxPrice),
        ...(filters.category && filters.category.length > 0 && { category: filters.category.join(",") }),
        ...(filters.communityId && filters.communityId.length > 0 && { communityId: filters.communityId.join(",") }),
      });
      const r = await fetch(`/api/feed?${params}`);
      if (r.ok) {
        const d = await r.json();
        setProducts(d.products || []);
      }
    } catch (e) {
      console.error("Feed fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="flex flex-col gap-2.5 h-full min-h-0">
      <FilterBar onFilterChange={fetchFeed} communities={communities} />

      {/* Scrollable container with custom scrollbar */}
      <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col gap-2.5">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-3.5">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="skeleton w-11 h-11 rounded-sm" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="skeleton h-3 w-2/5" />
                    <div className="skeleton h-2.5 w-1/3" />
                  </div>
                </div>
                <div className="skeleton h-2.5 w-4/5 mb-1.5" />
                <div className="skeleton h-2.5 w-3/5 mb-3" />
                <div className="flex gap-2.5">
                  <div className="skeleton w-40 h-35" />
                  <div className="skeleton flex-1 h-35" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="text-4xl mb-3">🛍️</div>
            <p className="font-bold text-sm">No products found</p>
            <p className="text-xs text-gray-500 mt-1">Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {products.map(product => (
              <ProductCard
                key={product.product_uid}
                product={product}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                isFollowing={followedShops.has(product.shop_uid)}
                isSaved={savedProducts.has(product.product_uid)}
                hasReacted={reactedProducts.has(product.product_uid)}
                onFollowChange={(shopUid, following) => {
                  setFollowedShops(prev => {
                    const next = new Set(prev);
                    if (following) next.add(shopUid); else next.delete(shopUid);
                    return next;
                  });
                }}
                onSaveChange={(prodUid, saved) => {
                  setSavedProducts(prev => {
                    const next = new Set(prev);
                    if (saved) next.add(prodUid); else next.delete(prodUid);
                    return next;
                  });
                }}
                onReactChange={(prodUid, reacted) => {
                  setReactedProducts(prev => {
                    const next = new Set(prev);
                    if (reacted) next.add(prodUid); else next.delete(prodUid);
                    return next;
                  });
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}