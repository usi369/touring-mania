// Generate clean SQL for D1 - INSERT statements only, no comments or empty lines
const fs = require('fs');
const path = require('path');

const bikes = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'bikes_data.json'), 'utf-8'));

const lines = [];
for (const b of bikes) {
  const name = b.name.replace(/'/g, "''");
  const maker = b.maker.replace(/'/g, "''");
  const photoUrl = (b.photoUrl || '').replace(/'/g, "''");
  lines.push(
    `INSERT INTO bikes (id, name, maker, category, cylinders, transmission, horsepower, fuelEfficiency, weight, seatHeight, totalLength, year, price, photoUrl) VALUES (${b.id}, '${name}', '${maker}', '${b.category}', '${b.cylinders}', '${b.transmission}', ${b.horsepower}, ${b.fuelEfficiency}, ${b.weight}, ${b.seatHeight}, ${b.totalLength}, ${b.year}, ${b.price}, '${photoUrl}');`
  );
}

const outputPath = path.join(__dirname, '..', 'scratch', 'd1_insert_bikes.sql');
fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8');
console.log(`Generated ${outputPath} (${lines.length} lines, no comments/empty lines)`);
