/**
 * CSV → bikes_data.json 変換スクリプト（プレビューモード）
 * 
 * 条件:
 * - F列（R7正式版）に値があるもののみ取り込み
 * - 「除外」列に「除外」があるものは除外
 * - 管理idが「-」のものは除外
 * 
 * 実行: node scratch/convert_csv.cjs [--apply]
 *   引数なし: プレビューのみ（bikes_data.json は生成しない）
 *   --apply:  bikes_data.json を生成する
 */
const fs = require('fs');
const path = require('path');

// ---- CSV Parser (handles quoted fields with newlines) ----
function parseCSV(text) {
  const rows = [];
  let i = 0;
  while (i < text.length) {
    const row = [];
    while (i < text.length) {
      if (text[i] === '"') {
        // Quoted field
        i++; // skip opening quote
        let field = '';
        while (i < text.length) {
          if (text[i] === '"') {
            if (i + 1 < text.length && text[i + 1] === '"') {
              field += '"';
              i += 2;
            } else {
              i++; // skip closing quote
              break;
            }
          } else {
            field += text[i];
            i++;
          }
        }
        row.push(field);
        // Skip comma or end of line
        if (i < text.length && text[i] === ',') i++;
        else if (i < text.length && (text[i] === '\r' || text[i] === '\n')) {
          if (text[i] === '\r' && i + 1 < text.length && text[i + 1] === '\n') i += 2;
          else i++;
          break;
        }
      } else {
        // Unquoted field
        let field = '';
        while (i < text.length && text[i] !== ',' && text[i] !== '\r' && text[i] !== '\n') {
          field += text[i];
          i++;
        }
        row.push(field);
        if (i < text.length && text[i] === ',') i++;
        else if (i < text.length && (text[i] === '\r' || text[i] === '\n')) {
          if (text[i] === '\r' && i + 1 < text.length && text[i + 1] === '\n') i += 2;
          else i++;
          break;
        }
      }
    }
    if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
      rows.push(row);
    }
  }
  return rows;
}

// ---- Column indices (0-based) ----
const COL = {
  管理id: 0,
  R7正式版: 5,
  除外: 6,
  メーカーAlph: 32,
  車種1: 34,
  車種2: 35,
  馬力ps: 36,
  燃費kml: 37,
  シートmm: 39,
  全長mm: 40,
  車重kg: 43,
  税込価格yen: 48,
  年式year: 50,
  ミッション: 54,
  気筒数: 55,
  pass_bg_class: 60,
};

const R2_BASE_URL = 'https://pub-4f701e7dd07e451ca0cfc163b0291e5d.r2.dev';

function getCategoryFromBgClass(bgClass) {
  if (!bgClass) return 'medium';
  if (bgClass.includes('large')) return 'large';
  if (bgClass.includes('small')) return 'small';
  if (bgClass.includes('medium')) return 'medium';
  return 'medium';
}

function parsePrice(val) {
  if (!val) return 0;
  // Remove commas and whitespace
  const cleaned = val.replace(/[,\s]/g, '');
  const num = parseInt(cleaned, 10);
  if (isNaN(num)) return 0;
  return num;
}

