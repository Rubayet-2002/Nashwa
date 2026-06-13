import ShopNavbar from "./ShopNavbar";
import { authMe } from "@/app/(authentication)/lib/authMe";
import { redirect } from "next/navigation";
import pool from "@/database/pool";

export default async function ShopDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, activeShopUid, clearCookies } = await authMe();
  if (clearCookies) redirect("/api/clear-cookie");

  if (!user || !activeShopUid) {
    redirect("/profile");
  }

  const shopRes = await pool.query(
    "SELECT shop_name FROM shop WHERE shop_uid = $1 AND owner_uid = $2",
    [activeShopUid, user.uid],
  );

  if ((shopRes.rowCount ?? 0) === 0) {
    redirect("/profile");
  }

  const shopName = shopRes.rows[0].shop_name;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f5f5f5]">
      <main className="flex-1 flex min-h-0 p-6 max-w-7xl w-full mx-auto">{children}</main>
    </div>
  );
}
