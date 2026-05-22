"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { issueJWT, verifyJWT } from "@/app/(authentication)/lib/jwtUtils";

export type CreateShopPayload = {
  step: number;
  shopName?: string;
  shopEmail?: string;
  shopPhone?: string;
  universityUid?: string;
  universityName?: string;
  location?: string;
  description?: string;
  nidPdfUrl?: string;
};

export async function getCreateShopCookie(): Promise<CreateShopPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("create-shop-token")?.value;
  if (!token) return null;
  const payload = (await verifyJWT(token)) as CreateShopPayload | null;
  return payload;
}

export async function setCreateShopCookie(payload: CreateShopPayload) {
  const token = await issueJWT(payload, "30m");
  const cookieStore = await cookies();
  cookieStore.set("create-shop-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 60,
  });
}

export async function clearCreateShopCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("create-shop-token");
}

export async function prevStepAction() {
  const existingPayload = await getCreateShopCookie();
  if (existingPayload && existingPayload.step > 1) {
    const newPayload: CreateShopPayload = {
      ...existingPayload,
      step: existingPayload.step - 1,
    };
    await setCreateShopCookie(newPayload);
  }
  redirect("/shop/create-shop");
}
