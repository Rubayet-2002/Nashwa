"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Users } from "@mynaui/icons-react";

interface Shop {
  shop_uid: string;
  shop_name: string;
  shop_location: string;
  profile_photo_url: string | null;
  avg_rating: string | null;
  follower_count: number;
  university_name: string | null;
  owner_name: string;
}

export default function TopShopsPanel({
  shops,
  userId,
  followedShops,
}: {
  shops: Shop[];
  userId: string | null;
  followedShops: string[];
}) {
  const [activeTab, setActiveTab] = useState<"top" | "following">("top");

  const displayedShops =
    activeTab === "top"
      ? shops
      : shops.filter((shop) => followedShops.includes(shop.shop_uid));

  return (
    <div className="flex flex-col gap-4 min-h-0 flex-1 overflow-hidden">
      <div className="p-4 bg-white flex justify-start items-center gap-6 text-xs leading-none">
        <button
          onClick={() => setActiveTab("top")}
          className={`cursor-pointer transition-colors duration-300 font-semibold ${
            activeTab === "top" ? "text-[#ba5b55]" : "text-[#787878] hover:text-[#ba5b55]"
          }`}
        >
          Top shops
        </button>
        <button
          onClick={() => setActiveTab("following")}
          className={`cursor-pointer transition-colors duration-300 font-semibold ${
            activeTab === "following" ? "text-[#ba5b55]" : "text-[#787878] hover:text-[#ba5b55]"
          }`}
        >
          My followings <span className="text-[10px]">({followedShops.length})</span>
        </button>
      </div>

      {/* Shops List */}
      <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar gap-4">
        {displayedShops.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <p className="text-xs text-[#787878]">
              {activeTab === "following"
                ? "You aren't following any shops yet."
                : "No shops available."}
            </p>
            {activeTab === "following" && (
              <button
                onClick={() => setActiveTab("top")}
                className="text-xs text-[#ba5b55] hover:underline font-bold mt-2 cursor-pointer"
              >
                Explore Top Shops
              </button>
            )}
          </div>
        ) : (
          displayedShops.map((shop) => (
            <Link
              key={shop.shop_uid}
              href={`/shop/${shop.shop_uid}`}
className="bg-white p-2 hover:bg-[#eef7fd]">

          <div className="flex justify-start items-start gap-2">
              
                  {shop.profile_photo_url ? (
                    <Image
                      src={shop.profile_photo_url}
                      alt={shop.shop_name}
                      width={80}
                      height={80}
                      loading="eager"
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-xl bg-white w-20 h-20 flex justify-center items-center border font-bold text-[#ba5b55]">
                      {shop.shop_name[0]?.toUpperCase()}
                    </span>
                  )}
             
            <div className="flex flex-col justify-start w-full h-20 gap-1.5 text-xs text-[#787878] leading-none">
                  <p className="text-sm text-[#1a1a1a] truncate">{shop.shop_name}</p>
                  <p className="truncate">{shop.owner_name}</p>
                  <p className="truncate">{shop.university_name || shop.shop_location}</p>

              <div className="flex justify-start items-center gap-2 leading-none text-xs">
                <div className="flex gap-1 justify-start items-center">
                  <Star
                    size={12}
                    className="mb-px text-[#ba5b55]"
                    fill="#ba5b55"
                  />
                      <span>{shop.avg_rating ? Number(shop.avg_rating).toFixed(1) : "New"}</span>
                    </div>

                <div className="flex gap-1 justify-start items-center">
                  <Users size={14} />
                      <span>{shop.follower_count} followers</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
