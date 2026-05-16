import Database from 'better-sqlite3';

const db = new Database('./local.db');

console.log('Adding missing columns to bikes table...');

try {
  // Check existing columns
  const columns = db.prepare('PRAGMA table_info(bikes)').all().map(c => c.name);
  
  const missingColumns = [
    { name: 'photoUrl', type: 'TEXT' },
    { name: 'isTokyoRemake', type: 'INTEGER DEFAULT 0' },
    { name: 'isR6Complete', type: 'INTEGER DEFAULT 0' },
    { name: 'isR7Mega', type: 'INTEGER DEFAULT 0' },
    { name: 'isR7Starter', type: 'INTEGER DEFAULT 0' }
  ];

  for (const col of missingColumns) {
    if (!columns.includes(col.name)) {
      console.log(`Adding column ${col.name}...`);
      db.prepare(`ALTER TABLE bikes ADD COLUMN ${col.name} ${col.type}`).run();
    } else {
      console.log(`Column ${col.name} already exists.`);
    }
  }

  console.log('Successfully updated bikes table schema.');
} catch (error) {
  console.error('Error updating schema:', error);
  process.exit(1);
}

process.exit(0);
