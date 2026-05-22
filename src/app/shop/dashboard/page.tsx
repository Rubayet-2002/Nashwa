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

  // Fetch active shop details
  let shop = null;
  let products: Array<{ product_uid: string; title: string; description: string | null; price: string; currency: string; image_url: string | null; }> = [];
  try {
    const shopRes = await pool.query(
      `SELECT s.shop_uid, s.owner_uid, s.shop_name, s.shop_email, s.shop_phone, s.shop_location,
              s.shop_description, s.shop_bio, s.cover_photo_url, s.profile_photo_url,
              pu.university_name
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
              (
                SELECT pi.image_url
                FROM product_image pi
                WHERE pi.product_uid = p.product_uid
                ORDER BY pi.position ASC, pi.id ASC
                LIMIT 1
              ) AS image_url
       FROM product p
       WHERE p.shop_uid = $1
       ORDER BY p.created_at DESC`,
      [activeShopUid]
    );

    products = productsRes.rows;
  } catch (error) {
    console.error("Error fetching shop for dashboard:", error);
  }

  if (!shop || shop.owner_uid !== user.uid) {
    redirect("/profile");
  }

  return <DashboardClient shop={shop} user={user} products={products} />;
}