import { NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";
import { ensureShopFollowTable } from "@/app/(nashwa)/lib/ensureShopFollowTable";

export async function POST(request: Request) {
  try {
    if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
      return NextResponse.json({ message: "Security check failed." }, { status: 403 });
    }

    const { user } = await authMe();
    if (!user) {
      return NextResponse.json({ message: "Please log in to follow shops." }, { status: 401 });
    }

    const { shopUid } = await request.json();
    if (!shopUid) {
      return NextResponse.json({ message: "Shop uid is required." }, { status: 400 });
    }

    await ensureShopFollowTable();

    const shopRes = await pool.query(
      "SELECT shop_uid, owner_uid FROM shop WHERE shop_uid = $1 AND status = 'approved'",
      [shopUid],
    );

    if ((shopRes.rowCount ?? 0) === 0) {
      return NextResponse.json({ message: "Shop not found." }, { status: 404 });
    }

    const shop = shopRes.rows[0];
    if (shop.owner_uid === user.uid) {
      return NextResponse.json({ message: "You cannot follow your own shop." }, { status: 400 });
    }

    const existingRes = await pool.query(
      "SELECT 1 FROM shop_follow WHERE shop_uid = $1 AND user_uid = $2",
      [shopUid, user.uid],
    );

    let isFollowing = false;

    if ((existingRes.rowCount ?? 0) > 0) {
      await pool.query(
        "DELETE FROM shop_follow WHERE shop_uid = $1 AND user_uid = $2",
        [shopUid, user.uid],
      );
      isFollowing = false;
    } else {
      await pool.query(
        "INSERT INTO shop_follow (shop_uid, user_uid) VALUES ($1, $2)",
        [shopUid, user.uid],
      );
      isFollowing = true;
    }

    const countRes = await pool.query(
      "SELECT COUNT(*)::int AS followers_count FROM shop_follow WHERE shop_uid = $1",
      [shopUid],
    );

    const followersCount = countRes.rows[0]?.followers_count ?? 0;

    return NextResponse.json({
      success: true,
      isFollowing,
      followersCount,
      message: isFollowing ? "Shop followed." : "Shop unfollowed.",
    });
  } catch (error) {
    console.error("toggle shop follow error:", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}
