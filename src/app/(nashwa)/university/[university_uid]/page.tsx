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

  let products: any[] = [];
  let userFollowedShops: string[] = [];
  let userSavedProducts: string[] = [];
  let userReactedProducts: string[] = [];

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

    const productsRes = await pool.query(
      `SELECT p.product_uid, p.title, p.description, p.price, p.original_price,
              p.discount_percent, p.currency, p.category, p.product_type,
              p.inside_delivery_charge, p.outside_delivery_charge, p.free_on_campus_delivery,
              p.sold_count, p.like_count, p.avg_rating, p.variants, p.created_at,
              (SELECT pi.image_url FROM product_image pi WHERE pi.product_uid = p.product_uid ORDER BY pi.position ASC, pi.id ASC LIMIT 1) AS image_url,
              COALESCE((SELECT json_agg(pi.image_url ORDER BY pi.position ASC, pi.id ASC) FROM product_image pi WHERE pi.product_uid = p.product_uid), '[]') AS image_urls,
              (SELECT COUNT(*)::int FROM product_comment pc WHERE pc.product_uid = p.product_uid) AS comment_count,
              s.shop_uid, s.shop_name, s.shop_location, s.profile_photo_url AS shop_profile_photo_url,
              s.owner_uid AS shop_owner_uid,
              s.avg_rating AS shop_avg_rating, s.is_blocked AS shop_blocked,
              pu.university_name AS shop_university_name,
              ep.status AS event_status
       FROM product p
       JOIN shop s ON s.shop_uid = p.shop_uid
       JOIN shop_join_university sju ON sju.shop_uid = s.shop_uid AND sju.status = 'approved'
       LEFT JOIN partner_university pu ON pu.university_uid = sju.university_uid
       LEFT JOIN event_product ep ON ep.product_uid = p.product_uid AND ep.status = 'approved'
       WHERE s.status = 'approved' AND s.is_blocked = FALSE
         AND p.status = 'active'
         AND sju.university_uid = $1
       ORDER BY p.created_at DESC`,
      [university_uid]
    );

    products = productsRes.rows;

    if (currentUid) {
      const [followRes, saveRes, reactRes] = await Promise.all([
        pool.query(`SELECT shop_uid FROM shop_follow WHERE user_uid = $1`, [currentUid]),
        pool.query(`SELECT product_uid FROM product_save WHERE user_uid = $1`, [currentUid]),
        pool.query(`SELECT product_uid FROM product_reaction WHERE user_uid = $1`, [currentUid]),
      ]);
      userFollowedShops = followRes.rows.map((r: any) => r.shop_uid);
      userSavedProducts = saveRes.rows.map((r: any) => r.product_uid);
      userReactedProducts = reactRes.rows.map((r: any) => r.product_uid);
    }
  } catch (error) {
    console.error("Error loading university shops and products:", error);
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <UniversityShopsClient
        university={university}
        shops={shops}
        shopImages={shopImagesObj}
        currentUid={currentUid}
        initialProducts={products}
        initialFollowedShops={userFollowedShops}
        initialSavedProducts={userSavedProducts}
        initialReactedProducts={userReactedProducts}
      />
    </div>
  );
}
