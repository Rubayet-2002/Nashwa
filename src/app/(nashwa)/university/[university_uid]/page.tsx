import { notFound } from "next/navigation";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";
import UniversityShopsClient from "./UniversityShopsClient";

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

  // Fetch university info including description and logo
  const uniRes = await pool.query(
    `SELECT university_uid, university_name, description, logo_url
     FROM partner_university
     WHERE university_uid = $1
     LIMIT 1`,
    [university_uid]
  );

  if ((uniRes.rowCount ?? 0) === 0) {
    notFound();
  }

  const university = uniRes.rows[0] as {
    university_uid: string;
    university_name: string;
    description: string | null;
    logo_url: string | null;
  };

  let shops: ShopRow[] = [];
  const shopImagesObj: Record<string, string[]> = {};

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
       JOIN shop_join_university sju ON sju.shop_uid = s.shop_uid AND sju.status = 'approved'
       LEFT JOIN shop_follow sf ON sf.shop_uid = s.shop_uid AND sf.user_uid = $2
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS followers_count
         FROM shop_follow fs
         WHERE fs.shop_uid = s.shop_uid
       ) fc ON true
       WHERE s.status = 'approved' AND sju.university_uid = $1
       ORDER BY s.created_at DESC`,
      [university_uid, currentUid]
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
           WHERE p.shop_uid = ANY($1::text[]) AND p.status = 'active'
         ) ranked
         WHERE ranked.rn <= 4
         ORDER BY ranked.shop_uid, ranked.rn`,
        [shops.map((shop) => shop.shop_uid)]
      );

      for (const row of imageRes.rows as ImageRow[]) {
        if (!shopImagesObj[row.shop_uid]) {
          shopImagesObj[row.shop_uid] = [];
        }
        shopImagesObj[row.shop_uid].push(row.image_url);
      }
    }
  } catch (error) {
    console.error("Error loading university shops:", error);
  }

  // Remove custom label prefix
  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[#f2f4f7] py-6 px-4">
      <UniversityShopsClient
        university={university}
        shops={shops}
        shopImages={shopImagesObj}
        currentUid={currentUid}
      />
    </div>
  );
}
