import Database from 'better-sqlite3';
const db = new Database('./local.db');
const cylinders = db.prepare('SELECT DISTINCT cylinders FROM bikes').all();
console.log('Distinct cylinders:', cylinders);
process.exit(0);

