import { redirect } from "next/navigation";
import pool from "@/database/pool";
import { adminAuthMe } from "@/app/admin/lib/adminAuthMe";
import AdminReportsClient from "./AdminReportsClient";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const { admin, clearCookies } = await adminAuthMe();

  if (clearCookies) {
    redirect("/api/clear-cookie");
  }

  if (!admin) {
    redirect("/admin/login");
  }

  let reports: any[] = [];

  try {
    const reportsRes = await pool.query(`
      SELECT r.report_uid, r.reason, r.status, r.action_taken, r.created_at,
             r.reporter_uid, r.product_uid,
             u.username AS reporter_name,
             p.title AS product_title, p.price AS product_price, p.status AS product_status,
             s.shop_name, s.shop_uid, s.owner_uid AS seller_uid,
             (SELECT image_url FROM product_image WHERE product_uid = p.product_uid LIMIT 1) AS product_image
      FROM report r
      JOIN users u ON r.reporter_uid = u.uid
      JOIN product p ON r.product_uid = p.product_uid
      JOIN shop s ON p.shop_uid = s.shop_uid
      ORDER BY r.status ASC, r.created_at DESC
    `);
    reports = reportsRes.rows;
  } catch (error) {
    console.error("Error loading admin reports page:", error);
  }

  return (
    <AdminReportsClient
      initialReports={reports}
    />
  );
}
