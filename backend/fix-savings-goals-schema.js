const { Client } = require('pg');
require('dotenv').config();

async function fixSavingsGoalsSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to database...');

    // Check if auto_save column exists
    const checkAutoSave = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='savings_goals' AND column_name='auto_save'
    `);

    if (checkAutoSave.rows.length === 0) {
      console.log('Adding auto_save column...');
      await client.query(`
        ALTER TABLE savings_goals 
        ADD COLUMN auto_save BOOLEAN DEFAULT false
      `);
      console.log('✅ Added auto_save column');
    } else {
      console.log('✅ auto_save column already exists');
    }

    // Check if status column exists
    const checkStatus = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='savings_goals' AND column_name='status'
    `);

    if (checkStatus.rows.length === 0) {
      console.log('Creating status enum type...');

      // Check if enum type exists
      const checkEnum = await client.query(`
        SELECT 1 FROM pg_type WHERE typname = 'savings_goals_status_enum'
      `);

      if (checkEnum.rows.length === 0) {
        await client.query(`
          CREATE TYPE savings_goals_status_enum AS ENUM ('active', 'completed', 'behind', 'on_track', 'overdue')
        `);
        console.log('✅ Created status enum type');
      }

      console.log('Adding status column...');
      await client.query(`
        ALTER TABLE savings_goals 
        ADD COLUMN status savings_goals_status_enum DEFAULT 'active'
      `);
      console.log('✅ Added status column');
    } else {
      console.log('✅ status column already exists');
    }

    // Check if created_at column exists
    const checkCreatedAt = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='savings_goals' AND column_name='created_at'
    `);

    if (checkCreatedAt.rows.length === 0) {
      console.log('Adding created_at column...');
      await client.query(`
        ALTER TABLE savings_goals 
        ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('✅ Added created_at column');
    } else {
      console.log('✅ created_at column already exists');
    }

    // Check if updated_at column exists
    const checkUpdatedAt = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='savings_goals' AND column_name='updated_at'
    `);

    if (checkUpdatedAt.rows.length === 0) {
      console.log('Adding updated_at column...');
      await client.query(`
        ALTER TABLE savings_goals 
        ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('✅ Added updated_at column');
    } else {
      console.log('✅ updated_at column already exists');
    }

    console.log('\n🎉 Schema migration completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
    console.log('Disconnected from database');
  }
}

fixSavingsGoalsSchema();
