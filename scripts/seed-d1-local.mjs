import fs from 'fs';
import { execSync } from 'child_process';

const bikesData = JSON.parse(fs.readFileSync('./bikes_data.json', 'utf-8'));
const DB_NAME = 'touring-mania-db';
const WRANGLER_PATH = '.\\node_modules\\.bin\\wrangler.cmd';

async function seedD1Local() {
  console.log(`Starting seed for ${DB_NAME} (Local)...`);

  try {
    // Clear existing data first
    console.log('Clearing existing bike data...');
    execSync(`${WRANGLER_PATH} d1 execute ${DB_NAME} --local --command="DELETE FROM bikes;"`, { stdio: 'inherit' });

    console.log(`Inserting ${bikesData.length} bikes in chunks...`);
    
    // Process in chunks to avoid command line length limits
    const chunkSize = 20;
    for (let i = 0; i < bikesData.length; i += chunkSize) {
      const chunk = bikesData.slice(i, i + chunkSize);
      let sql = 'INSERT INTO bikes (id, name, maker, category, cylinders, transmission, horsepower, fuelEfficiency, weight, seatHeight, totalLength, year, price, ownerName, ownerState, displacement, displacementUnit, engineType, photoUrl, isTokyoRemake, isR6Complete, isR7Mega, isR7Starter) VALUES ';
      
      const values = chunk.map(bike => {
        const photoUrl = bike.photoUrl ? `'${bike.photoUrl}'` : 'NULL';
        const ownerName = bike.ownerName ? `'${bike.ownerName.replace(/'/g, "''")}'` : 'NULL';
        const ownerState = bike.ownerState ? `'${bike.ownerState.replace(/'/g, "''")}'` : 'NULL';
        const displacement = bike.displacement ? `'${bike.displacement.replace(/'/g, "''")}'` : 'NULL';
        const displacementUnit = bike.displacementUnit ? `'${bike.displacementUnit.replace(/'/g, "''")}'` : 'NULL';
        const engineType = bike.engineType ? `'${bike.engineType.replace(/'/g, "''")}'` : 'NULL';
        return `(${bike.id}, '${bike.name.replace(/'/g, "''")}', '${bike.maker.replace(/'/g, "''")}', '${bike.category}', '${bike.cylinders}', '${bike.transmission}', ${bike.horsepower}, ${bike.fuelEfficiency}, ${bike.weight}, ${bike.seatHeight}, ${bike.totalLength}, ${bike.year}, ${bike.price}, ${ownerName}, ${ownerState}, ${displacement}, ${displacementUnit}, ${engineType}, ${photoUrl}, ${bike.isTokyoRemake ? 1 : 0}, ${bike.isR6Complete ? 1 : 0}, ${bike.isR7Mega ? 1 : 0}, ${bike.isR7Starter ? 1 : 0})`;
      }).join(', ');
      
      sql += values + ';';
      
      console.log(`Executing chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(bikesData.length / chunkSize)}...`);
      // Escape double quotes for shell
      const escapedSql = sql.replace(/"/g, '\\"');
      execSync(`${WRANGLER_PATH} d1 execute ${DB_NAME} --local --command="${escapedSql}"`, { stdio: 'inherit' });
    }

    console.log('Successfully seeded D1 local database.');
  } catch (error) {
    console.error('Error seeding D1 local:', error);
    process.exit(1);
  }
}

seedD1Local();
