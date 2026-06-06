import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";
import { redirect } from "next/navigation";
import NotificationsClient from "./NotificationsClient";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const { user } = await authMe();
  if (!user) redirect("/email");

  let notifications: any[] = [];
  try {
    const res = await pool.query(
      `SELECT notif_uid, type, title, body, link, is_read, created_at
       FROM notification
       WHERE user_uid = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [user.uid],
    );
    notifications = res.rows;
  } catch (err) {
    console.error("Notifications fetch error:", err);
  }

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar flex justify-center items-start pt-6 px-4">
      <div className="w-full max-w-2xl">
        <NotificationsClient
          initialNotifications={notifications}
          userId={user.uid}
        />
      </div>
    </div>
  );
}
