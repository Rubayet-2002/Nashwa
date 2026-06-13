"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Store, ArrowLeft, Users, MapPin } from "@mynaui/icons-react";
import { useToastStore } from "@/zustand/toastStore";
import Lightbox from "@/components/Lightbox";
import ProductCard from "@/app/(nashwa)/home/ProductCard";
import type { FeedProduct } from "@/app/(nashwa)/home/HomeFeedClient";

type ShopRow = {
  shop_uid: string;
  owner_uid: string;
  shop_name: string;
  shop_location: string;
  shop_description: string;
  profile_photo_url: string | null;
  owner_username: string;
  followers_count: number;
  is_following: boolean;
};

interface UniversityShopsClientProps {
  university: {
    university_uid: string;
    university_name: string;
    description: string | null;
    logo_url: string | null;
  };
  shops: ShopRow[];
  shopImages: Record<string, string[]>;
  currentUid: string | null;
  initialProducts: FeedProduct[];
  initialFollowedShops: string[];
  initialSavedProducts: string[];
  initialReactedProducts: string[];
}

export default function UniversityShopsClient({
  university,
  shops,
  shopImages,
  currentUid,
  initialProducts,
  initialFollowedShops,
  initialSavedProducts,
  initialReactedProducts,
}: UniversityShopsClientProps) {
  const addToast = useToastStore((s) => s.addToast);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const [products, setProducts] = useState<FeedProduct[]>(initialProducts);
  const [followedShops, setFollowedShops] = useState<Set<string>>(new Set(initialFollowedShops));
  const [savedProducts, setSavedProducts] = useState<Set<string>>(new Set(initialSavedProducts));
  const [reactedProducts, setReactedProducts] = useState<Set<string>>(new Set(initialReactedProducts));

  const handleFollowToggle = async (shopUid: string, shopName: string) => {
    if (!currentUid) {
      addToast("Please sign in to follow shops", "error");
      return;
    }
    const isFollowing = followedShops.has(shopUid);
    setFollowedShops((prev) => {
      const next = new Set(prev);
      if (isFollowing) next.delete(shopUid);
      else next.add(shopUid);
      return next;
    });

    try {
      const response = await fetch(`/api/shops/${shopUid}/follow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      const result = await response.json();
      if (!response.ok) {
        addToast(result.error || "Failed to update follow status.", "error");
        setFollowedShops((prev) => {
          const next = new Set(prev);
          if (isFollowing) next.add(shopUid);
          else next.delete(shopUid);
          return next;
        });
        return;
      }
      addToast(
        result.following ? `Following ${shopName}` : `Unfollowed ${shopName}`,
        "success"
      );
    } catch {
      addToast("Network error. Please try again.", "error");
      setFollowedShops((prev) => {
        const next = new Set(prev);
        if (isFollowing) next.add(shopUid);
        else next.delete(shopUid);
        return next;
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#f6f4f2] font-sans">

      {/* ── University Hero Banner ── */}
      <header className="shrink-0 bg-gradient-to-r from-[#1a0f0e] via-[#2d1614] to-[#3d1e1a] px-6 py-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div
            className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 border-white/20 bg-white/10 cursor-pointer hover:scale-105 transition-transform duration-200 shadow-lg"
            onClick={() => { if (university.logo_url) setLightboxSrc(university.logo_url); }}
          >
            {university.logo_url ? (
              <Image
                src={university.logo_url}
                alt={university.university_name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-white/60">
                <Store size={22} />
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#e8a89e] font-bold mb-1">
              University Community
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight">
              {university.university_name}
            </h1>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="flex items-center gap-1.5 text-[11px] text-white/60 font-light">
                <Store size={12} className="text-[#e8a89e]" />
                {shops.length} {shops.length === 1 ? "shop" : "shops"} joined
              </span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span className="flex items-center gap-1.5 text-[11px] text-white/60 font-light">
                <Users size={12} className="text-[#e8a89e]" />
                {products.length} active posts
              </span>
            </div>
          </div>
        </div>

        <Link
          href="/university"
          className="inline-flex items-center gap-2 text-xs font-semibold text-white/70 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-full transition-all"
        >
          <ArrowLeft size={14} />
          All Universities
        </Link>
      </header>

      {/* Description strip */}
      {university.description && (
        <div className="shrink-0 bg-[#2d1614]/5 border-b border-[#BA5B55]/10 px-6 py-3">
          <p className="text-xs text-[#555] leading-relaxed max-w-3xl font-light">
            {university.description}
          </p>
        </div>
      )}

      {/* ── Two-Column Body: Shops (left) + Posts (right) ── */}
      {/* Using CSS grid so children properly inherit height and overflow-y-auto works */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[22rem_1fr] overflow-hidden">

        {/* LEFT: Shops List (scrollable) */}
        <section className="flex flex-col min-h-0 border-r border-[#e8e8e8] bg-white overflow-hidden">
          {/* Header */}
          <div className="shrink-0 px-5 py-4 border-b border-[#f0f0f0] bg-[#fafafa]">
            <h2 className="text-xs font-bold text-[#1f1f1f] uppercase tracking-wider flex items-center gap-2">
              <Store size={14} className="text-[#BA5B55]" />
              Joined Shops
              <span className="ml-auto bg-[#BA5B55]/10 text-[#BA5B55] text-[10px] font-bold px-2 py-0.5 rounded-full">
                {shops.length}
              </span>
            </h2>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3">
            {shops.length > 0 ? (
              shops.map((shop) => {
                const isShopFollowing = followedShops.has(shop.shop_uid);
                const dynamicFollowers =
                  shop.followers_count +
                  (isShopFollowing ? (shop.is_following ? 0 : 1) : shop.is_following ? -1 : 0);

                return (
                  <article
                    key={shop.shop_uid}
                    className="bg-white border border-[#ece7e5] rounded-2xl overflow-hidden hover:shadow-md hover:border-[#BA5B55]/30 transition-all duration-200"
                  >
                    {/* Shop header */}
                    <div className="p-4 flex items-center gap-3">
                      <div
                        className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-[#f0ebe8] bg-[#fafafa] cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => shop.profile_photo_url && setLightboxSrc(shop.profile_photo_url)}
                      >
                        {shop.profile_photo_url ? (
                          <Image
                            src={shop.profile_photo_url}
                            alt={shop.shop_name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#fcf7f6] to-[#f4ece9] text-[#BA5B55] font-bold text-sm uppercase">
                            {shop.shop_name.slice(0, 2)}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm text-[#1f1f1f] truncate leading-tight">
                          {shop.shop_name}
                        </h3>
                        <p className="text-[11px] text-[#8a8a8a] font-light mt-0.5">
                          @{shop.owner_username}
                        </p>
                      </div>
                    </div>

                    {shop.shop_description && (
                      <p className="px-4 pb-3 text-[11px] text-gray-500 line-clamp-2 leading-relaxed font-light">
                        {shop.shop_description}
                      </p>
                    )}

                    {/* Stats + location */}
                    <div className="px-4 pb-3 flex items-center justify-between text-[10px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <MapPin size={10} className="text-[#BA5B55]" />
                        {shop.shop_location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={10} className="text-[#BA5B55]" />
                        {dynamicFollowers} followers
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="px-4 pb-4 flex gap-2">
                      <Link
                        href={`/shop/${shop.shop_uid}`}
                        className="flex-1 text-center border border-[#e6e2df] py-2 text-xs font-semibold text-[#666] hover:border-[#ba5b55] hover:text-[#ba5b55] transition-colors rounded-xl"
                      >
                        Visit Shop
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleFollowToggle(shop.shop_uid, shop.shop_name)}
                        className={`flex-1 text-center py-2 border text-xs font-semibold transition-all rounded-xl cursor-pointer ${
                          isShopFollowing
                            ? "border-[#ba5b55] bg-[#ba5b55] text-white hover:bg-white hover:text-[#ba5b55]"
                            : "border-[#dcdcdc] text-[#787878] hover:border-[#ba5b55] hover:text-[#ba5b55]"
                        }`}
                      >
                        {isShopFollowing ? "Following" : "Follow"}
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#f4ece9] flex items-center justify-center mb-3">
                  <Store size={20} className="text-[#BA5B55]/40" />
                </div>
                <p className="text-xs font-semibold text-[#555]">No shops yet</p>
                <p className="text-[11px] text-[#9a9a9a] font-light mt-1">
                  No approved shops have joined this university yet.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT: Community Posts Feed (scrollable) */}
        <section className="flex flex-col min-h-0 bg-[#f6f4f2] overflow-hidden">
          {/* Header */}
          <div className="shrink-0 px-5 py-4 border-b border-[#e8e8e8] bg-white">
            <h2 className="text-xs font-bold text-[#1f1f1f] uppercase tracking-wider flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#BA5B55" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18M9 21V9"/>
              </svg>
              Community Posts
              <span className="ml-auto bg-[#BA5B55]/10 text-[#BA5B55] text-[10px] font-bold px-2 py-0.5 rounded-full">
                {products.length}
              </span>
            </h2>
          </div>

          {/* Scrollable posts */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">
            {products.length > 0 ? (
              products.map((product) => (
                <ProductCard
                  key={product.product_uid}
                  product={product}
                  currentUserId={currentUid}
                  currentUserRole={null}
                  isFollowing={followedShops.has(product.shop_uid)}
                  isSaved={savedProducts.has(product.product_uid)}
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
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white border border-[#ece7e5] flex items-center justify-center mb-4 shadow-xs">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#BA5B55" strokeWidth="1.5" opacity="0.4">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M3 9h18M9 21V9"/>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-[#555]">No posts yet</p>
                <p className="text-xs text-[#9a9a9a] font-light mt-1 max-w-xs">
                  No active posts from shops in this community yet.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      {lightboxSrc && (
        <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} alt="Preview Media" />
      )}
    </div>
  );
}
