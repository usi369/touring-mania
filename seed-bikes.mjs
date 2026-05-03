import Database from 'better-sqlite3';
import fs from 'fs';

const bikesData = JSON.parse(fs.readFileSync('./bikes_data.json', 'utf-8'));

async function seedBikes() {
  try {
    const db = new Database('./local.db');
    
    // Clear existing bikes
    db.prepare('DELETE FROM bikes').run();
    console.log('Cleared existing bike data');

    // Insert new bikes
    const insert = db.prepare(`
      INSERT INTO bikes (
        id, name, maker, category, cylinders, transmission,
        horsepower, fuelEfficiency, weight, seatHeight, totalLength, year, price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((bikes) => {
      for (const bike of bikes) {
        insert.run(
          bike.id,
          bike.name,
          bike.maker,
          bike.category,
          bike.cylinders,
          bike.transmission,
          bike.horsepower,
          bike.fuelEfficiency,
          bike.weight,
          bike.seatHeight,
          bike.totalLength,
          bike.year,
          bike.price
        );
      }
    });

    insertMany(bikesData);
    console.log(`Successfully seeded ${bikesData.length} bikes`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding bikes:', error);
    process.exit(1);
  }
}

seedBikes();
