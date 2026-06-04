import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(request: Request) {
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";

  const stateSecret = crypto.randomBytes(32).toString("hex");
  const { searchParams } = new URL(request.url);
  const sourcePage = searchParams.get("from");

  const options = {
    redirect_uri: process.env.GOOGLE_CALLBACK_URL as string,
    client_id: process.env.GOOGLE_CLIENT_ID as string,
    access_type: "offline",
    response_type: "code",
    prompt: "select_account consent",
    scope: ["email", "profile", "openid"].join(" "),
    state: stateSecret,
  };

  const url = new URL(rootUrl);
  url.search = new URLSearchParams(options).toString();

  const response = NextResponse.redirect(url.toString());

  response.cookies.set(
    "oauth_state",
    JSON.stringify({
      secret: stateSecret,
      from: sourcePage,
    }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60,
      path: "/",
    },
  );

  return response;
}
