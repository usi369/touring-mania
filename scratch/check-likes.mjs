import Database from 'better-sqlite3';

const db = new Database('local.db');
try {
  const row = db.prepare('SELECT * FROM likes').all();
  console.log('Likes table data:', row);
} catch (e) {
  console.error('Error reading likes table:', e.message);
}
db.close();
