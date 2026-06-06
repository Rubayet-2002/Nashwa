import { redirect } from "next/navigation";
import pool from "@/database/pool";
import { adminAuthMe } from "@/app/admin/lib/adminAuthMe";
import AdminShopsClient from "./AdminShopsClient";

export const dynamic = "force-dynamic";

export default async function AdminShopsPage() {
  const { admin, clearCookies } = await adminAuthMe();

  if (clearCookies) {
    redirect("/api/clear-cookie");
  }

  if (!admin) {
    redirect("/admin/login");
  }

  let pendingRequests: any[] = [];
  let approvedShops: any[] = [];

  try {
    const pendingRes = await pool.query(
      `SELECT s.shop_uid, s.owner_uid, s.shop_name, s.shop_email, s.shop_phone, s.shop_location, s.shop_description, s.nid_pdf_url, s.created_at,
              u.username, u.email as user_email, u.phone as user_phone
       FROM shop s
       JOIN users u ON s.owner_uid = u.uid
       WHERE s.status = 'pending'
       ORDER BY s.created_at ASC`
    );
    pendingRequests = pendingRes.rows;

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
    console.error("Error loading admin shops:", error);
  }

  return (
    <AdminShopsClient
      pendingRequests={pendingRequests}
      approvedShops={approvedShops}
    />
  );
}
