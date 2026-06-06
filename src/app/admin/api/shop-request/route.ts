import { NextResponse } from "next/server";
import pool from "@/database/pool";
import { adminAuthMe } from "@/app/admin/lib/adminAuthMe";
import { mail_shopApproved, mail_shopRejected } from "@/app/(authentication)/lib/mail";

export async function POST(request: Request) {
  try {
    if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
      return NextResponse.json(
        { message: "Security check failed." },
        { status: 403 },
      );
    }

    const { admin } = await adminAuthMe();
    if (!admin) {
      return NextResponse.json(
        { message: "Unauthorized admin access." },
        { status: 401 },
      );
    }

    const { shop_uid, action, reason } = await request.json();

    if (!shop_uid || !action) {
      return NextResponse.json(
        { message: "Missing required fields." },
        { status: 400 },
      );
    }

    const shopRes = await pool.query(
      "SELECT shop_name, owner_uid FROM shop WHERE shop_uid = $1",
      [shop_uid],
    );

    if ((shopRes.rowCount ?? 0) === 0) {
      return NextResponse.json(
        { message: "Shop request not found." },
        { status: 404 },
      );
    }

    const shop = shopRes.rows[0];

    const userRes = await pool.query("SELECT email FROM users WHERE uid = $1", [
      shop.owner_uid,
    ]);

    const userEmail = (userRes.rowCount ?? 0) > 0 ? userRes.rows[0].email : null;

    if (action === "approve") {
      await pool.query("BEGIN");
      await pool.query(
        "UPDATE shop SET status = 'approved', approved_at = NOW() WHERE shop_uid = $1",
        [shop_uid],
      );
      await pool.query(
        "UPDATE users SET role = 'seller' WHERE uid = $1",
        [shop.owner_uid],
      );
      await pool.query("COMMIT");

      if (userEmail) {
        await mail_shopApproved(userEmail, shop.shop_name);
      }

      return NextResponse.json({
        success: true,
        message: `Shop "${shop.shop_name}" approved successfully.`,
      });
    } else if (action === "reject") {
      if (!reason || reason.trim() === "") {
        return NextResponse.json(
          { message: "Rejection reasoning is required." },
          { status: 400 },
        );
      }

      await pool.query("BEGIN");
      await pool.query("DELETE FROM shop WHERE shop_uid = $1", [shop_uid]);
      await pool.query("COMMIT");

      if (userEmail) {
        await mail_shopRejected(userEmail, shop.shop_name, reason);
      }

      return NextResponse.json({
        success: true,
        message: `Shop request for "${shop.shop_name}" rejected and removed.`,
      });
    } else {
      return NextResponse.json({ message: "Invalid action." }, { status: 400 });
    }
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Admin Shop Request Action Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
