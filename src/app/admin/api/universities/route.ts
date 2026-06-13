import { NextResponse } from "next/server";
import pool from "@/database/pool";
import { adminAuthMe } from "@/app/admin/lib/adminAuthMe";

export async function GET(request: Request) {
  try {
    const { admin } = await adminAuthMe();
    if (!admin) {
      return NextResponse.json({ message: "Unauthorized admin access." }, { status: 401 });
    }

    const res = await pool.query(
      "SELECT * FROM partner_university ORDER BY created_at DESC"
    );
    return NextResponse.json({ success: true, universities: res.rows });
  } catch (error) {
    console.error("Admin Universities GET error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
      return NextResponse.json({ message: "Security check failed." }, { status: 403 });
    }

    const { admin } = await adminAuthMe();
    if (!admin) {
      return NextResponse.json({ message: "Unauthorized admin access." }, { status: 401 });
    }

    const { name, description, logo_url } = await request.json();

    if (!name) {
      return NextResponse.json({ message: "Name is required." }, { status: 400 });
    }

    const universityUid = crypto.randomUUID();

    await pool.query(
      `INSERT INTO partner_university (university_uid, university_name, description, logo_url, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [universityUid, name, description || null, logo_url || null]
    );

    return NextResponse.json({
      success: true,
      message: `Community "${name}" created successfully.`,
      university: {
        university_uid: universityUid,
        university_name: name,
        description,
        logo_url,
      },
    });
  } catch (error) {
    console.error("Admin Universities POST error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
      return NextResponse.json({ message: "Security check failed." }, { status: 403 });
    }

    const { admin } = await adminAuthMe();
    if (!admin) {
      return NextResponse.json({ message: "Unauthorized admin access." }, { status: 401 });
    }

    const { university_uid, logo_url, description, university_name } = await request.json();

    if (!university_uid) {
      return NextResponse.json({ message: "University UID is required." }, { status: 400 });
    }

    

    const updates: string[] = [];
    const values: any[] = [];
    let counter = 1;

    if (logo_url !== undefined) {
      updates.push(`logo_url = $${counter++}`);
      values.push(logo_url);
    }
    if (description !== undefined) {
      updates.push(`description = $${counter++}`);
      values.push(description || null);
    }
    if (university_name !== undefined) {
      updates.push(`university_name = $${counter++}`);
      values.push(university_name);
    }

    if (updates.length === 0) {
      return NextResponse.json({ message: "No fields to update." }, { status: 400 });
    }

    values.push(university_uid);
    const query = `
      UPDATE partner_university
      SET ${updates.join(", ")}
      WHERE university_uid = $${counter}
      RETURNING *
    `;

    const res = await pool.query(query, values);

    if ((res.rowCount ?? 0) === 0) {
      return NextResponse.json({ message: "University not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "University details updated successfully.",
      university: res.rows[0],
    });
  } catch (error) {
    console.error("Admin Universities PATCH error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
      return NextResponse.json({ message: "Security check failed." }, { status: 403 });
    }

    const { admin } = await adminAuthMe();
    if (!admin) {
      return NextResponse.json({ message: "Unauthorized admin access." }, { status: 401 });
    }

    const { university_uid } = await request.json();

    if (!university_uid) {
      return NextResponse.json({ message: "University UID is required." }, { status: 400 });
    }

    const res = await pool.query(
      "DELETE FROM partner_university WHERE university_uid = $1 RETURNING *",
      [university_uid]
    );

    if ((res.rowCount ?? 0) === 0) {
      return NextResponse.json({ message: "University not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Community "${res.rows[0].university_name}" deleted successfully.`,
    });
  } catch (error) {
    console.error("Admin Universities DELETE error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
