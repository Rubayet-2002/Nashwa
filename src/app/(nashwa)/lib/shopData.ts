import pool from "@/database/pool";
import { authMe } from "../../(authentication)/lib/authMe";

export const shopData = async () => {
  try {
    const { user: authUser } = await authMe();
    if (!authUser || authUser.role !== "seller") return null;

    const result = await pool.query(
      `SELECT sl.seller_status, s.shop_name, s.description 
       FROM sellers sl
       LEFT JOIN shops s ON sl.seller_id = s.owner_id
       WHERE sl.seller_id = $1`,
      [authUser.uid],
    );

    if (result.rowCount === 0) return null;

    const data = result.rows[0];

    return {
      shopStatus: data.seller_status,
      shopName: data.shop_name,
      description: data.description,
    };
  } catch (error) {
    console.error("Failed to fetch shop data:", error);
    return null;
  }
};
