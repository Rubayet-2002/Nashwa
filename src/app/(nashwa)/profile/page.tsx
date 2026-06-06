import { redirect } from "next/navigation";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";
import ProfileClient from "./ProfileClient";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { user } = await authMe();
  if (!user) {
    redirect("/email");
  }

  try {
    // 1. Fetch user account information
    const userRes = await pool.query(
      `SELECT uid, username, email, phone, role, profile_photo_url, cover_photo_url, password_hash, created_at
       FROM users
       WHERE uid = $1`,
      [user.uid]
    );

    if (userRes.rowCount === 0) {
      redirect("/email");
    }

    const userData = userRes.rows[0];
    const joinedAt = new Date(userData.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const userProfile = {
      uid: userData.uid,
      username: userData.username,
      email: userData.email,
      phone: userData.phone || null,
      role: userData.role,
      profile_photo_url: userData.profile_photo_url || null,
      cover_photo_url: userData.cover_photo_url || null,
      joinedAt,
      sessionId: user.sessionId || "",
    };

    const hasPasswordInitially = userData.password_hash !== null;

    // 2. Fetch owned shops
    const ownedShopsRes = await pool.query(
      `SELECT shop_uid, shop_name, status, profile_photo_url
       FROM shop
       WHERE owner_uid = $1`,
      [user.uid]
    );
    const ownedShops = ownedShopsRes.rows;


    // 4. Fetch orders placed by this user (purchases) along with order items
    const ordersRes = await pool.query(
      `SELECT o.order_uid, o.shop_uid, o.customer_name, o.customer_email, o.customer_phone,
              o.delivery_address, o.city, o.postal_code, o.note, o.delivery_type, o.payment_method,
              o.subtotal, o.delivery_charge, o.total_amount, o.status, o.created_at,
              s.shop_name, s.profile_photo_url AS shop_photo,
              COALESCE((
                SELECT json_agg(row_to_json(ori))
                FROM order_request_item ori
                WHERE ori.order_uid = o.order_uid
              ), '[]') AS items
       FROM order_request o
       JOIN shop s ON s.shop_uid = o.shop_uid
       WHERE o.buyer_uid = $1
       ORDER BY o.created_at DESC`,
      [user.uid]
    );
    const orders = ordersRes.rows;

    // 5. Fetch active session history
    const sessionsRes = await pool.query(
      `SELECT session_id, device_type, device_ip, browser_name, os_name, created_at, expires_at
       FROM session
       WHERE user_uid = $1 AND is_revoked = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [user.uid]
    );
    const sessions = sessionsRes.rows;

    // Fetch user's reviews
    const reviewsRes = await pool.query(
      `SELECT product_uid, rating, review_text FROM product_review WHERE user_uid = $1`,
      [user.uid]
    );
    const userReviews = reviewsRes.rows;

    return (
      <div className="flex-1 bg-[#f2f4f7] overflow-y-auto custom-scrollbar py-6 px-4 flex justify-center items-start min-h-0 min-w-0">
        <div className="max-w-6xl w-full">
          <ProfileClient
            initialUser={userProfile}
            initialShops={ownedShops}
            orders={orders}
            sessions={sessions}
            hasPasswordInitially={hasPasswordInitially}
            initialReviews={userReviews}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Failed to load profile data:", error);
    redirect("/email");
  }
}
