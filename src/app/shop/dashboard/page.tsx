import { redirect } from "next/navigation";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function ShopDashboardPage() {
  const { user, activeShopUid, clearCookies } = await authMe();

  if (clearCookies) {
    redirect("/api/clear-cookie");
  }

  if (!user) {
    redirect("/email");
  }

  if (!activeShopUid) {
    redirect("/profile");
  }

  

  let shop = null;
  let products: Array<{
    product_uid: string;
    title: string;
    description: string | null;
    price: string;
    currency: string;
    image_url: string | null;
    inside_delivery_charge?: any;
    outside_delivery_charge?: any;
    free_on_campus_delivery?: boolean;
    reaction_count?: number;
    comment_count?: number;
  }> = [];
  let recentOrders: Array<{
    order_uid: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    note: string | null;
    delivery_address: string;
    city: string | null;
    postal_code: string | null;
    delivery_type: string;
    payment_method: string;
    subtotal: string;
    delivery_charge: string;
    total_amount: string;
    currency: string;
    status: string;
    created_at: string;
    items: Array<{
      id: number;
      product_uid: string;
      product_title: string;
      variant: string | null;
      unit_price: string;
      quantity: number;
      line_total: string;
    }>;
  }> = [];
  
  try {
    

    await pool.query(`
      UPDATE shop
      SET is_blocked = TRUE
      WHERE status = 'approved'
        AND is_blocked = FALSE
        AND platform_debt > 0
        AND (
          (last_payment_at IS NOT NULL AND last_payment_at < NOW() - INTERVAL '30 days') OR
          (last_payment_at IS NULL AND approved_at IS NOT NULL AND approved_at < NOW() - INTERVAL '30 days') OR
          (last_payment_at IS NULL AND approved_at IS NULL AND created_at < NOW() - INTERVAL '30 days')
        )
    `);

    const shopRes = await pool.query(
      `SELECT s.shop_uid, s.owner_uid, s.shop_name, s.shop_email, s.shop_phone, s.shop_location,
              s.shop_description, s.shop_bio, s.cover_photo_url, s.profile_photo_url,
              s.platform_debt, s.is_blocked, s.total_revenue,
              s.instagram_url, s.facebook_url,
              pu.university_name, sju.status AS university_status
       FROM shop s
       LEFT JOIN shop_join_university sju ON sju.shop_uid = s.shop_uid
       LEFT JOIN partner_university pu ON pu.university_uid = sju.university_uid
       WHERE s.shop_uid = $1`,
      [activeShopUid]
    );

    if (shopRes.rowCount && shopRes.rowCount > 0) {
      shop = shopRes.rows[0];
    }

    const productsRes = await pool.query(
      `SELECT p.product_uid, p.title, p.description, p.price, p.currency,
              p.inside_delivery_charge, p.outside_delivery_charge, p.free_on_campus_delivery,
              p.original_price, p.discount_percent, p.product_type, p.variants, p.category, p.product_details,
              COALESCE((SELECT json_agg(pi.image_url ORDER BY pi.position ASC, pi.id ASC) FROM product_image pi WHERE pi.product_uid = p.product_uid), '[]') AS image_urls,
              (
                SELECT pi.image_url
                FROM product_image pi
                WHERE pi.product_uid = p.product_uid
                ORDER BY pi.position ASC, pi.id ASC
                LIMIT 1
              ) AS image_url,
              (
                SELECT COUNT(*)::int
                FROM product_reaction pr
                WHERE pr.product_uid = p.product_uid
              ) AS reaction_count,
              (
                SELECT COUNT(*)::int
                FROM product_comment pc
                WHERE pc.product_uid = p.product_uid
              ) AS comment_count
       FROM product p
       WHERE p.shop_uid = $1 AND p.status = 'active'
       ORDER BY p.created_at DESC`,
      [activeShopUid]
    );

    products = productsRes.rows;

    const ordersRes = await pool.query(
      `SELECT o.order_uid, o.customer_name, o.customer_email, o.customer_phone, o.note,
              o.delivery_address, o.city, o.postal_code, o.delivery_type, o.payment_method,
              o.subtotal, o.delivery_charge, o.total_amount, o.currency, o.status, o.created_at,
              COALESCE(
                (SELECT json_agg(row_to_json(ori))
                 FROM order_request_item ori
                 WHERE ori.order_uid = o.order_uid),
                '[]'
              ) AS items
       FROM order_request o
       WHERE o.shop_uid = $1
       ORDER BY o.created_at DESC`,
      [activeShopUid],
    );

    recentOrders = ordersRes.rows;
  } catch (error) {
    console.error("Error fetching shop for dashboard:", error);
  }

  if (!shop || shop.owner_uid !== user.uid) {
    redirect("/profile");
  }

  return <DashboardClient shop={shop} user={user} products={products} recentOrders={recentOrders} />;
}
