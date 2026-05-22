import pool from "../pool";

async function addColumnIfMissing() {
  const client = await pool.connect();
  try {
    // Customer OAuth popup: ensure users can store a university choice.
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS university_uid VARCHAR(50)`);

    await client.query(`UPDATE users SET university_uid = NULL WHERE university_uid IS NULL`);

    // Add the FK only once, and only if the partner table exists.
    await client.query(`DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_university_uid_fkey'
      ) THEN
        BEGIN
          PERFORM 1 FROM pg_tables WHERE tablename = 'partner_university';
          IF FOUND THEN
            ALTER TABLE users
            ADD CONSTRAINT users_university_uid_fkey FOREIGN KEY (university_uid) REFERENCES partner_university(university_uid) ON DELETE SET NULL;
          END IF;
        END;
      END IF;
    END$$;
    `);

    // Shop assignment popup: sid_pdf_url is currently required in the table,
    // but the assignment flow starts without a file, so default it safely.
    await client.query(`ALTER TABLE IF EXISTS shop_join_university ALTER COLUMN sid_pdf_url SET DEFAULT ''`);
    await client.query(`UPDATE shop_join_university SET sid_pdf_url = '' WHERE sid_pdf_url IS NULL`);

    console.log('Migration complete: university columns/defaults ensured');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

addColumnIfMissing();
