import assert from 'node:assert/strict';

import { suggestCompanyName } from '../src/utils/companyNameSuggestions';
import { validateCompanyName } from '../src/utils/companyNameValidation';

const suggestions = new Set<string>();
for (let index = 0; index < 20; index += 1) {
  const name = suggestCompanyName('', () => (index + 0.5) / 20);
  suggestions.add(name);
  const validation = validateCompanyName(name);
  assert.equal(validation.isValid, true, name);
  assert.equal(validation.displayName, name, 'Suggestions use the shared display normalization');
  assert.notEqual(suggestCompanyName(name, () => 0), name);
  assert.notEqual(suggestCompanyName(`  ${name}  `, () => 0.999999), name);
}
assert.equal(suggestions.size, 20);
assert.equal(suggestCompanyName('', () => 0), 'Kod Atölyesi');
assert.equal(suggestCompanyName('', () => 0.999999), 'Rota Yazılım');

let current = '';
for (let index = 0; index < 100; index += 1) {
  const next = suggestCompanyName(current, () => 0);
  assert.notEqual(next, current, 'Repeated dice presses change the draft even with identical random samples');
  current = next;
}

console.log('Company-name suggestion invariants passed.');