function parseInt2(val) {
  if (!val) return 0;
  const cleaned = val.replace(/[,\s]/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

// ---- Main ----
const csvPath = path.join(__dirname, '..', 'master', 'bikes.csv');
const outputPath = path.join(__dirname, '..', 'bikes_data.json');
const applyMode = process.argv.includes('--apply');

const csvText = fs.readFileSync(csvPath, 'utf-8');
const rows = parseCSV(csvText);

console.log(`CSV読み込み完了: ${rows.length} 行`);
console.log(`ヘッダー列数: ${rows[0].length}`);
console.log('');

// Skip header row
const header = rows[0];
const dataRows = rows.slice(1);

// Filter
const filtered = dataRows.filter(row => {
  const id = (row[COL.管理id] || '').trim();
  const r7 = (row[COL.R7正式版] || '').trim();
  const exclude = (row[COL.除外] || '').trim();
  
  // Skip if id is "-" or empty
  if (id === '-' || id === '') return false;
  // Skip if 除外
  if (exclude === '除外') return false;
  // Only include if R7正式版 is 〇
  if (r7 !== '〇' && r7 !== '○') return false;
  
  return true;
});

console.log(`フィルタ後: ${filtered.length} 件`);
console.log('');

// Convert to bike objects
const bikes = [];
let idCounter = 1;

for (const row of filtered) {
  const name1 = (row[COL.車種1] || '').trim();
  const name2 = (row[COL.車種2] || '').trim();
  const fullName = name2 ? `${name1} ${name2}` : name1;
  
  const bike = {
    id: idCounter++,
    originalId: (row[COL.管理id] || '').trim(),
    name: fullName,
    maker: (row[COL.メーカーAlph] || '').trim(),
    category: getCategoryFromBgClass((row[COL.pass_bg_class] || '').trim()),
    cylinders: (row[COL.気筒数] || '1').trim(),
    transmission: (row[COL.ミッション] || 'MT').trim(),
    horsepower: parseInt2(row[COL.馬力ps]),
    fuelEfficiency: parseInt2(row[COL.燃費kml]),
    weight: parseInt2(row[COL.車重kg]),
    seatHeight: parseInt2(row[COL.シートmm]),
    totalLength: parseInt2(row[COL.全長mm]),
    year: parseInt2(row[COL.年式year]),
    price: parsePrice(row[COL.税込価格yen]),
    photoUrl: `${R2_BASE_URL}/bike_${(row[COL.管理id] || '').trim()}.jpg`,
  };
  
  bikes.push(bike);
}

// Validation
console.log('=== データ検証 ===');
const issues = [];
for (const b of bikes) {
  const missing = [];
  if (!b.name) missing.push('車種名');
  if (!b.maker) missing.push('メーカー');
  if (b.horsepower === 0) missing.push('馬力');
  if (b.fuelEfficiency === 0) missing.push('燃費');
  if (b.weight === 0) missing.push('車重');
  if (b.seatHeight === 0) missing.push('シート高');
  if (b.totalLength === 0) missing.push('全長');
  if (b.year === 0) missing.push('年式');
  if (b.price === 0) missing.push('価格');
  if (missing.length > 0) {
    issues.push({ id: b.id, originalId: b.originalId, name: b.name, missing });
  }
}

if (issues.length > 0) {
  console.log(`\n警告: ${issues.length} 件のデータに欠損があります:`);
  for (const issue of issues) {
    console.log(`  [${issue.originalId}] ${issue.name} → 欠損: ${issue.missing.join(', ')}`);
  }
}

// Stats
const categories = { large: 0, medium: 0, small: 0 };
const makers = {};
for (const b of bikes) {
  categories[b.category] = (categories[b.category] || 0) + 1;
  makers[b.maker] = (makers[b.maker] || 0) + 1;
}

console.log('\n=== 統計 ===');
console.log(`合計: ${bikes.length} 枚`);
console.log(`カテゴリ: 大型=${categories.large}, 中型=${categories.medium}, 小型=${categories.small}`);
console.log(`メーカー: ${Object.entries(makers).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}(${v})`).join(', ')}`);

// Preview - all records
console.log('\n=== 全件プレビュー ===');
for (const b of bikes) {
  console.log(`[${b.originalId}] ${b.name} | ${b.maker} | HP:${b.horsepower} | 燃費:${b.fuelEfficiency} | 車重:${b.weight} | シート高:${b.seatHeight} | 全長:${b.totalLength} | 年式:${b.year} | 価格:${b.price}万 | ${b.transmission} | ${b.cylinders}気筒 | ${b.category}`);
}

if (applyMode) {
  // Remove originalId before saving
  const output = bikes.map(({ originalId, ...rest }) => rest);
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n✅ bikes_data.json に ${output.length} 件を出力しました`);
} else {
  console.log('\n⚠️  プレビューモードです。実際にファイルを生成するには --apply オプションを付けて実行してください:');
  console.log('   node scratch/convert_csv.cjs --apply');
}
