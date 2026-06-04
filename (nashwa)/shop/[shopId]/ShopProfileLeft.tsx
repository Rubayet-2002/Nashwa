"use client";

import Image from "next/image";
import { Mail, Pin, Building, Star, Cog } from "@mynaui/icons-react";
import ContactSellerWidget from "@/components/ContactSellerWidget";
import FollowShopButton from "@/components/FollowShopButton";

interface ShopProfileLeftProps {
  shop: {
    shop_uid: string;
    owner_uid: string;
    shop_name: string;
    shop_email: string;
    shop_phone: string;
    shop_location: string;
    shop_description: string;
    shop_bio: string | null;
    cover_photo_url: string | null;
    profile_photo_url: string | null;
    instagram_url: string | null;
    facebook_url: string | null;
    avg_rating: string | number | null;
    university_name: string | null;
    owner_username: string;
    followers_count: number;
    rating_count: number;
    posts_count: number;
    items_sold_count: number;
    is_following: boolean;
  };
  currentUser: { uid: string; username: string } | null;
  canFollow: boolean;
}

export default function ShopProfileLeft({
  shop,
  currentUser,
  canFollow,
}: ShopProfileLeftProps) {
  return (
    <div className="flex flex-col border border-[#e2e2e2] bg-white rounded-none overflow-hidden font-sans">
      {/* Cover Photo Container */}
      <div className="relative h-40 w-full bg-gray-100">
        {shop.cover_photo_url ? (
          <Image
            src={shop.cover_photo_url}
            alt="Cover"
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#fcf7f6] to-[#f4ece9]" />
        )}

        {/* Profile Photo Overlapping bottom-left */}
        <div className="absolute -bottom-8 left-4 h-20 w-20 rounded-full border-4 border-white bg-white overflow-hidden shrink-0 z-10 shadow-xs">
          {shop.profile_photo_url ? (
            <Image
              src={shop.profile_photo_url}
              alt={shop.shop_name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#fdf0ef] flex items-center justify-center text-2xl font-bold text-[#ba5b55]">
              {shop.shop_name[0]?.toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Row Beside Profile Photo */}
      <div className="pl-28 pr-4 pt-3 pb-4 flex justify-between items-start gap-4">
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-[#1a1a1a] truncate leading-tight">
            {shop.shop_name}
          </h1>
          <p className="text-[11px] text-[#787878] truncate leading-normal mt-0.5">
            @{shop.owner_username}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <ContactSellerWidget
            shopUid={shop.shop_uid}
            shopName={shop.shop_name}
            shopOwnerUid={shop.owner_uid}
            shopAvatar={shop.profile_photo_url}
            currentUser={currentUser}
            iconOnly={true}
          />
          <FollowShopButton
            shopUid={shop.shop_uid}
            initialIsFollowing={shop.is_following}
            canFollow={canFollow}
            variant="solid"
            className="h-9 rounded-none shadow-sm"
          />
        </div>
      </div>

      {/* Bio Section (skip if empty) */}
      {shop.shop_bio && shop.shop_bio.trim() !== "" && (
        <div className="px-5 py-4 border-t border-[#f0f0f0] flex flex-col gap-1.5">
          <h3 className="text-xs font-bold text-[#BA5B55] uppercase tracking-wider">Bio</h3>
          <p className="text-xs text-[#4f4f4f] leading-relaxed font-light whitespace-pre-wrap font-sans">
            {shop.shop_bio}
          </p>
        </div>
      )}

      {/* About Section */}
      <div className="px-5 py-4 border-t border-[#f0f0f0] flex flex-col gap-3.5">
        <h3 className="text-xs font-bold text-[#BA5B55] uppercase tracking-wider">About Info</h3>
        <div className="flex flex-col gap-3 text-xs text-[#4f4f4f]">
          <div className="flex items-center gap-3">
            <Mail size={15} className="text-[#BA5B55] shrink-0" />
            <span className="truncate leading-tight select-all">{shop.shop_email}</span>
          </div>
          <div className="flex items-center gap-3">
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              stroke="#BA5B55"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span className="leading-tight">{shop.shop_phone}</span>
          </div>
          {shop.university_name && (
            <div className="flex items-center gap-3">
              <Building size={15} className="text-[#BA5B55] shrink-0" />
              <span className="leading-tight">{shop.university_name}</span>
            </div>
          )}
          {shop.instagram_url && (
            <div className="flex items-center gap-3">
              <svg
                viewBox="0 0 24 24"
                width="15"
                height="15"
                stroke="#BA5B55"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
              <a
                href={shop.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline truncate text-gray-600 font-medium"
              >
                {shop.instagram_url}
              </a>
            </div>
          )}
          {shop.facebook_url && (
            <div className="flex items-center gap-3">
              <svg
                viewBox="0 0 24 24"
                width="15"
                height="15"
                stroke="#BA5B55"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
              <a
                href={shop.facebook_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline truncate text-gray-600 font-medium"
              >
                {shop.facebook_url}
              </a>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Pin size={15} className="text-[#BA5B55] shrink-0" />
            <span className="leading-tight">{shop.shop_location}</span>
          </div>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="px-5 py-4 border-t border-[#f0f0f0] bg-[#fafafa] flex justify-between items-center text-center">
        <div className="flex flex-col items-center flex-1 border-r border-gray-150">
          <span className="text-xs font-bold text-[#BA5B55]">{shop.followers_count}</span>
          <span className="text-[9px] text-[#787878] font-bold uppercase tracking-wider mt-0.5">
            Followers
          </span>
        </div>
        <div className="flex flex-col items-center flex-1 border-r border-gray-150">
          <span className="text-xs font-bold text-[#BA5B55] flex items-center justify-center gap-0.5">
            {shop.avg_rating ? Number(shop.avg_rating).toFixed(1) : "—"}
            <Star
              size={11}
              fill={shop.avg_rating ? "#BA5B55" : "none"}
              className="text-[#BA5B55] shrink-0"
            />
          </span>
          <span className="text-[9px] text-[#787878] font-bold uppercase tracking-wider mt-0.5">
            Rating ({shop.rating_count})
          </span>
        </div>
        <div className="flex flex-col items-center flex-1 border-r border-gray-150">
          <span className="text-xs font-bold text-[#BA5B55]">{shop.posts_count}</span>
          <span className="text-[9px] text-[#787878] font-bold uppercase tracking-wider mt-0.5">
            Posts
          </span>
        </div>
        <div className="flex flex-col items-center flex-1">
          <span className="text-xs font-bold text-[#BA5B55]">{shop.items_sold_count}</span>
          <span className="text-[9px] text-[#787878] font-bold uppercase tracking-wider mt-0.5">
            Sold
          </span>
        </div>
      </div>
    </div>
  );
}
