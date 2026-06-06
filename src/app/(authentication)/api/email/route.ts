import { NextResponse } from "next/server";
import pool from "@/database/pool";
import { emailCheck } from "@/app/(authentication)/lib/inputValidation";
import { issueJWT, setTokenCookie } from "@/app/(authentication)/lib/jwtUtils";

export async function POST(request: Request) {
  try {
    if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
      return NextResponse.json({ message: "Security check" }, { status: 403 });
    }

    const body = await request.json();
    const validation = emailCheck.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 },
      );
    }

    const { email } = validation.data;
    const result = await pool.query(
      "SELECT uid, password_hash, auth_type FROM users WHERE email = $1",
      [email],
    );

    const user = result.rows[0];
    const userExists = result.rowCount! > 0;

    if (userExists && user.auth_type === "google" && !user.password_hash) {
      return NextResponse.json(
        {
          exist: userExists,
          message: "Please sign in with Google.",
          auth_type: "google",
        },
        { status: 200 },
      );
    }

    const purpose = userExists ? "enter-password" : "create-account";
    const redirectPath = userExists ? "/password" : "/proceed";

    const response = NextResponse.json(
      {
        exist: userExists,
        redirect: redirectPath,
      },
      { status: 200 },
    );

    const payload = {
      email: email,
      uid: user?.uid ?? null,
      purpose: purpose,
    };
    const emailToken = await issueJWT(payload, "30m");

    setTokenCookie(response, "auth-intent-token", emailToken, 30 * 60);

    return response;
  } catch (error) {
    console.error("Email check error:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
