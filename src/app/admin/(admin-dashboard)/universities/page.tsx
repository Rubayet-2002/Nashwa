import { redirect } from "next/navigation";
import pool from "@/database/pool";
import { adminAuthMe } from "@/app/admin/lib/adminAuthMe";
import AdminUniversitiesClient from "./AdminUniversitiesClient";

export const dynamic = "force-dynamic";

export default async function AdminUniversitiesPage() {
  const { admin, clearCookies } = await adminAuthMe();

  if (clearCookies) {
    redirect("/api/clear-cookie");
  }

  if (!admin) {
    redirect("/admin/login");
  }

  let universities: any[] = [];
  let joinRequests: any[] = [];

  try {
    

    const uniRes = await pool.query(
      "SELECT * FROM partner_university ORDER BY created_at DESC"
    );
    universities = uniRes.rows;

    

    const reqRes = await pool.query(`
      SELECT sju.id, sju.shop_uid, sju.university_uid, sju.student_id, sju.sid_pdf_url, sju.status, sju.created_at,
             s.shop_name, s.shop_email, s.shop_phone, s.owner_uid,
             u.university_name
      FROM shop_join_university sju
      JOIN shop s ON sju.shop_uid = s.shop_uid
      JOIN partner_university u ON sju.university_uid = u.university_uid
      ORDER BY sju.created_at DESC
    `);
    joinRequests = reqRes.rows;
  } catch (error) {
    console.error("Error loading admin universities page:", error);
  }

  return (
    <AdminUniversitiesClient
      initialUniversities={universities}
      initialRequests={joinRequests}
    />
  );
}
