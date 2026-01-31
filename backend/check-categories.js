const path = require('path');
const Database = require(path.join(__dirname, 'node_modules/better-sqlite3'));
const db = new Database('./spendsense.sqlite');

const categories = db
  .prepare('SELECT * FROM categories WHERE is_custom = 1')
  .all();
console.log('Custom categories:');
console.log(JSON.stringify(categories, null, 2));

const allCategories = db
  .prepare('SELECT id, name, type, is_custom, created_by FROM categories')
  .all();
console.log('\nAll categories:');
console.log(JSON.stringify(allCategories, null, 2));

db.close();
