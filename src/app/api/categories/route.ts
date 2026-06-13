import { NextResponse } from "next/server";
import pool from "@/database/pool";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await pool.query(
      "SELECT category_name FROM product_category ORDER BY category_name ASC"
    );
    return NextResponse.json({
      success: true,
      categories: res.rows.map((row) => row.category_name),
    });
  } catch (error) {
    console.error("Categories GET error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
