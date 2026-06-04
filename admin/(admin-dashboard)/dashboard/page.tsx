import { redirect } from "next/navigation";
import pool from "@/database/pool";
import { adminAuthMe } from "@/app/admin/lib/adminAuthMe";
import AdminDashboardClient from "./AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const { admin, clearCookies } = await adminAuthMe();

  if (clearCookies) {
    redirect("/api/clear-cookie");
  }

  if (!admin) {
    redirect("/admin/login");
  }

  let counts = {
    customer_count: 0,
    seller_count: 0,
    shop_count: 0,
  };

  let pendingRequests: any[] = [];
  let approvedShops: any[] = [];

  try {
    // 1. Get counts
    const customerRes = await pool.query("SELECT COUNT(*)::int as count FROM users WHERE role = 'customer'");
    const sellerRes = await pool.query("SELECT COUNT(*)::int as count FROM users WHERE role = 'seller'");
    const shopRes = await pool.query("SELECT COUNT(*)::int as count FROM shop WHERE status = 'approved'");

    counts = {
      customer_count: customerRes.rows[0]?.count || 0,
      seller_count: sellerRes.rows[0]?.count || 0,
      shop_count: shopRes.rows[0]?.count || 0,
    };

    // 2. Get pending requests
    const pendingRes = await pool.query(
      `SELECT s.shop_uid, s.owner_uid, s.shop_name, s.shop_email, s.shop_phone, s.shop_location, s.shop_description, s.nid_pdf_url, s.created_at,
              u.username, u.email as user_email, u.phone as user_phone
       FROM shop s
       JOIN users u ON s.owner_uid = u.uid
       WHERE s.status = 'pending'
       ORDER BY s.created_at ASC`
    );
    pendingRequests = pendingRes.rows;

    // 3. Get approved shops
    const approvedRes = await pool.query(
      `SELECT s.shop_uid, s.owner_uid, s.shop_name, s.shop_email, s.shop_phone, s.shop_location, s.shop_description, s.nid_pdf_url, s.created_at, s.approved_at,
              u.username, u.email as user_email, u.phone as user_phone
       FROM shop s
       JOIN users u ON s.owner_uid = u.uid
       WHERE s.status = 'approved'
       ORDER BY s.approved_at DESC`
    );
    approvedShops = approvedRes.rows;

  } catch (error) {
    console.error("Error loading admin dashboard stats:", error);
  }

  return (
    <AdminDashboardClient
      adminEmail={admin.admin_email}
      counts={counts}
      pendingRequests={pendingRequests}
      approvedShops={approvedShops}
    />
  );
}
