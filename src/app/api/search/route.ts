import { NextRequest, NextResponse } from "next/server";
import pool from "@/database/pool";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const preview = searchParams.get("preview");

  if (!q) return NextResponse.json({ shops: [], products: [], events: [], communities: [] });

  const search = `%${q}%`;

  try {
    const [shopsRes, productsRes, eventsRes, communitiesRes] = await Promise.all([
      pool.query(
        `SELECT s.shop_uid, s.shop_name, s.shop_location, s.profile_photo_url,
                s.avg_rating, s.follower_count, s.owner_uid, pu.university_name
         FROM shop s
         LEFT JOIN shop_join_university sju ON sju.shop_uid = s.shop_uid AND sju.status = 'approved'
         LEFT JOIN partner_university pu ON pu.university_uid = sju.university_uid
         WHERE s.status = 'approved' AND (
           s.shop_name ILIKE $1 OR s.shop_description ILIKE $1 OR s.shop_location ILIKE $1
         )
         LIMIT 10`,
        [search]
      ),
      pool.query(
        `SELECT p.product_uid, p.title, p.description, p.price, p.currency, p.category,
                (SELECT pi.image_url FROM product_image pi WHERE pi.product_uid = p.product_uid ORDER BY pi.position ASC LIMIT 1) AS image_url,
                s.shop_uid, s.shop_name, s.profile_photo_url AS shop_profile_photo_url
         FROM product p
         JOIN shop s ON s.shop_uid = p.shop_uid
         WHERE s.status = 'approved' AND p.status = 'active' AND (
           p.title ILIKE $1 OR p.description ILIKE $1 OR p.category ILIKE $1
         )
         LIMIT 15`,
        [search]
      ),
      pool.query(
        `SELECT event_uid, title, description, image_url, venue, start_at, ends_at
         FROM campus_event
         WHERE title ILIKE $1 OR description ILIKE $1 OR venue ILIKE $1
         LIMIT 5`,
        [search]
      ),
      pool.query(
        `SELECT university_uid, university_name, description, logo_url
         FROM partner_university
         WHERE university_name ILIKE $1 OR description ILIKE $1
         LIMIT 5`,
        [search]
      ),
    ]);

    // If preview flag is set, return a flattened results array suitable for autocomplete
    if (preview === "1") {
      const results: any[] = [];

      // Products
      for (const p of productsRes.rows) {
        results.push({
          type: "product",
          id: p.product_uid,
          title: p.title,
          subtitle: p.shop_name,
          image_url: p.image_url,
        });
      }

      // Shops
      for (const s of shopsRes.rows) {
        results.push({
          type: "shop",
          id: s.shop_uid,
          name: s.shop_name,
          title: s.shop_name,
          subtitle: s.shop_location || s.university_name,
          image_url: s.profile_photo_url,
        });
      }

      // Events
      for (const e of eventsRes.rows) {
        results.push({
          type: "event",
          id: e.event_uid,
          title: e.title,
          subtitle: e.venue,
          image_url: e.image_url,
        });
      }

      // Partner universities / communities
      for (const c of communitiesRes.rows) {
        results.push({
          type: "university",
          id: c.university_uid,
          title: c.university_name,
          subtitle: c.description,
          image_url: c.logo_url,
        });
      }

      return NextResponse.json({ results });
    }

    return NextResponse.json({
      shops: shopsRes.rows,
      products: productsRes.rows,
      events: eventsRes.rows,
      communities: communitiesRes.rows,
    });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json({ shops: [], products: [], events: [], communities: [] }, { status: 500 });
  }
}
