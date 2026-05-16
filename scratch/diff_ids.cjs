const fs = require('fs');

function parseCSV(t) {
  const r = [];
  let i = 0;
  while (i < t.length) {
    const w = [];
    while (i < t.length) {
      if (t[i] === '"') {
        i++;
        let f = '';
        while (i < t.length) {
          if (t[i] === '"') {
            if (i + 1 < t.length && t[i + 1] === '"') { f += '"'; i += 2; }
            else { i++; break; }
          } else { f += t[i]; i++; }
        }
        w.push(f);
        if (i < t.length && t[i] === ',') i++;
        else if (i < t.length && (t[i] === '\r' || t[i] === '\n')) {
          if (t[i] === '\r' && i + 1 < t.length && t[i + 1] === '\n') i += 2; else i++;
          break;
        }
      } else {
        let f = '';
        while (i < t.length && t[i] !== ',' && t[i] !== '\r' && t[i] !== '\n') { f += t[i]; i++; }
        w.push(f);
        if (i < t.length && t[i] === ',') i++;
        else if (i < t.length && (t[i] === '\r' || t[i] === '\n')) {
          if (t[i] === '\r' && i + 1 < t.length && t[i + 1] === '\n') i += 2; else i++;
          break;
        }
      }
    }
    if (w.length > 1 || (w.length === 1 && w[0] !== '')) r.push(w);
  }
  return r;
}

const csv = fs.readFileSync('master/bikes.csv', 'utf-8');
const rows = parseCSV(csv).slice(1);
const ids = rows.filter(r => {
  const id = (r[0] || '').trim();
  const r7 = (r[5] || '').trim();
  const ex = (r[6] || '').trim();
  return id !== '-' && id !== '' && ex !== '除外' && r7 !== '';
}).map(r => (r[0] || '').trim());

console.log('Script IDs (' + ids.length + '):');
console.log(ids.join(', '));

const userIds = ['0001','0006','0009','0028','0105','0106','0109','0121','0136','0139','0145','0149','0151','0153','0154','0158','0164','0165','0175','0176','0177','0178','0179','0180','0181','0182','0183','0184','0185','0186','0187','0188'];
const extra = ids.filter(i => !userIds.includes(i));
const missing = userIds.filter(i => !ids.includes(i));
console.log('Extra (script has, user does not): ' + JSON.stringify(extra));
console.log('Missing (user has, script does not): ' + JSON.stringify(missing));
