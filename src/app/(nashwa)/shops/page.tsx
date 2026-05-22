import Image from "next/image";
import Link from "next/link";
import pool from "@/database/pool";
import { Search, Store, Pin, ShoppingBag } from "@mynaui/icons-react";
import { profileData } from "../profile/lib/ProfileData";
import { authMe } from "@/app/(authentication)/lib/authMe";
import { ensureShopFollowTable } from "../lib/ensureShopFollowTable";
import FollowShopButton from "../component/FollowShopButton";

export const dynamic = "force-dynamic";

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
  owner_username: string;
  product_count: number;
  followers_count: number;
  is_following: boolean;
  is_own_shop: boolean;
};

type ShopsPageProps = {
  searchParams: Promise<{ q?: string }>;
};

function formatCompactCount(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  }

  return `${value}`;
}

function buildFollowers(shop: ShopRow) {
  return formatCompactCount(shop.followers_count);
}

function matchesQuery(shop: ShopRow, query: string) {
  if (!query) {
    return true;
  }

  const normalizedQuery = query.toLowerCase();
  return [
    shop.shop_name,
    shop.shop_location,
    shop.shop_description,
    shop.university_name,
    shop.owner_username,
  ]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(normalizedQuery));
}

function ShopCard({
  shop,
  canFollow,
}: {
  shop: ShopRow;
  canFollow: boolean;
}) {
  const followers = buildFollowers(shop);
  const imageSource = shop.profile_photo_url || shop.cover_photo_url;

  return (
    <div className="flex items-start gap-4 rounded-xl border border-[#ece7e5] px-3 py-3 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-sm">
      <Link href={`/shop/profile/${shop.shop_uid}`} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#eadfdb] bg-[#f5f1ee] shadow-sm">
        {imageSource ? (
          <Image src={imageSource} alt={shop.shop_name} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#BA5B55]">
            <Store size={22} />
          </div>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/shop/profile/${shop.shop_uid}`} className="block truncate text-sm font-semibold text-[#1a1a1a] transition-colors hover:text-[#BA5B55]">
              {shop.shop_name}
            </Link>
            <p className="mt-0.5 truncate text-[11px] text-[#7f7f7f]">{shop.owner_username}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link href={`/shop/profile/${shop.shop_uid}`} className="text-[11px] font-medium text-[#ba5b55] hover:text-[#9c403a]">
              Visit shop
            </Link>
            {shop.is_own_shop ? (
              <span className="px-2.5 py-1 text-[11px] font-medium text-[#8a8a8a]">Your shop</span>
            ) : (
              <FollowShopButton
                shopUid={shop.shop_uid}
                initialIsFollowing={shop.is_following}
                canFollow={canFollow}
                className="px-2.5 py-1"
              />
            )}
          </div>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#8a8a8a]">
          {shop.university_name && <span>{shop.university_name}</span>}
          <span className="inline-flex items-center gap-1">
            <Pin size={12} className="text-[#BA5B55]" />
            {shop.shop_location}
          </span>
        </div>

        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#8b8b8b]">
          {shop.shop_description}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-[#8b8b8b]">
          <span>{followers} Followers</span>
          <span>{shop.product_count} Products</span>
        </div>
      </div>
    </div>
  );
}

export default async function ShopsPage({ searchParams }: ShopsPageProps) {
  const profile = await profileData();
  const { user } = await authMe();
  const { q = "" } = await searchParams;

  let shops: ShopRow[] = [];

  try {
    const currentUid = user?.uid ?? null;
    await ensureShopFollowTable();

    const shopRes = await pool.query(
      `SELECT s.shop_uid,
              s.owner_uid,
              s.shop_name,
              s.shop_location,
              s.shop_description,
              s.cover_photo_url,
              s.profile_photo_url,
              sju.university_uid,
              pu.university_name,
              u.username AS owner_username,
              COALESCE(pc.product_count, 0)::int AS product_count,
              COALESCE(fc.followers_count, 0)::int AS followers_count,
              CASE WHEN $1::text IS NOT NULL AND sf.user_uid IS NOT NULL THEN TRUE ELSE FALSE END AS is_following
       FROM shop s
       JOIN users u ON u.uid = s.owner_uid
       LEFT JOIN shop_join_university sju ON sju.shop_uid = s.shop_uid
       LEFT JOIN partner_university pu ON pu.university_uid = sju.university_uid
       LEFT JOIN shop_follow sf ON sf.shop_uid = s.shop_uid AND sf.user_uid = $1
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS product_count
         FROM product p
         WHERE p.shop_uid = s.shop_uid
       ) pc ON true
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS followers_count
         FROM shop_follow fs
         WHERE fs.shop_uid = s.shop_uid
       ) fc ON true
       WHERE s.status = 'approved'
       ORDER BY s.created_at DESC
       LIMIT 50`,
      [currentUid]
    );

    shops = shopRes.rows
      .map((shop) => ({ ...shop, is_own_shop: currentUid ? shop.owner_uid === currentUid : false }))
      .filter((shop) => matchesQuery(shop, q));
  } catch (error) {
    console.error("Error fetching shops page data:", error);
  }

  const allShops = shops.slice(0, 24);
  const myUniversityShops = profile?.university_uid
    ? shops.filter((shop) => shop.university_uid === profile.university_uid).slice(0, 24)
    : [];
  const hasUniversityScope = Boolean(profile?.university_uid && profile?.university_name);
  const canFollow = Boolean(user?.uid);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-[#d9eeec] px-0 py-0 sm:px-0 lg:px-0">
      <div className="mx-auto flex min-h-full w-full max-w-none flex-col bg-white shadow-[0_10px_30px_rgba(120,150,146,0.08)]">
        <div className="border-b border-[#f0f0f0] px-6 py-5 sm:px-8 lg:px-10">
          <p className="text-sm uppercase tracking-[0.25em] text-[#9aa6a3]">shops</p>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-semibold tracking-tight text-[#232323] sm:text-4xl">Discover shops from your university</h1>
              <p className="mt-2 text-sm leading-relaxed text-[#7b7b7b]">
                {hasUniversityScope
                  ? `You are browsing ${profile?.university_name}.`
                  : "Browse approved shops. Add your university on profile to see campus-only section."}
              </p>
            </div>

            <form className="w-full max-w-xl" action="/shops" method="get">
              <label className="flex items-center gap-3 rounded-full border border-[#eadfdb] bg-[#fffaf8] px-4 py-3 text-sm text-[#8e5a52] shadow-sm focus-within:border-[#ba5b55]">
                <Search size={16} />
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Search shops, locations, or owners"
                  className="w-full bg-transparent outline-none placeholder:text-[#b79690]"
                />
              </label>
            </form>
          </div>
        </div>

        <div className="flex-1 space-y-10 px-6 py-6 sm:px-8 lg:px-10 lg:py-8">
          <section className="space-y-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#9a9a9a]">All shops</p>
                <h2 className="mt-1 text-lg font-semibold text-[#222222]">All approved shops</h2>
              </div>
              <span className="hidden text-xs text-[#ba5b55] sm:inline-flex">{allShops.length} results</span>
            </div>

            {allShops.length > 0 ? (
              <div className="grid gap-6 xl:grid-cols-2">
                {allShops.map((shop, index) => (
                  <ShopCard
                    key={shop.shop_uid}
                    shop={shop}
                    canFollow={canFollow}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#e5e5e5] bg-[#fcfcfc] p-8 text-sm text-[#8a8a8a]">
                No shops matched your search.
              </div>
            )}
          </section>

          <section className="space-y-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#9a9a9a]">My university shops</p>
                <h2 className="mt-1 text-lg font-semibold text-[#222222]">Shops from your university</h2>
              </div>
              <span className="hidden text-xs text-[#ba5b55] sm:inline-flex">{hasUniversityScope ? profile?.university_name : "Set university"}</span>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              {myUniversityShops.length > 0 ? (
                myUniversityShops.map((shop, index) => (
                  <ShopCard
                    key={shop.shop_uid}
                    shop={shop}
                    canFollow={canFollow}
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[#e5e5e5] bg-[#fcfcfc] p-8 text-sm text-[#8a8a8a]">
                  {hasUniversityScope
                    ? "No university shops matched your search yet."
                    : "Set your university in profile to show this section."}
                </div>
              )}
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f2f2f2] pt-5 text-xs text-[#8a8a8a]">
            <span className="inline-flex items-center gap-2">
              <ShoppingBag size={14} className="text-[#ba5b55]" />
              Follow any shop from this list or from the shop profile page.
            </span>
            <span>{shops.length} shops loaded</span>
          </div>
        </div>
      </div>
    </div>
  );
}