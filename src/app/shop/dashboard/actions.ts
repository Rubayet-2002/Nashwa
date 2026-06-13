"use server";

import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";
import { revalidatePath } from "next/cache";

export async function updateShopBio(shopUid: string, bio: string) {
  const { user } = await authMe();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    

    const shopRes = await pool.query(
      "SELECT owner_uid FROM shop WHERE shop_uid = $1",
      [shopUid]
    );

    if (shopRes.rowCount === 0 || shopRes.rows[0].owner_uid !== user.uid) {
      return { success: false, error: "Unauthorized" };
    }

    await pool.query(
      "UPDATE shop SET shop_bio = $1 WHERE shop_uid = $2",
      [bio, shopUid]
    );

    revalidatePath("/shop/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error updating bio:", error);
    return { success: false, error: "Internal server error" };
  }
}

export async function updateShopInfo(
  shopUid: string,
  data: {
    email: string;
    phone: string;
    location: string;
    instagram_url?: string | null;
    facebook_url?: string | null;
  }
) {
  const { user } = await authMe();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    

    const shopRes = await pool.query(
      "SELECT owner_uid FROM shop WHERE shop_uid = $1",
      [shopUid]
    );

    if (shopRes.rowCount === 0 || shopRes.rows[0].owner_uid !== user.uid) {
      return { success: false, error: "Unauthorized" };
    }

    await pool.query(
      "UPDATE shop SET shop_email = $1, shop_phone = $2, shop_location = $3, instagram_url = $4, facebook_url = $5 WHERE shop_uid = $6",
      [
        data.email,
        data.phone,
        data.location,
        data.instagram_url || null,
        data.facebook_url || null,
        shopUid,
      ]
    );

    revalidatePath("/shop/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error updating shop info:", error);
    return { success: false, error: "Internal server error" };
  }
}
