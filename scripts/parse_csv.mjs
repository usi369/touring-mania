import fs from 'fs';
import { parse } from 'csv-parse/sync';

const csvData = fs.readFileSync('./master/bikes.csv', 'utf-8');
const records = parse(csvData, {
  columns: true,
  skip_empty_lines: true
});

const bikes = [];

for (const row of records) {
  if (row['除外'] === '除外') continue;
  if (row['管理id'] === '-') continue;
  
  const idStr = row['管理id'];
  if (!idStr || !idStr.match(/^\d+$/)) continue;

  const id = parseInt(idStr, 10);
  
  // Extract edition flags
  const isTokyoRemake = row['トウキョウリメイク'] === '◆';
  const isR6Complete = (row['アクアマリン'] !== '' || row['ルビー'] !== '');
  const isR7Mega = row['R7新年会版'] === '○' || row['R7新年会版'] === '〇';
  const isR7Starter = row['R7正式版'] === '〇' || row['R7正式版'] === '○';
  
  if (!isTokyoRemake && !isR6Complete && !isR7Mega && !isR7Starter) {
    continue; // not in any edition
  }

  // Parse other fields
  const maker = row['_メーカーAlph'];
  const name = row['車種2'] ? `${row['車種1']} ${row['車種2']}` : row['車種1'];
  
  const bgClass = row['pass_bg_class'] || '';
  let category = 'small';
  if (bgClass.includes('large')) category = 'large';
  else if (bgClass.includes('medium')) category = 'medium';

  const cylindersMap = {
    '単': '1', '1': '1', '2': '2', '3': '3', '4': '4', '6': '6'
  };
  let cylinders = cylindersMap[row['気筒数']] || row['気筒数'];
  if (!cylinders) cylinders = '1';

  const transmission = row['ミッション'] === 'AT' ? 'AT' : 'MT';
  
  const horsepower = parseInt(row['馬力ps'], 10) || 0;
  const fuelEfficiency = parseInt(row['燃費km/l'], 10) || 0;
  const weight = parseInt(row['車重kg'], 10) || parseInt(row['装備重量'], 10) || 0;
  const seatHeight = parseInt(row['シートmm'], 10) || 0;
  const totalLength = parseInt(row['全長mm'], 10) || 0;
  const year = parseInt(row['年式year'], 10) || 0;
  const priceYen = parseInt(row['税込価格yen'], 10) || 0;
  const price = Math.round(priceYen / 10000);
  const ownerName = row['なまえ'] || '';
  const ownerState = row['都道府県'] || '';
  const displacement = row['排気量'] || '';
  const displacementUnit = row['排気量単位'] || '';
  const engineType = row['エンジンモーター'] || '';
  
  const formattedId = String(id).padStart(4, '0');
  const photoUrl = `https://pub-4f701e7dd07e451ca0cfc163b0291e5d.r2.dev/bike_${formattedId}.jpg`;

  bikes.push({
    id,
    name,
    maker,
    category,
    cylinders,
    transmission,
    horsepower,
    fuelEfficiency,
    weight,
    seatHeight,
    totalLength,
    year,
    price,
    ownerName,
    ownerState,
    displacement,
    displacementUnit,
    engineType,
    photoUrl,
    isTokyoRemake,
    isR6Complete,
    isR7Mega,
    isR7Starter
  });
}

fs.writeFileSync('./bikes_data.json', JSON.stringify(bikes, null, 2));
console.log(`Generated bikes_data.json with ${bikes.length} records.`);
