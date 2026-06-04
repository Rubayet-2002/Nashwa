import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";
import FollowShopButton from "@/components/FollowShopButton";
import { Search, Users, Pin } from "@mynaui/icons-react";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shops - Nashwa",
  description: "Browse student entrepreneur shops on Nashwa.",
};

type ShopRow = {
  shop_uid: string;
  owner_uid: string;
  shop_name: string;
  shop_location: string;
  shop_description: string;
  cover_photo_url: string | null;
  profile_photo_url: string | null;
  university_uid: string | null;
  university_name: string | null;
  owner_name: string;
  product_count: number;
  follower_count: number;
  is_following: boolean;
};

export default async function ShopsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { user } = await authMe();
  const { q = "" } = await searchParams;

  let shops: ShopRow[] = [];

  try {
    const currentUid = user?.uid ?? null;

    let queryText = `
      SELECT s.shop_uid,
             s.owner_uid,
             s.shop_name,
             s.shop_location,
             s.shop_description,
             s.cover_photo_url,
             s.profile_photo_url,
             s.avg_rating,
             s.follower_count,
             sju.university_uid,
             pu.university_name,
             u.username AS owner_name,
             COALESCE(pc.product_count, 0)::int AS product_count,
             CASE WHEN $1::text IS NOT NULL AND sf.user_uid IS NOT NULL THEN TRUE ELSE FALSE END AS is_following
      FROM shop s
      JOIN users u ON u.uid = s.owner_uid
      LEFT JOIN shop_join_university sju ON sju.shop_uid = s.shop_uid AND sju.status = 'approved'
      LEFT JOIN partner_university pu ON pu.university_uid = sju.university_uid
      LEFT JOIN shop_follow sf ON sf.shop_uid = s.shop_uid AND sf.user_uid = $1
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS product_count
        FROM product p
        WHERE p.shop_uid = s.shop_uid AND p.status = 'active'
      ) pc ON true
      WHERE s.status = 'approved' AND s.is_blocked = FALSE
    `;

    const params: any[] = [currentUid];

    if (q.trim()) {
      queryText += ` AND (s.shop_name ILIKE $2 OR s.shop_description ILIKE $2 OR pu.university_name ILIKE $2 OR u.username ILIKE $2)`;
      params.push(`%${q}%`);
    }

    const shopRes = await pool.query(queryText, params);
    shops = shopRes.rows;

    // Sort: Followed shops first, then suggested (unfollowed) shops
    shops.sort((a, b) => {
      if (a.is_following && !b.is_following) return -1;
      if (!a.is_following && b.is_following) return 1;
      return b.follower_count - a.follower_count;
    });

  } catch (error) {
    console.error("Error fetching shops page data:", error);
  }

  const followedShops = shops.filter((s) => s.is_following);
  const suggestedShops = shops.filter((s) => !s.is_following);
  const canFollow = !!user;

  return (
    <div className="flex-1 overflow-y-auto bg-[#f2f4f7] px-4 py-6 custom-scrollbar min-h-full">
      <div className="max-w-4xl mx-auto bg-white border border-[#e2e2e2] rounded-xl shadow-xs overflow-hidden">
        {/* Header section */}
        <div className="border-b border-[#f0f0f0] px-6 py-6 sm:px-8">
          <p className="text-[10px] uppercase font-bold tracking-widest text-[#BA5B55]">Shops Directory</p>
          <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <h1 className="text-2xl font-bold tracking-tight text-[#1a1a1a]">Discover Campus Shops</h1>
              <p className="mt-1 text-xs text-gray-500">
                Explore student-led initiatives, handcrafted creations, and campus-only services.
              </p>
            </div>

            <form className="w-full max-w-xs" action="/shops" method="get">
              <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-[#f4f4f4] px-3.5 py-1.5 focus-within:border-[#ba5b55] focus-within:bg-white transition-all duration-200">
                <Search size={14} className="text-gray-400 shrink-0" />
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Search shops, owners..."
                  className="w-full bg-transparent outline-none text-xs text-[#1a1a1a] placeholder:text-gray-400"
                />
              </div>
            </form>
          </div>
        </div>

        <div className="p-6 sm:p-8 flex flex-col gap-8">
          {/* Followed shops */}
          {followedShops.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-sm font-bold text-[#1a1a1a] flex items-center gap-1.5">
                <span>❤️</span> Followed Shops
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {followedShops.map((shop) => (
                  <ShopCard key={shop.shop_uid} shop={shop} canFollow={canFollow} currentUid={user?.uid} />
                ))}
              </div>
            </section>
          )}

          {/* Suggested shops */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-[#1a1a1a] flex items-center gap-1.5">
              <span>💡</span> Suggested Shops
            </h2>
            {suggestedShops.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {suggestedShops.map((shop) => (
                  <ShopCard key={shop.shop_uid} shop={shop} canFollow={canFollow} currentUid={user?.uid} />
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center text-xs text-gray-500 bg-gray-50/50">
                No suggested shops found.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function ShopCard({
  shop,
  canFollow,
  currentUid,
}: {
  shop: ShopRow;
  canFollow: boolean;
  currentUid?: string;
}) {
  const isOwnShop = currentUid ? shop.owner_uid === currentUid : false;
  return (
    <div className="flex items-start gap-3.5 rounded-xl border border-gray-200 px-4 py-4 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xs hover:border-[#BA5B55]/20">
      <Link href={`/shop/${shop.shop_uid}`} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center">
        {shop.profile_photo_url ? (
          <Image src={shop.profile_photo_url} alt={shop.shop_name} fill className="object-cover animate-fade-in" />
        ) : (
          <div className="text-[#BA5B55] flex items-center justify-center font-bold text-2xl">
            {shop.shop_name[0]?.toUpperCase()}
          </div>
        )}
      </Link>

      <div className="min-w-0 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href={`/shop/${shop.shop_uid}`} className="block truncate text-xs font-bold text-[#1a1a1a] hover:text-[#BA5B55] transition-colors leading-normal">
              {shop.shop_name}
            </Link>
            <p className="text-[10px] text-gray-400 mt-0.5 font-medium truncate">By {shop.owner_name}</p>
          </div>

          <div className="shrink-0 flex items-center gap-1.5 mt-0.5">
              <FollowShopButton
                shopUid={shop.shop_uid}
                initialIsFollowing={shop.is_following}
                canFollow={canFollow}
                className="px-2 py-1 rounded"
              />
          </div>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-gray-400 font-semibold">
          {shop.university_name && <span className="text-[#BA5B55]">{shop.university_name}</span>}
          {shop.university_name && <span>•</span>}
          <span className="inline-flex items-center gap-0.5">
            <Pin size={11} className="text-gray-400" />
            {shop.shop_location}
          </span>
        </div>

        <p className="mt-1.5 line-clamp-2 text-[10px] leading-relaxed text-gray-500 font-medium">
          {shop.shop_description}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-gray-400 font-bold">
          <span className="flex items-center gap-1"><Users size={12} /> {shop.follower_count} Followers</span>
          <span>•</span>
          <span>{shop.product_count} Products</span>
        </div>
      </div>
    </div>
  );
}
