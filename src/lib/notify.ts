import pool from "@/database/pool";
import crypto from "crypto";

interface NotifyParams {
  userUid: string;
  type: string;
  title: string;
  body: string;
  link?: string | null;
  imageUrl?: string | null;
}


export async function sendNotification({
  userUid,
  type,
  title,
  body,
  link = null,
  imageUrl = null,
}: NotifyParams) {
  try {
    const notifUid = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    

    await pool.query(
      `INSERT INTO notification (notif_uid, user_uid, type, title, body, link, image_url, created_at, is_read)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE)`,
      [notifUid, userUid, type, title, body, link, imageUrl, createdAt]
    );

    

    if ((global as any).io) {
      (global as any).io.to(`user:${userUid}`).emit("notification:new", {
        notif_uid: notifUid,
        type,
        title,
        body,
        link: link || undefined,
        image_url: imageUrl || undefined,
        is_read: false,
        created_at: createdAt,
      });
    }

    console.log(`[Notification] Sent to user ${userUid}: ${title}`);
  } catch (err) {
    console.error("Failed to send notification:", err);
  }
}
