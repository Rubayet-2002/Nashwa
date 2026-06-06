"use server";

import { redirect } from "next/navigation";
import {
  CreateShopPayload,
  getCreateShopCookie,
  setCreateShopCookie,
  clearCreateShopCookie,
} from "./utils";

export async function Step2Action(prevState: any, formData: FormData) {
  const location = (formData.get("location") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();

  const existingPayload = await getCreateShopCookie();
  if (!existingPayload) {
    await clearCreateShopCookie();
    return {
      error: "Session expired. Please start over.",
      redirect: "/shop/create-shop",
      values: { location, description },
    };
  }

  if (!location || !description) {
    return {
      error: "All fields are required.",
      values: { location, description },
    };
  }

  if (description.length > 300) {
    return {
      error: "Description cannot exceed 300 characters.",
      values: { location, description },
    };
  }

  try {
    const newPayload: CreateShopPayload = {
      ...existingPayload,
      step: 3,
      location,
      description,
    };

    await setCreateShopCookie(newPayload);
  } catch (error) {
    console.error("Error saving step 2 progress:", error);
    return {
      error: "Failed to save location & description.",
      values: { location, description },
    };
  }

  redirect("/shop/create-shop");
}
