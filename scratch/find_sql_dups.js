import fs from 'fs';
const content = fs.readFileSync('seed_bikes.sql', 'utf8');
const regex = /VALUES\s*\(\s*(\d+)\s*,/g;
const ids = [];
let match;
while ((match = regex.exec(content)) !== null) {
  ids.push(parseInt(match[1]));
}

const counts = {};
ids.forEach(id => {
  counts[id] = (counts[id] || 0) + 1;
});

const duplicates = Object.keys(counts).filter(id => counts[id] > 1);
if (duplicates.length > 0) {
  console.log('Duplicate IDs found:');
  duplicates.forEach(id => {
    console.log(`ID ${id}: ${counts[id]} times`);
  });
} else {
  console.log('No duplicate IDs found in seed_bikes.sql');
}
