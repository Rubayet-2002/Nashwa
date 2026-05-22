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
  try {
    const shopRes = await pool.query(
      "SELECT shop_uid, owner_uid, shop_name, shop_email, shop_phone, shop_location, shop_description, shop_bio, cover_photo_url, profile_photo_url FROM shop WHERE shop_uid = $1",
      [activeShopUid]
    );

    if (shopRes.rowCount && shopRes.rowCount > 0) {
      shop = shopRes.rows[0];
    }
  } catch (error) {
    console.error("Error fetching shop for dashboard:", error);
  }

  if (!shop || shop.owner_uid !== user.uid) {
    redirect("/profile");
  }

  return <DashboardClient shop={shop} user={user} />;
}