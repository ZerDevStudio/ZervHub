import fs from 'fs';
import path from 'path';

const trPath = path.resolve('src/renderer/src/locales/tr.json');
const enPath = path.resolve('src/renderer/src/locales/en.json');

const tr = JSON.parse(fs.readFileSync(trPath, 'utf-8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));

function flattenKeys(obj, prefix = '') {
  let res = {};
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(res, flattenKeys(v, full));
    } else {
      res[full] = v;
    }
  }
  return res;
}

const trFlat = flattenKeys(tr);
const enFlat = flattenKeys(en);

const trKeys = new Set(Object.keys(trFlat));
const enKeys = new Set(Object.keys(enFlat));

const missingInTr = [...enKeys].filter((k) => !trKeys.has(k));
const missingInEn = [...trKeys].filter((k) => !enKeys.has(k));

console.log('=== DESKTOP LOCALES AUDIT ===');
console.log('Total tr keys:', trKeys.size);
console.log('Total en keys:', enKeys.size);
console.log('Missing in TR count:', missingInTr.length, missingInTr.slice(0, 5));
console.log('Missing in EN count:', missingInEn.length, missingInEn.slice(0, 5));

const placeholderMismatches = [];
const identicalValues = [];

for (const k of trKeys) {
  if (enKeys.has(k)) {
    const trVal = String(trFlat[k]);
    const enVal = String(enFlat[k]);

    const trMatches = (trVal.match(/\{+[^{}]+\}+/g) || []).sort();
    const enMatches = (enVal.match(/\{+[^{}]+\}+/g) || []).sort();

    if (trMatches.join(',') !== enMatches.join(',')) {
      placeholderMismatches.push({
        key: k,
        tr: trMatches,
        en: enMatches,
        trVal,
        enVal,
      });
    }

    if (
      trVal.length > 8 &&
      trVal.toLowerCase() === enVal.toLowerCase() &&
      !/^https?:\/\//.test(trVal) &&
      !/^[A-Z0-9_\-\.\:\/\s]+$/.test(trVal) &&
      !/^(true|false|null|undefined)$/i.test(trVal)
    ) {
      identicalValues.push({ key: k, value: trVal });
    }
  }
}

console.log('Placeholder mismatches count:', placeholderMismatches.length);
if (placeholderMismatches.length > 0) {
  console.log('Placeholder mismatches:', JSON.stringify(placeholderMismatches, null, 2));
}

console.log('Identical strings count (>8 chars):', identicalValues.length);
if (identicalValues.length > 0) {
  console.log('Identical strings sample:', JSON.stringify(identicalValues.slice(0, 20), null, 2));
}
