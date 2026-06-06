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
               NULL::numeric AS avg_rating,
               0::int AS follower_count,
               pu.university_name,
               u.username AS owner_name
        FROM shop s
        JOIN users u ON s.owner_uid = u.uid
        LEFT JOIN shop_join_university sju ON sju.shop_uid = s.shop_uid AND sju.status = 'approved'
        LEFT JOIN partner_university pu ON pu.university_uid = sju.university_uid
        WHERE s.status = 'approved'
        ORDER BY s.created_at DESC
        LIMIT 8
      `),
      pool.query(`
        SELECT event_uid, title, description, image_url, venue,
               COALESCE(created_at, ends_at) AS start_at,
               ends_at
        FROM campus_event
        WHERE ends_at > NOW()
        ORDER BY ends_at ASC
        LIMIT 4
      `),
      pool.query(`
        SELECT university_uid, university_name, logo_url
        FROM partner_university
        ORDER BY university_name ASC
      `),
      pool.query(`
        SELECT p.product_uid, p.title, p.description, p.price,
               NULL::numeric AS original_price,
               NULL::numeric AS discount_percent,
               COALESCE(p.currency, 'BDT') AS currency,
               NULL::text AS category,
               'regular'::text AS product_type,
               0::numeric AS inside_delivery_charge,
               0::numeric AS outside_delivery_charge,
               FALSE AS free_on_campus_delivery,
               0::int AS sold_count,
               0::int AS like_count,
               NULL::numeric AS avg_rating,
               '[]'::jsonb AS variants,
               p.created_at,
               NULL::text AS image_url,
               '[]'::json AS image_urls,
               0::int AS comment_count,
               s.shop_uid, s.shop_name, s.shop_location, s.profile_photo_url AS shop_profile_photo_url,
               NULL::numeric AS shop_avg_rating,
               FALSE AS shop_blocked,
               pu.university_name AS shop_university_name,
               NULL::text AS event_status
        FROM product p
        JOIN shop s ON s.shop_uid = p.shop_uid
        LEFT JOIN shop_join_university sju ON sju.shop_uid = s.shop_uid AND sju.status = 'approved'
        LEFT JOIN partner_university pu ON pu.university_uid = sju.university_uid
        WHERE s.status = 'approved'
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
