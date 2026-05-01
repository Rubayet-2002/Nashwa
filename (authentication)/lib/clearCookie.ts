"use server";

import { cookies } from "next/headers";

export default async function clearAuthCookies() {
    const cookieStore = await cookies();
    cookieStore.delete("access-token");
    cookieStore.delete("refresh-token");
    cookieStore.delete("auth-email-token");
    cookieStore.delete("password-reset-token");
}