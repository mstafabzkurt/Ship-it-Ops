const assert = require('node:assert/strict');
const { existsSync, readFileSync, statSync } = require('node:fs');
const { resolve } = require('node:path');

const root = resolve(__dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

const assetsSource = read('src/config/rankAssets.ts');
const rankIconSource = read('src/components/rank/RankIcon.tsx');
const progressionSource = read('src/config/progression.ts');

for (const tier of ['junior', 'engineer', 'senior', 'lead', 'manager', 'director', 'cto']) {
  assert.match(assetsSource, new RegExp(`\\b${tier}:`), `Rank asset mapping is missing ${tier}`);
}

for (const tier of ['junior', 'engineer', 'senior', 'lead', 'manager', 'director', 'cto']) {
  const asset = `${tier}-v2-256.png`;
  const assetPath = resolve(root, 'assets/rank', asset);
  const originalPath = resolve(root, 'assets/rank', `${tier}-v2.png`);
  assert.ok(existsSync(assetPath), `Missing rank artwork: ${asset}`);
  assert.ok(existsSync(originalPath), `Missing original rank artwork: ${tier}-v2.png`);
  assert.ok(
    assetsSource.includes(`${tier}: require('../../assets/rank/${asset}')`),
    `Rank asset mapping does not reference ${asset} for ${tier}`,
  );
  const png = readFileSync(assetPath);
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${asset} must be a PNG`);
  assert.equal(png.subarray(12, 16).toString('ascii'), 'IHDR', `${asset} must have a PNG header`);
  assert.equal(png.readUInt32BE(16), 256, `${asset} must be 256 pixels wide`);
  assert.equal(png.readUInt32BE(20), 256, `${asset} must be 256 pixels high`);
  assert.equal(png[24], 8, `${asset} must use 8-bit channels`);
  assert.equal(png[25], 6, `${asset} must retain an RGBA alpha channel`);
  assert.ok(statSync(assetPath).size < statSync(originalPath).size / 4, `${asset} must be substantially smaller than its original`);
}

assert.ok(rankIconSource.includes('source ?') && rankIconSource.includes("'ribbon-outline'"), 'Unknown or absent rank artwork must render a safe fallback');

const expectedThresholds = '0,500,1200,2000,3200,4800,7000,9500,12500,16000,20000,24500,29500,35000,41000,47500,54500,62000,70000,79000,89000';
const thresholds = [...progressionSource.matchAll(/threshold:\s*(\d+)/g)].map((match) => Number(match[1])).join(',');
assert.equal(thresholds, expectedThresholds, 'Rank order or Career XP thresholds changed');

for (const path of [
  'src/components/reputation/ReputationSummaryCard.tsx',
  'src/components/reputation/RankTierCard.tsx',
  'src/components/dashboard/CareerSummaryCard.tsx',
  'src/components/profile/ProfileSummaryCard.tsx',
  'app/public-profile/[userId].tsx',
]) {
  assert.ok(read(path).includes('RankIcon'), `${path} must use the shared rank icon component`);
}

console.log('Rank icon invariants passed.');
