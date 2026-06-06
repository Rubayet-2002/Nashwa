import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";
import { redirect } from "next/navigation";
import SavedPostsClient from "./SavedPostsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Saved Posts - Nashwa",
  description: "View all your bookmarked student products and posts.",
};

export default async function SavedPostsPage() {
  const { user } = await authMe();

  if (!user) {
    redirect("/email");
  }

  let savedProducts: any[] = [];
  let userFollowedShops: string[] = [];
  let userReactedProducts: string[] = [];

  try {
    const [savedRes, followRes, reactRes] = await Promise.all([
      pool.query(
        `SELECT p.product_uid, p.title, p.description, p.price, p.original_price,
                p.discount_percent, p.currency, p.category, p.product_type,
                p.inside_delivery_charge, p.outside_delivery_charge, p.free_on_campus_delivery,
                p.sold_count, p.like_count, p.avg_rating, p.variants, p.created_at,
                (SELECT pi.image_url FROM product_image pi WHERE pi.product_uid = p.product_uid ORDER BY pi.position ASC, pi.id ASC LIMIT 1) AS image_url,
                COALESCE((SELECT json_agg(pi.image_url ORDER BY pi.position ASC, pi.id ASC) FROM product_image pi WHERE pi.product_uid = p.product_uid), '[]') AS image_urls,
                (SELECT COUNT(*)::int FROM product_comment pc WHERE pc.product_uid = p.product_uid) AS comment_count,
                s.shop_uid, s.shop_name, s.shop_location, s.profile_photo_url AS shop_profile_photo_url,
                s.avg_rating AS shop_avg_rating, s.is_blocked AS shop_blocked,
                pu.university_name AS shop_university_name
         FROM product_save ps
         JOIN product p ON p.product_uid = ps.product_uid
         JOIN shop s ON s.shop_uid = p.shop_uid
         LEFT JOIN shop_join_university sju ON sju.shop_uid = s.shop_uid AND sju.status = 'approved'
         LEFT JOIN partner_university pu ON pu.university_uid = sju.university_uid
         WHERE ps.user_uid = $1 AND s.status = 'approved' AND s.is_blocked = FALSE AND p.status = 'active'
         ORDER BY ps.created_at DESC`,
        [user.uid]
      ),
      pool.query(`SELECT shop_uid FROM shop_follow WHERE user_uid = $1`, [user.uid]),
      pool.query(`SELECT product_uid FROM product_reaction WHERE user_uid = $1`, [user.uid]),
    ]);

    savedProducts = savedRes.rows;
    userFollowedShops = followRes.rows.map((r: any) => r.shop_uid);
    userReactedProducts = reactRes.rows.map((r: any) => r.product_uid);
  } catch (err) {
    console.error("Error fetching saved posts data:", err);
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#f2f4f7] px-4 py-6 custom-scrollbar min-h-full">
      <div className="max-w-xl mx-auto mb-6 flex flex-col gap-1.5 text-center">
        <h1 className="text-xl font-extrabold text-[#1a1a1a]">Saved Posts</h1>
        <p className="text-xs text-gray-500">
          Your bookmarked campus products and student entrepreneur postings
        </p>
      </div>

      <SavedPostsClient
        initialProducts={savedProducts}
        currentUserId={user.uid}
        initialFollowedShops={userFollowedShops}
        initialReactedProducts={userReactedProducts}
      />
    </div>
  );
}
