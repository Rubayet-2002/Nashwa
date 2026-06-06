"use client";

import { useState } from "react";
import Image from "next/image";
import { User, Eye, X } from "@mynaui/icons-react";
import FollowShopButton from "@/components/FollowShopButton";
import ContactSellerWidget from "@/components/ContactSellerWidget";

interface ShopProfileHeaderProps {
  shop: {
    shop_uid: string;
    shop_name: string;
    owner_uid: string;
    owner_username: string;
    cover_photo_url: string | null;
    profile_photo_url: string | null;
    followers_count: number;
    is_following: boolean;
    university_name?: string | null;
    shop_location: string;
  };
  currentUser: {
    uid: string;
    username: string;
  } | null;
  canFollow: boolean;
}

export default function ShopProfileHeader({
  shop,
  currentUser,
  canFollow,
}: ShopProfileHeaderProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  return (
    <div className="bg-white border border-[#eaeaea] shadow-sm relative rounded-3xl overflow-hidden">
      
      {/* Cover Photo */}
      <div className="h-48 md:h-64 relative bg-[#f3f4f6] group">
        {shop.cover_photo_url ? (
          <>
            <Image
              src={shop.cover_photo_url}
              alt={`${shop.shop_name} Cover`}
              fill
              className="object-cover group-hover:opacity-95 transition-opacity"
            />
            <div
              onClick={() => {
                setLightboxSrc(shop.cover_photo_url);
              }}
              className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer text-xs font-semibold"
            >
              <Eye size={22} className="mb-1" />
              View Cover
            </div>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#fdfaf9] to-[#eceff3] text-[#BA5B55] text-xs font-semibold uppercase tracking-[0.2em]">
            Shop Cover
          </div>
        )}
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />
      </div>

      {/* Profile Bar */}
      <div className="px-6 pb-6 pt-0 flex flex-col sm:flex-row sm:items-end sm:gap-6 relative">
        {/* Avatar */}
        <div className="relative -mt-16 sm:-mt-20 w-32 h-32 rounded-full border-4 border-white bg-white shadow-md overflow-hidden flex justify-center items-center shrink-0 group">
          {shop.profile_photo_url ? (
            <>
              <Image
                src={shop.profile_photo_url}
                alt={`${shop.shop_name} Profile`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div
                onClick={() => {
                  setLightboxSrc(shop.profile_photo_url);
                }}
                className="absolute inset-0 bg-black/45 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer text-xs font-semibold"
              >
                <Eye size={18} className="mb-0.5" />
                View
              </div>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#f5f5f5] text-[#BA5B55] text-xs font-semibold uppercase tracking-[0.2em]">
              Shop
            </div>
          )}
        </div>

        {/* Shop Info & Action buttons */}
        <div className="mt-4 sm:mt-0 flex-1 flex flex-col gap-1">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1a1a1a]">{shop.shop_name}</h1>
              <p className="text-xs text-[#787878] font-light flex items-center gap-1.5 mt-0.5">
                <User size={14} className="text-[#BA5B55]" />
                Owned by <span className="font-medium text-[#1a1a1a]">{shop.owner_username}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <FollowShopButton
                shopUid={shop.shop_uid}
                initialIsFollowing={Boolean(shop.is_following)}
                canFollow={canFollow}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl"
              />
              <ContactSellerWidget
                shopUid={shop.shop_uid}
                shopName={shop.shop_name}
                shopOwnerUid={shop.owner_uid}
                shopAvatar={shop.profile_photo_url}
                currentUser={currentUser}
              />
            </div>
          </div>

          <div className="mt-1 text-xs text-[#8a8a8a] font-semibold">
            {shop.followers_count} Followers
          </div>
        </div>
      </div>

      {/* Large View Photo Modal */}
      {lightboxSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setLightboxSrc(null)} />
          <div className="relative z-10 bg-white border border-[#e2e2e2] shadow-2xl rounded-3xl max-w-lg w-full overflow-hidden flex flex-col items-center">
            
            <div className="w-full px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <span className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">
                Full Image View
              </span>
              <button
                onClick={() => setLightboxSrc(null)}
                className="text-gray-400 hover:text-[#BA5B55] outline-none"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 w-full flex justify-center items-center bg-[#fafafa]">
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-gray-150 shadow-sm bg-white">
                <Image src={lightboxSrc} alt="Shop view" fill className="object-contain" />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
