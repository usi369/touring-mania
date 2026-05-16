import Database from 'better-sqlite3';
const db = new Database('./local.db');
const columns = db.prepare('PRAGMA table_info(bikes)').all();
console.log('Bikes columns:', columns.map(c => c.name).join(', '));
process.exit(0);
