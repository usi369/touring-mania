import fs from 'fs';

const bikesData = JSON.parse(fs.readFileSync('./bikes_data.json', 'utf-8'));

let sql = "DELETE FROM bikes;\n";
for (const bike of bikesData) {
  const values = [
    bike.id,
    `'${bike.name.replace(/'/g, "''")}'`,
    `'${bike.maker.replace(/'/g, "''")}'`,
    `'${bike.category}'`,
    `'${bike.cylinders}'`,
    `'${bike.transmission}'`,
    bike.horsepower,
    bike.fuelEfficiency,
    bike.weight,
    bike.seatHeight,
    bike.totalLength,
    bike.year,
    bike.price
  ].join(', ');
  
  sql += `INSERT INTO bikes (id, name, maker, category, cylinders, transmission, horsepower, fuelEfficiency, weight, seatHeight, totalLength, year, price) VALUES (${values});\n`;
}

fs.writeFileSync('./seed_bikes.sql', sql);
console.log('Generated seed_bikes.sql');
