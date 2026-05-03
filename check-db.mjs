import Database from 'better-sqlite3';
const db = new Database('./local.db');
const count = db.prepare('SELECT COUNT(*) as count FROM bikes').get();
console.log('Bike count:', count.count);
process.exit(0);
