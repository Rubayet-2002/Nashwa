import { NextResponse } from "next/server";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
      return NextResponse.json({ message: "Security check failed." }, { status: 403 });
    }

    const { user } = await authMe();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, allOther } = await request.json();

    if (allOther) {
      // Revoke all other sessions (exclude the current user session ID)
      await pool.query(
        "UPDATE session SET is_revoked = TRUE WHERE user_uid = $1 AND session_id != $2",
        [user.uid, user.sessionId]
      );
      return NextResponse.json({ success: true, message: "Logged out of all other sessions." });
    }

    if (!sessionId) {
      return NextResponse.json({ message: "Session ID is required." }, { status: 400 });
    }

    // Revoke specific session ID
    const res = await pool.query(
      "UPDATE session SET is_revoked = TRUE WHERE session_id = $1 AND user_uid = $2",
      [sessionId, user.uid]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ message: "Session not found or unauthorized." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Session revoked successfully." });
  } catch (error) {
    console.error("Revoke session error:", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}
