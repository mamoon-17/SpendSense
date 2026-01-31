/**
 * Reset Categories Script
 *
 * This script deletes all existing categories and lets the seed service
 * recreate them with the new simplified list (no emojis, fewer categories).
 *
 * Run this script with: node reset-categories.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = path.join(
  __dirname,
  process.env.SQLITE_DB_PATH || 'spendsense.sqlite',
);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database:', dbPath);
});

db.serialize(() => {
  // First, set category references to NULL in budgets and expenses
  console.log('Removing category references from budgets...');
  db.run('UPDATE budgets SET category_id = NULL', function (err) {
    if (err) console.error('Error updating budgets:', err.message);
    else console.log(`Updated ${this.changes} budgets.`);
  });

  console.log('Removing category references from expenses...');
  db.run('UPDATE expenses SET category_id = NULL', function (err) {
    if (err) console.error('Error updating expenses:', err.message);
    else console.log(`Updated ${this.changes} expenses.`);
  });

  // Delete all categories
  console.log('Deleting all categories...');
  db.run('DELETE FROM categories', function (err) {
    if (err) console.error('Error deleting categories:', err.message);
    else console.log(`Deleted ${this.changes} categories.`);

    console.log('\nCategories reset complete!');
    console.log('Restart your backend server to seed new categories.');

    db.close();
  });
});
