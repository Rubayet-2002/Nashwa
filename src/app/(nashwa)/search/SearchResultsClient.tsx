"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useToastStore } from "@/zustand/toastStore";
import Lightbox from "@/components/Lightbox";
import ProductCard from "@/app/(nashwa)/home/ProductCard";
import type { FeedProduct } from "@/app/(nashwa)/home/HomeFeedClient";

interface ShopResult {
  shop_uid: string;
  shop_name: string;
  shop_location: string;
  profile_photo_url: string | null;
  avg_rating: string | null;
  follower_count: number;
  university_name: string | null;
}

interface EventResult {
  event_uid: string;
  title: string;
  description: string | null;
  image_url: string | null;
  venue: string;
  start_at: string;
  ends_at: string;
  shop_uid?: string;
}

interface CommunityResult {
  university_uid: string;
  university_name: string;
  description: string | null;
  logo_url: string | null;
}

interface SearchData {
  shops: ShopResult[];
  products: FeedProduct[];
  events: EventResult[];
  communities: CommunityResult[];
}

export default function SearchResultsClient() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const addToast = useToastStore((s) => s.addToast);

  const [activeTab, setActiveTab] = useState<"all" | "shops" | "products" | "events" | "communities">("all");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SearchData>({ shops: [], products: [], events: [], communities: [] });
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  

  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [followedShops, setFollowedShops] = useState<Set<string>>(new Set());
  const [savedProducts, setSavedProducts] = useState<Set<string>>(new Set());
  const [reactedProducts, setReactedProducts] = useState<Set<string>>(new Set());

  useEffect(() => {
    

    fetch("/api/user/interactions")
      .then((res) => res.json())
      .then((d) => {
        setUserId(d.uid);
        setUserRole(d.role);
        setFollowedShops(new Set(d.followedShops || []));
        setSavedProducts(new Set(d.savedProducts || []));
        setReactedProducts(new Set(d.reactedProducts || []));
      })
      .catch((e) => console.error("Error fetching interactions", e));
  }, []);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((d) => {
        setData({
          shops: d.shops || [],
          products: d.products || [],
          events: d.events || [],
          communities: d.communities || [],
        });
      })
      .catch(() => {
        addToast("Failed to fetch search results", "error");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [query, addToast]);

  if (!query) {
    return (
      <div className="bg-white rounded-none border border-[#e8e8e8] p-12 text-center">
        <p className="text-sm font-semibold text-[#1a1a1a]">Search Nashwa</p>
        <p className="text-xs text-[#787878] mt-1">Type in the search bar above to look for shops, products, events, or universities.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-none w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white border border-[#e8e8e8] rounded-none" />
          ))}
        </div>
      </div>
    );
  }

  const totalResults =
    data.shops.length + data.products.length + data.events.length + data.communities.length;

  return (
    <div className="flex flex-col gap-6">
      {/* Search Header */}
      <div>
        <h1 className="text-lg font-bold text-[#1a1a1a]">
          Search results for &ldquo;<span className="text-[#BA5B55]">{query}</span>&rdquo;
        </h1>
        <p className="text-xs text-[#787878] mt-1">{totalResults} results found</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#e8e8e8] pb-1 overflow-x-auto">
        {(["all", "shops", "products", "events", "communities"] as const).map((tab) => {
          const count =
            tab === "all"
              ? totalResults
              : tab === "shops"
              ? data.shops.length
              : tab === "products"
              ? data.products.length
              : tab === "events"
              ? data.events.length
              : data.communities.length;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all capitalize shrink-0 cursor-pointer ${
                activeTab === tab
                  ? "border-[#BA5B55] text-[#BA5B55]"
                  : "border-transparent text-[#787878] hover:text-[#555]"
              }`}
            >
              {tab} ({count})
            </button>
          );
        })}
      </div>

      {/* Results Container */}
      {totalResults === 0 ? (
        <div className="bg-white rounded-none border border-[#e8e8e8] p-12 text-center">
          <p className="text-sm font-semibold text-[#1a1a1a]">No results found</p>
          <p className="text-xs text-[#787878] mt-1">We couldn&apos;t find anything matching your search. Try using other keywords.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* 1. SHOPS */}
          {(activeTab === "all" || activeTab === "shops") && data.shops.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#BA5B55] border-b border-[#f0f0f0] pb-2">Shops</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.shops.map((shop) => (
                  <div key={shop.shop_uid} className="bg-white border border-[#e8e8e8] p-4 rounded-none flex items-center gap-3 hover:border-[#BA5B55]/30 transition-all">
                    <div
                      onClick={() => shop.profile_photo_url && setLightboxSrc(shop.profile_photo_url)}
                      className="relative w-12 h-12 rounded-none overflow-hidden border border-[#f0f0f0] bg-[#fafafa] shrink-0 cursor-pointer"
                    >
                      {shop.profile_photo_url ? (
                        <Image src={shop.profile_photo_url} alt={shop.shop_name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-[#BA5B55] text-sm">
                          {shop.shop_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/shop/${shop.shop_uid}`} className="text-sm font-bold text-[#1a1a1a] hover:text-[#BA5B55] transition-colors truncate block">
                        {shop.shop_name}
                      </Link>
                      <span className="text-[10px] text-[#787878] truncate block mt-0.5">
                        {shop.university_name || shop.shop_location}
                      </span>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[#555] font-light">
                        <span className="flex items-center gap-0.5">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="#BA5B55" stroke="#BA5B55" strokeWidth="1">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                          </svg>
                          {Number(shop.avg_rating || 0).toFixed(1)}
                        </span>
                        <span>{shop.follower_count} followers</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. PRODUCTS */}
          {(activeTab === "all" || activeTab === "products") && data.products.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#BA5B55] border-b border-[#f0f0f0] pb-2">Products</h2>
              <div className="flex flex-col gap-4">
                {data.products.map((product) => (
                  <ProductCard
                    key={product.product_uid}
                    product={product}
                    currentUserId={userId}
                    currentUserRole={userRole}
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
                ))}
              </div>
            </div>
          )}

          {/* 3. EVENTS */}
          {(activeTab === "all" || activeTab === "events") && data.events.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#BA5B55] border-b border-[#f0f0f0] pb-2">Events</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.events.map((event) => (
                  <div key={event.event_uid} className="bg-white border border-[#e8e8e8] p-4 rounded-none flex gap-3 hover:border-[#BA5B55]/30 transition-all">
                    <div
                      onClick={() => event.image_url && setLightboxSrc(event.image_url)}
                      className="relative w-16 h-16 rounded-none overflow-hidden bg-[#fafafa] border border-[#f0f0f0] shrink-0 cursor-pointer"
                    >
                      {event.image_url ? (
                        <Image src={event.image_url} alt={event.title} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-[#1a1a1a] line-clamp-1">{event.title}</h4>
                        <p className="text-[10px] text-[#787878] leading-none mt-0.5">{event.venue}</p>
                        {event.description && (
                          <p className="text-[10px] text-[#aaa] mt-1 line-clamp-2 leading-relaxed">{event.description}</p>
                        )}
                      </div>
                      <div className="mt-1 text-[9px] text-[#BA5B55] font-semibold">
                        Ends: {new Date(event.ends_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. COMMUNITIES */}
          {(activeTab === "all" || activeTab === "communities") && data.communities.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#BA5B55] border-b border-[#f0f0f0] pb-2">Communities</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.communities.map((c) => (
                  <div key={c.university_uid} className="bg-white border border-[#e8e8e8] p-4 rounded-none flex items-center gap-3 hover:border-[#BA5B55]/30 transition-all">
                    <div
                      onClick={() => c.logo_url && setLightboxSrc(c.logo_url)}
                      className="relative w-12 h-12 rounded-none overflow-hidden border border-[#f0f0f0] bg-[#fafafa] shrink-0 cursor-pointer"
                    >
                      {c.logo_url ? (
                        <Image src={c.logo_url} alt={c.university_name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-[#BA5B55] text-sm bg-[#fdf0ef]">
                          {c.university_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/university/${c.university_uid}`} className="text-sm font-bold text-[#1a1a1a] hover:text-[#BA5B55] transition-colors truncate block">
                        {c.university_name}
                      </Link>
                      {c.description && (
                        <p className="text-[10px] text-[#787878] mt-0.5 line-clamp-2 leading-relaxed">{c.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightboxSrc && (
        <Lightbox
          src={lightboxSrc}
          alt="Search Result Preview"
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </div>
  );
}
