"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Store, ArrowLeft } from "@mynaui/icons-react";
import FollowShopButton from "@/components/FollowShopButton";
import Lightbox from "@/components/Lightbox";

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
}

export default function UniversityShopsClient({
  university,
  shops,
  shopImages,
  currentUid,
}: UniversityShopsClientProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-white shadow-xs p-6 rounded-3xl border border-gray-150 font-sans max-w-5xl mx-auto">
      <header className="border-b border-[#f0f0f0] pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div
              className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-[#ece7e5] bg-[#fafafa] cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => {
                if (university.logo_url) {
                  setLightboxSrc(university.logo_url);
                }
              }}
            >
              {university.logo_url ? (
                <Image
                  src={university.logo_url}
                  alt={university.university_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[#BA5B55]">
                  <Store size={18} />
                </div>
              )}
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#9aa6a3] font-bold">community</p>
              <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-[#232323]">{university.university_name}</h1>
              <p className="mt-1 text-xs sm:text-sm text-[#7b7b7b]">{shops.length} {shops.length === 1 ? 'shop' : 'shops'} available</p>
            </div>
          </div>

          <Link href="/university" className="inline-flex items-center gap-2 text-xs font-semibold text-[#ba5b55] hover:text-[#9c403a] hover:underline">
            <ArrowLeft size={14} />
            Back to universities
          </Link>
        </div>
        {university.description && (
          <p className="mt-4 text-xs text-gray-500 leading-normal max-w-2xl bg-gray-50 p-3.5 rounded-2xl border border-gray-100 font-light">
            {university.description}
          </p>
        )}
      </header>

      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {shops.length > 0 ? (
          shops.map((shop) => {
            const images = shopImages[shop.shop_uid] || [];

            return (
              <article key={shop.shop_uid} className="rounded-2xl border border-[#ece7e5] p-5 flex flex-col justify-between hover:shadow-xs hover:border-[#BA5B55]/30 transition-all">
                <div>
                  <div className="flex items-start justify-between gap-3 border-b border-gray-50 pb-3 mb-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#eadfdb] bg-[#f5f1ee] cursor-pointer hover:opacity-90"
                        onClick={() => shop.profile_photo_url && setLightboxSrc(shop.profile_photo_url)}
                      >
                        {shop.profile_photo_url ? (
                          <Image src={shop.profile_photo_url} alt={shop.shop_name} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#BA5B55]">
                            <Store size={16} />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h2 className="truncate text-sm sm:text-base font-semibold text-[#1f1f1f]">{shop.shop_name}</h2>
                        <p className="truncate text-xs text-[#8a8a8a] font-light">{shop.owner_username}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/shop/${shop.shop_uid}`}
                        className="rounded-xl border border-[#e6e2df] px-3 py-1.5 text-[11px] font-semibold text-[#666] hover:border-[#ba5b55] hover:text-[#ba5b55] transition-colors"
                      >
                        Visit shop
                      </Link>

                      <FollowShopButton
                        shopUid={shop.shop_uid}
                        initialIsFollowing={shop.is_following}
                        canFollow={Boolean(currentUid)}
                        className="px-3 py-1.5"
                      />
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {images.length > 0 ? (
                      images.map((image, index) => (
                        <div
                          key={`${shop.shop_uid}-${index}`}
                          className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#f3f3f3] border border-gray-100 cursor-pointer hover:opacity-95 transition-opacity"
                          onClick={() => setLightboxSrc(image)}
                        >
                          <Image src={image} alt={`${shop.shop_name} product`} fill className="object-cover" />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 rounded-xl border border-dashed border-[#e5e5e5] bg-[#fafafa] p-8 text-center text-xs text-[#9a9a9a] font-light">
                        No product images listed.
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[#8a8a8a] border-t border-gray-50 pt-3">
                    <span>{shop.shop_location}</span>
                    <span>{shop.followers_count} followers</span>
                  </div>

                  <p className="mt-2.5 line-clamp-2 text-xs text-[#8a8a8a] leading-relaxed font-light">{shop.shop_description}</p>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-[#e5e5e5] bg-[#fcfcfc] p-8 text-sm text-[#8a8a8a] lg:col-span-2 text-center py-16">
            No approved merchant shops associated with this university yet.
          </div>
        )}
      </section>

      {lightboxSrc && (
        <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} alt="Preview Media" />
      )}
    </div>
  );
}
