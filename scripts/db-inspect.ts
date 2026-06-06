import pool from "../src/database/pool";

async function inspect() {
  try {
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("Tables in database:");
    console.log(tablesRes.rows.map(r => r.table_name));

    // Also look for schemas of relevant tables
    for (const tableName of ['shop', 'product', 'product_comment', 'order_request', 'partner_university']) {
      const columnsRes = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
      `, [tableName]);
      console.log(`\nSchema for table ${tableName}:`);
      columnsRes.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'non-null'})`);
      });
    }
  } catch (err) {
    console.error("Inspection error:", err);
  } finally {
    await pool.end();
  }
}

inspect();
