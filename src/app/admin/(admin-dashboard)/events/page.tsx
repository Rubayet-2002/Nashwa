import { redirect } from "next/navigation";
import pool from "@/database/pool";
import { adminAuthMe } from "@/app/admin/lib/adminAuthMe";
import AdminEventsClient from "./AdminEventsClient";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const { admin, clearCookies } = await adminAuthMe();

  if (clearCookies) {
    redirect("/api/clear-cookie");
  }

  if (!admin) {
    redirect("/admin/login");
  }

  let events: any[] = [];
  let submissions: any[] = [];

  try {
    // 1. Fetch events
    const eventRes = await pool.query(
      "SELECT * FROM campus_event ORDER BY created_at DESC"
    );
    events = eventRes.rows;

    // 2. Fetch event product submissions
    const subRes = await pool.query(`
      SELECT ep.event_uid, ep.product_uid, ep.shop_uid, ep.status, ep.reviewed_at,
             p.title AS product_title, p.price AS product_price,
             s.shop_name, s.owner_uid,
             e.title AS event_title,
             (SELECT image_url FROM product_image WHERE product_uid = p.product_uid LIMIT 1) AS product_image
      FROM event_product ep
      JOIN product p ON ep.product_uid = p.product_uid
      JOIN shop s ON ep.shop_uid = s.shop_uid
      JOIN campus_event e ON ep.event_uid = e.event_uid
      ORDER BY ep.status ASC, ep.reviewed_at DESC
    `);
    submissions = subRes.rows;
  } catch (error) {
    console.error("Error loading admin events page:", error);
  }

  return (
    <AdminEventsClient
      initialEvents={events}
      initialSubmissions={submissions}
    />
  );
}
