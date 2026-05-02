import { NextResponse } from "next/server";
import pool from "../../../../database/pool";
import { emailCheck } from "../../lib/inputValidation";
import { issueJWT, setTokenCookie } from "../../lib/jwtUtils";

export async function POST(request: Request) {
  try {
    const requestedWith = request.headers.get("x-requested-with");
    if (requestedWith !== "XMLHttpRequest") {
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
      "SELECT email, role, auth_type FROM users WHERE email = $1",
      [email],
    );

    const userExists = result.rowCount! > 0;
    const message = userExists ? "Email exists" : "Email does not exist";

    const user = userExists ? result.rows[0] : null;

    if (user && user.auth_type === "google") {
      return NextResponse.json(
        {
          exist: true,
          message: "Please sign in with Google.",
          auth_type: "google",
        },
        { status: 200 },
      );
    }

    const response = NextResponse.json(
      { exist: userExists, message: message },
      { status: 200 },
    );

    const purpose = userExists ? "enter-password" : "create-account";

    const payload = {
      email: email,
      purpose: purpose,
    };

    const emailToken = await issueJWT(payload, "15m");

    setTokenCookie(response, "auth-email-token", emailToken, 15 * 60);

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
