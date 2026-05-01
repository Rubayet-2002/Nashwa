import pool from "@/database/pool";
import { authMe } from "../../(authentication)/lib/authMe";

export const shopData = async () => {
  try {
    const { user: authUser } = await authMe();
    if (!authUser || authUser.role !== "seller") return null;

    const result = await pool.query(
      `SELECT sp.shop_status, s.shop_name, s.description 
       FROM seller_profiles sp
       LEFT JOIN shops s ON sp.seller_id = s.owner_id
       WHERE sp.seller_id = $1`,
      [authUser.uid],
    );

    if (result.rowCount === 0) return null;

    const data = result.rows[0];

    return {
      shopStatus: data.shop_status,
      shopName: data.shop_name,
      description: data.description,
    };
  } catch (error) {
    console.error("Failed to fetch shop data:", error);
    return null;
  }
};
