const { Client } = require('pg');
require('dotenv').config();

async function fixBillParticipants() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to database...');

    // Update null values to 0
    const result = await client.query(
      'UPDATE bill_participants SET amount_owed = 0 WHERE amount_owed IS NULL',
    );

    console.log(
      `✅ Fixed ${result.rowCount} rows with null amount_owed values`,
    );

    // Verify the fix
    const checkResult = await client.query(
      'SELECT COUNT(*) as count FROM bill_participants WHERE amount_owed IS NULL',
    );

    console.log(`Remaining null values: ${checkResult.rows[0].count}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('Disconnected from database');
  }
}

fixBillParticipants();
