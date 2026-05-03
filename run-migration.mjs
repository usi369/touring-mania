import { createConnection } from 'mysql2/promise';
import fs from 'fs';

async function runMigration() {
  let connection;
  try {
    console.log('Connecting to database...');
    
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const url = new URL(dbUrl);
    const config = {
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      port: url.port || 3306,
      ssl: { rejectUnauthorized: false },
    };

    connection = await createConnection(config);
    console.log('Connected to database');

    // Read and execute latest migration SQL
    const migrationSql = fs.readFileSync('./drizzle/0003_melodic_leopardon.sql', 'utf-8');
    
    console.log('Executing migration...');
    // Split by statement separator and execute each statement
    const statements = migrationSql.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s);
    for (const statement of statements) {
      await connection.execute(statement);
    }
    console.log('Migration completed successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();
