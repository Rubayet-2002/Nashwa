import Link from "next/link";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";
import ShopProfileLeft from "./ShopProfileLeft";
import ShopProductsClient from "./ShopProductsClient";

export const dynamic = "force-dynamic";

interface ShopProfileProps {
  params: Promise<{ shopId: string }>;
}

export default async function ShopProfilePage({ params }: ShopProfileProps) {
  const { shopId } = await params;
  const { user } = await authMe();

  let shop: any = null;
  let products: any[] = [];
  let userFollowedShops: string[] = [];
  let userSavedProducts: string[] = [];
  let userReactedProducts: string[] = [];

  try {
    // Query shop details, including new social media links and rating/posts counts
    const shopRes = await pool.query(
      `SELECT s.shop_uid, s.owner_uid, s.shop_name, s.shop_email, s.shop_phone, s.shop_location, s.shop_description, s.shop_bio, s.created_at,
              s.cover_photo_url, s.profile_photo_url, s.instagram_url, s.facebook_url, s.avg_rating,
              pu.university_name,
              u.username as owner_username, u.email as owner_email,
              COALESCE(fc.followers_count, 0)::int AS followers_count,
              CASE WHEN $2::text IS NOT NULL AND sf.user_uid IS NOT NULL THEN TRUE ELSE FALSE END AS is_following,
              (SELECT COUNT(*)::int FROM product_review pr JOIN product p ON pr.product_uid = p.product_uid WHERE p.shop_uid = s.shop_uid) AS rating_count,
              (SELECT COUNT(*)::int FROM product WHERE shop_uid = s.shop_uid AND status = 'active') AS posts_count,
              COALESCE((SELECT SUM(sold_count)::int FROM product WHERE shop_uid = s.shop_uid), 0) AS items_sold_count
       FROM shop s
       JOIN users u ON s.owner_uid = u.uid
       LEFT JOIN shop_join_university sju ON sju.shop_uid = s.shop_uid AND sju.status = 'approved'
       LEFT JOIN partner_university pu ON pu.university_uid = sju.university_uid
       LEFT JOIN shop_follow sf ON sf.shop_uid = s.shop_uid AND sf.user_uid = $2
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS followers_count
         FROM shop_follow fs
         WHERE fs.shop_uid = s.shop_uid
       ) fc ON true
       WHERE s.shop_uid = $1 AND s.status = 'approved'`,
      [shopId, user?.uid ?? null]
    );

    if (shopRes.rowCount && shopRes.rowCount > 0) {
      shop = shopRes.rows[0];
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
              s.avg_rating AS shop_avg_rating, s.is_blocked AS shop_blocked,
              pu.university_name AS shop_university_name,
              ep.status AS event_status
       FROM product p
       JOIN shop s ON s.shop_uid = p.shop_uid
       LEFT JOIN shop_join_university sju ON sju.shop_uid = s.shop_uid AND sju.status = 'approved'
       LEFT JOIN partner_university pu ON pu.university_uid = sju.university_uid
       LEFT JOIN event_product ep ON ep.product_uid = p.product_uid
       WHERE p.shop_uid = $1 AND p.status = 'active'
       ORDER BY p.created_at DESC`,
      [shopId]
    );

    products = productsRes.rows;

    if (user) {
      const [followRes, saveRes, reactRes] = await Promise.all([
        pool.query(`SELECT shop_uid FROM shop_follow WHERE user_uid = $1`, [user.uid]),
        pool.query(`SELECT product_uid FROM product_save WHERE user_uid = $1`, [user.uid]),
        pool.query(`SELECT product_uid FROM product_reaction WHERE user_uid = $1`, [user.uid]),
      ]);
      userFollowedShops = followRes.rows.map((r: any) => r.shop_uid);
      userSavedProducts = saveRes.rows.map((r: any) => r.product_uid);
      userReactedProducts = reactRes.rows.map((r: any) => r.product_uid);
    }
  } catch (error) {
    console.error("Error fetching shop profile:", error);
  }

  if (!shop) {
    return (
      <div className="flex-1 bg-[#fbfbfb] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white border border-[#eaeaea] p-8 shadow-sm rounded-none">
          <h2 className="text-xl font-medium text-[#1a1a1a] mb-2">Shop Not Found</h2>
          <p className="text-sm text-[#787878] mb-6">
            The shop you are looking for does not exist or has not been approved yet.
          </p>
          <Link
            href="/"
            className="px-5 py-2.5 bg-[#BA5B55] text-white text-xs uppercase tracking-wider font-medium hover:bg-white hover:text-[#BA5B55] border border-[#BA5B55] transition-all duration-300 rounded-none"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const canFollow = Boolean(user?.uid);

  return (
    <div className="flex-1 bg-[#fbfbfb] flex flex-col items-center justify-start min-h-0 overflow-y-auto py-6 px-4 custom-scrollbar">
      <div className="max-w-6xl w-full flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left Section: Info Panel (w-120 = 480px on desktop) */}
        <div className="w-full lg:w-[480px] shrink-0">
          <ShopProfileLeft
            shop={shop}
            currentUser={user ? { uid: user.uid, username: user.username } : null}
            canFollow={canFollow}
          />
        </div>

        {/* Right Section: Products Stream */}
        <div className="flex-1 w-full min-w-0">
          <ShopProductsClient
            products={products}
            currentUserId={user ? user.uid : null}
            currentUserRole={user ? user.role : null}
            initialFollowedShops={userFollowedShops}
            initialSavedProducts={userSavedProducts}
            initialReactedProducts={userReactedProducts}
          />
        </div>

      </div>
    </div>
  );
}
