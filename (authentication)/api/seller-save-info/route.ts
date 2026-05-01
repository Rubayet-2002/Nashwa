import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJWT, issueJWT, setTokenCookie } from "../../lib/jwtUtils";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
      return NextResponse.json(
        { message: "Security check failed" },
        { status: 403 },
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("auth-email-token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Session expired" }, { status: 401 });
    }

    const payload = await verifyJWT(token);

    if (!payload || payload.purpose !== "seller-registration") {
      return NextResponse.json({ message: "Session expired" }, { status: 401 });
    }

    const body = await request.json();
    const {
      step,
      username,
      phone,
      university,
      password,
      shopName,
      location,
      description,
    } = body;

    let newPayload = { ...payload };

    if (step === 2) {
      if (!username || !phone || !university) {
        return NextResponse.json(
          { message: "All fields are required" },
          { status: 400 },
        );
      }
      newPayload = { ...newPayload, username, phone, university, step: 3 };

      if (payload.takePassword) {
        if (!password || password.length < 6) {
          return NextResponse.json(
            { message: "Password must be at least 6 characters" },
            { status: 400 },
          );
        }
        newPayload.password_hash = await bcrypt.hash(password, 12);
        newPayload.takePassword = false;
      }
    } else if (step === 3) {
      if (!shopName || !location || !description) {
        return NextResponse.json(
          { message: "All fields are required" },
          { status: 400 },
        );
      }

      newPayload = { ...newPayload, shopName, location, description, step: 4 };
    }

    const nextToken = await issueJWT(newPayload, "30m");
    const response = NextResponse.json({ success: true });
    setTokenCookie(response, "auth-email-token", nextToken, 30 * 60);

    return response;
  } catch (error) {
    console.error("Seller Save Info Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
