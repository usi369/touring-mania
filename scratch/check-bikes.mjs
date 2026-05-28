import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve('C:/Antigravity/touring-mania (1)/local.db');
const db = new Database(dbPath);

console.log('--- bikes table check ---');
const tmax = db.prepare("SELECT * FROM bikes WHERE name LIKE '%TMAX%'").all();
console.log('TMAX:', tmax);

const madass = db.prepare("SELECT * FROM bikes WHERE name LIKE '%MadAss%'").all();
console.log('MadAss:', madass);
