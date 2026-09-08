const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const root = resolve(__dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

const assetsSource = read('src/config/rankAssets.ts');
const rankIconSource = read('src/components/rank/RankIcon.tsx');
const progressionSource = read('src/config/progression.ts');

for (const tier of ['junior', 'engineer', 'senior', 'lead', 'manager', 'director', 'cto']) {
  assert.match(assetsSource, new RegExp(`\\b${tier}:`), `Rank asset mapping is missing ${tier}`);
}

for (const asset of ['muh.png', 'senior.png', 'teamlead.png', 'manager.png', 'director.png', 'cto.png']) {
  assert.ok(existsSync(resolve(root, 'assets/rank', asset)), `Missing rank artwork: ${asset}`);
  assert.ok(assetsSource.includes(`assets/rank/${asset}`), `Rank asset mapping does not reference ${asset}`);
}

assert.ok(assetsSource.includes('junior: null'), 'Junior must retain its safe fallback while junior.png is absent');
assert.ok(rankIconSource.includes('source ?') && rankIconSource.includes("'ribbon-outline'"), 'Unknown or absent rank artwork must render a safe fallback');

const expectedThresholds = '0,500,1200,2000,3200,4800,7000,9500,12500,16000,20000,24500,29500,35000,41000,47500,54500,62000,70000,79000,89000';
const thresholds = [...progressionSource.matchAll(/threshold:\s*(\d+)/g)].map((match) => Number(match[1])).join(',');
assert.equal(thresholds, expectedThresholds, 'Rank order or Career XP thresholds changed');

for (const path of [
  'src/components/reputation/ReputationSummaryCard.tsx',
  'src/components/reputation/RankTierCard.tsx',
  'src/components/dashboard/CareerSummaryCard.tsx',
  'src/components/profile/ProfileSummaryCard.tsx',
]) {
  assert.ok(read(path).includes('RankIcon'), `${path} must use the shared rank icon component`);
}

console.log('Rank icon invariants passed.');
