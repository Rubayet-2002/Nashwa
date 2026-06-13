import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";
import { notFound } from "next/navigation";
import EventDetailsClient from "./EventDetailsClient";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventUid: string }>;
}) {
  const { eventUid } = await params;
  const { user, activeShopUid } = await authMe();

  let event: any = null;
  let approvedProducts: any[] = [];
  let eligibleProducts: any[] = [];
  let mySubmissions: any[] = [];
  let userFollowedShops: string[] = [];
  let userSavedProducts: string[] = [];
  let userReactedProducts: string[] = [];

  try {
    // 1. Fetch Event details
    const eventRes = await pool.query(
      `SELECT e.event_uid, e.shop_uid, e.title, e.description, e.image_url, e.host_name, e.venue, e.ends_at, e.created_at,
              s.shop_name, s.profile_photo_url AS shop_avatar
       FROM campus_event e
       LEFT JOIN shop s ON s.shop_uid = e.shop_uid
       WHERE e.event_uid = $1`,
      [eventUid]
    );

    if (eventRes.rowCount === 0) {
      notFound();
    }
    event = eventRes.rows[0];

    // 2. Fetch approved products for the event
    const prodRes = await pool.query(
      `SELECT p.product_uid, p.title, p.description, p.price, p.original_price,
              p.discount_percent, p.currency, p.category, p.product_type,
              p.inside_delivery_charge, p.outside_delivery_charge, p.free_on_campus_delivery,
              p.sold_count, p.like_count, p.avg_rating, p.variants, p.created_at,
              (SELECT pi.image_url FROM product_image pi WHERE pi.product_uid = p.product_uid ORDER BY pi.position ASC, pi.id ASC LIMIT 1) AS image_url,
              COALESCE((SELECT json_agg(pi.image_url ORDER BY pi.position ASC, pi.id ASC) FROM product_image pi WHERE pi.product_uid = p.product_uid), '[]') AS image_urls,
              (SELECT COUNT(*)::int FROM product_comment pc WHERE pc.product_uid = p.product_uid) AS comment_count,
              s.shop_uid, s.shop_name, s.shop_location, s.profile_photo_url AS shop_profile_photo_url,
              s.avg_rating AS shop_avg_rating, s.is_blocked AS shop_blocked, s.owner_uid AS shop_owner_uid,
              pu.university_name AS shop_university_name,
              ep.status AS event_status
       FROM event_product ep
       JOIN product p ON p.product_uid = ep.product_uid
       JOIN shop s ON s.shop_uid = p.shop_uid
       LEFT JOIN shop_join_university sju ON sju.shop_uid = s.shop_uid AND sju.status = 'approved'
       LEFT JOIN partner_university pu ON pu.university_uid = sju.university_uid
       WHERE ep.event_uid = $1 AND ep.status = 'approved' AND p.status = 'active'
       ORDER BY ep.created_at DESC`,
      [eventUid]
    );
    approvedProducts = prodRes.rows;

    // 3. If logged in as shop owner, fetch their products and current submissions
    if (activeShopUid) {
      // Products not yet submitted to this event
      const eligibleRes = await pool.query(
        `SELECT product_uid, title, price
         FROM product
         WHERE shop_uid = $1 AND status = 'active'
           AND product_uid NOT IN (SELECT product_uid FROM event_product WHERE event_uid = $2)
         ORDER BY created_at DESC`,
        [activeShopUid, eventUid]
      );
      eligibleProducts = eligibleRes.rows;

      // Current submissions to this event (to display status)
      const subRes = await pool.query(
        `SELECT ep.product_uid, ep.status, ep.created_at, p.title AS product_title, p.price AS product_price
         FROM event_product ep
         JOIN product p ON p.product_uid = ep.product_uid
         WHERE ep.event_uid = $1 AND ep.shop_uid = $2
         ORDER BY ep.created_at DESC`,
        [eventUid, activeShopUid]
      );
      mySubmissions = subRes.rows;
    }

    // 4. Fetch user interactions
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
    console.error("Error fetching event details:", error);
    notFound();
  }

  return (
    <EventDetailsClient
      event={event}
      initialProducts={approvedProducts}
      eligibleProducts={eligibleProducts}
      initialSubmissions={mySubmissions}
      currentUserId={user?.uid || null}
      currentUserRole={user?.role || null}
      activeShopUid={activeShopUid}
      initialFollowedShops={userFollowedShops}
      initialSavedProducts={userSavedProducts}
      initialReactedProducts={userReactedProducts}
    />
  );
}
