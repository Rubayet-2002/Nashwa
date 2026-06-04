import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";
import HomeFeedClient from "./home/HomeFeedClient";
import FeastEventsPanel from "./home/FeastEventsPanel";
import AIChatPanel from "./home/AIChatPanel";
import TopShopsPanel from "./home/TopShopsPanel";
import PaidPromotion from "./home/PaidPromotion";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Nashwa — Student Entrepreneur Marketplace",
  description: "Discover unique products from student entrepreneurs across Bangladesh.",
};

export default async function Homepage() {
  const { user } = await authMe();

  let shops: any[] = [];
  let events: any[] = [];
  let communities: any[] = [];
  let initialProducts: any[] = [];
  let userFollowedShops: string[] = [];
  let userSavedProducts: string[] = [];
  let userReactedProducts: string[] = [];

  try {
    const [shopsRes, eventsRes, comRes, productsRes] = await Promise.all([
      pool.query(`
        SELECT s.shop_uid, s.shop_name, s.shop_location, s.profile_photo_url,
               s.avg_rating, s.follower_count, pu.university_name,
               u.username AS owner_name
        FROM shop s
        JOIN users u ON s.owner_uid = u.uid
        LEFT JOIN shop_join_university sju ON sju.shop_uid = s.shop_uid AND sju.status = 'approved'
        LEFT JOIN partner_university pu ON pu.university_uid = sju.university_uid
        WHERE s.status = 'approved' AND s.is_blocked = FALSE
        ORDER BY s.follower_count DESC NULLS LAST, s.avg_rating DESC NULLS LAST
        LIMIT 8
      `),
      pool.query(`
        SELECT event_uid, title, description, image_url, venue, start_at, ends_at
        FROM campus_event
        WHERE ends_at > NOW() AND is_active = TRUE
        ORDER BY start_at ASC
        LIMIT 4
      `),
      pool.query(`
        SELECT university_uid, university_name, logo_url
        FROM partner_university
        ORDER BY university_name ASC
      `),
      pool.query(`
        SELECT p.product_uid, p.title, p.description, p.price, p.original_price,
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
        WHERE s.status = 'approved' AND s.is_blocked = FALSE
          AND p.status = 'active'
        ORDER BY p.created_at DESC
        LIMIT 20
      `),
    ]);
    shops = shopsRes.rows;
    events = eventsRes.rows;
    communities = comRes.rows;
    initialProducts = productsRes.rows;

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
  } catch (err) {
    console.error("Homepage data error:", err);
  }

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden gap-4">
      {/* Left sidebar */}
      <aside className="w-110 min-h-0 flex flex-col gap-4">
        <TopShopsPanel shops={shops} userId={user?.uid || null} followedShops={userFollowedShops} />
        <PaidPromotion />
      </aside>
    <main className="flex-1 flex flex-col gap-4">
        <HomeFeedClient
          initialProducts={initialProducts}
          communities={communities}
          currentUserId={user?.uid || null}
          currentUserRole={user?.role || null}
          initialFollowedShops={userFollowedShops}
          initialSavedProducts={userSavedProducts}
          initialReactedProducts={userReactedProducts}
        />
    </main>



      {/* Right sidebar */}
      <aside className="w-110 min-h-0 flex flex-col gap-4">
        <FeastEventsPanel events={events} />
        <AIChatPanel />
      </aside>
    </div>
  );
}
