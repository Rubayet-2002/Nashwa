"use server";

import { cookies } from "next/headers";

export default async function clearCookie() {
  const cookieStore = await cookies();

  cookieStore.delete("auth-intent-token");
  cookieStore.delete("access-token");
  cookieStore.delete("refresh-token");
}
