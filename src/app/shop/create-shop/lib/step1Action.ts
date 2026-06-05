"use server";

import { redirect } from "next/navigation";
import {
  CreateShopPayload,
  getCreateShopCookie,
  setCreateShopCookie,
} from "./utils";

export async function Step1Action(prevState: any, formData: FormData) {
  const shopName = (formData.get("shopName") as string)?.trim();
  const shopEmail = (formData.get("shopEmail") as string)?.trim();
  const shopPhone = (formData.get("shopPhone") as string)?.trim();

  if (!shopName || !shopEmail || !shopPhone) {
    return {
      error: "All fields are required.",
      values: { shopName, shopEmail, shopPhone },
    };
  }

  if (shopPhone.length !== 11) {
    return {
      error: "Phone number must be exactly 11 digits.",
      values: { shopName, shopEmail, shopPhone },
    };
  }

  try {
    const existingPayload = await getCreateShopCookie();
    const newPayload: CreateShopPayload = {
      ...existingPayload,
      step: 2,
      shopName,
      shopEmail,
      shopPhone,
    };

    await setCreateShopCookie(newPayload);
  } catch (error) {
    console.error("Error saving step 1 progress:", error);
    return {
      error: "Failed to save shop information. Please try again.",
      values: { shopName, shopEmail, shopPhone },
    };
  }

  redirect("/shop/create-shop");
}
