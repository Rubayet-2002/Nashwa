import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";
import { ensureShopFollowTable } from "@/app/(nashwa)/lib/ensureShopFollowTable";
import FollowShopButton from "@/app/(nashwa)/component/FollowShopButton";
import { Store, ArrowLeft } from "@mynaui/icons-react";
import { getUniversityLogo } from "../universityLogo";

export const dynamic = "force-dynamic";

type UniversityShopsPageProps = {
  params: Promise<{ university_uid: string }>;
};

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

type ImageRow = {
  shop_uid: string;
  image_url: string;
};

export default async function UniversityShopsPage({ params }: UniversityShopsPageProps) {
  const { university_uid } = await params;
  const { user } = await authMe();
  const currentUid = user?.uid ?? null;

  await ensureShopFollowTable();

  const uniRes = await pool.query(
    `SELECT university_uid, university_name
     FROM partner_university
     WHERE university_uid = $1
     LIMIT 1`,
    [university_uid],
  );

  if ((uniRes.rowCount ?? 0) === 0) {
    notFound();
  }

  const university = uniRes.rows[0] as { university_uid: string; university_name: string };

  let shops: ShopRow[] = [];
  const shopImages = new Map<string, string[]>();

  try {
    const shopRes = await pool.query(
      `SELECT s.shop_uid,
              s.owner_uid,
              s.shop_name,
              s.shop_location,
              s.shop_description,
              s.profile_photo_url,
              u.username AS owner_username,
              COALESCE(fc.followers_count, 0)::int AS followers_count,
              CASE WHEN $2::text IS NOT NULL AND sf.user_uid IS NOT NULL THEN TRUE ELSE FALSE END AS is_following
       FROM shop s
       JOIN users u ON u.uid = s.owner_uid
       JOIN shop_join_university sju ON sju.shop_uid = s.shop_uid
       LEFT JOIN shop_follow sf ON sf.shop_uid = s.shop_uid AND sf.user_uid = $2
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS followers_count
         FROM shop_follow fs
         WHERE fs.shop_uid = s.shop_uid
       ) fc ON true
       WHERE s.status = 'approved' AND sju.university_uid = $1
       ORDER BY s.created_at DESC`,
      [university_uid, currentUid],
    );

    shops = shopRes.rows;

    if (shops.length > 0) {
      const imageRes = await pool.query(
        `SELECT ranked.shop_uid, ranked.image_url
         FROM (
           SELECT p.shop_uid,
                  pi.image_url,
                  ROW_NUMBER() OVER (PARTITION BY p.shop_uid ORDER BY pi.position ASC, pi.id ASC) AS rn
           FROM product p
           JOIN product_image pi ON pi.product_uid = p.product_uid
           WHERE p.shop_uid = ANY($1::text[])
         ) ranked
         WHERE ranked.rn <= 4
         ORDER BY ranked.shop_uid, ranked.rn`,
        [shops.map((shop) => shop.shop_uid)],
      );

      for (const row of imageRes.rows as ImageRow[]) {
        const existing = shopImages.get(row.shop_uid) ?? [];
        existing.push(row.image_url);
        shopImages.set(row.shop_uid, existing);
      }
    }
  } catch (error) {
    console.error("Error loading university shops:", error);
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-[#f6f4f2] px-0 py-0 sm:px-0 lg:px-0">
      <div className="mx-auto flex min-h-full w-full max-w-none flex-col bg-white shadow-[0_10px_30px_rgba(120,150,146,0.08)] px-6 py-6 sm:px-8 lg:px-10">
        <header className="border-b border-[#f0f0f0] pb-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-[#ece7e5] bg-[#fafafa]">
                {getUniversityLogo(university.university_name) ? (
                  <Image
                    src={getUniversityLogo(university.university_name)!}
                    alt={university.university_name}
                    fill
                    className="object-contain p-1.5"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[#BA5B55]">
                    <Store size={18} />
                  </div>
                )}
              </div>

              <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#9aa6a3]">category</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#232323]">{university.university_name}</h1>
              <p className="mt-1 text-sm text-[#7b7b7b]">{shops.length} shops available</p>
              </div>
            </div>

            <Link href="/university" className="inline-flex items-center gap-2 text-xs font-medium text-[#ba5b55] hover:text-[#9c403a]">
              <ArrowLeft size={14} />
              Back to universities
            </Link>
          </div>
        </header>

        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {shops.length > 0 ? (
            shops.map((shop) => {
              const images = shopImages.get(shop.shop_uid) ?? [];
              const isOwnShop = Boolean(currentUid && currentUid === shop.owner_uid);

              return (
                <article key={shop.shop_uid} className="rounded-xl border border-[#ece7e5] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#eadfdb] bg-[#f5f1ee]">
                        {shop.profile_photo_url ? (
                          <Image src={shop.profile_photo_url} alt={shop.shop_name} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#BA5B55]">
                            <Store size={16} />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold text-[#1f1f1f]">{shop.shop_name}</h2>
                        <p className="truncate text-xs text-[#8a8a8a]">{shop.owner_username}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/shop/profile/${shop.shop_uid}`}
                        className="rounded border border-[#e6e2df] px-3 py-1.5 text-[11px] font-medium text-[#666] hover:border-[#ba5b55] hover:text-[#ba5b55]"
                      >
                        Visit shop
                      </Link>

                      {isOwnShop ? (
                        <span className="px-2 py-1 text-[11px] font-medium text-[#8a8a8a]">Your shop</span>
                      ) : (
                        <FollowShopButton
                          shopUid={shop.shop_uid}
                          initialIsFollowing={shop.is_following}
                          canFollow={Boolean(currentUid)}
                          className="px-3 py-1.5"
                        />
                      )}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {images.length > 0 ? (
                      images.map((image, index) => (
                        <div key={`${shop.shop_uid}-${index}`} className="relative aspect-[4/3] overflow-hidden rounded-md bg-[#f3f3f3]">
                          <Image src={image} alt={`${shop.shop_name} product`} fill className="object-cover" />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 rounded-md border border-dashed border-[#e5e5e5] bg-[#fafafa] p-6 text-center text-xs text-[#9a9a9a]">
                        No product images yet.
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#8a8a8a]">
                    <span>{shop.shop_location}</span>
                    <span>{shop.followers_count} followers</span>
                  </div>

                  <p className="mt-2 line-clamp-2 text-xs text-[#8a8a8a]">{shop.shop_description}</p>
                </article>
              );
            })
          ) : (
            <div className="rounded-xl border border-dashed border-[#e5e5e5] bg-[#fcfcfc] p-8 text-sm text-[#8a8a8a] lg:col-span-2">
              No approved shops in this university yet.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}