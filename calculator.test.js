const assert = require('node:assert/strict');
const test = require('node:test');
const { calculate, paymentReference } = require('./calculator.js');

const defaults = { route: 'full', count: 1, group: 'men', ownOveralls: false, extras: [] };

test('Vollfahrer includes the required costume items for men', () => {
  const result = calculate({ ...defaults, count: 9 });
  assert.equal(result.complete, true);
  assert.equal(result.total, 30200);
  assert.deepEqual(result.lines.map(line => line.reference), ['Vollfahrer', 'Hemd', 'Gürtel', 'Latzhose', 'Spielzeug']);
  assert.equal(calculate({ ...defaults, ownOveralls: true }).total, 27700);
});

test('one to nine single parades cost €35 each with no shirt or overalls for women', () => {
  for (let count = 1; count <= 9; count++) {
    const result = calculate({ ...defaults, route: 'single', count, group: 'women' });
    assert.equal(result.complete, true);
    assert.equal(result.total, count * 3500 + 2300);
    assert.equal(result.lines[0].reference, `${count} ${count === 1 ? 'Umzug' : 'Umzüge'}`);
  }
});

test('extras use their exact prices and appear in the payment reference', () => {
  const extras = ['cap', 'vest', 'fleece', 'polo'];
  const women = calculate({ ...defaults, route: 'single', count: 3, group: 'women', extras });
  assert.equal(women.total, 22350);
  assert.deepEqual(women.lines.slice(3).map(line => line.cents), [800, 3300, 2750, 2700]);
  assert.equal(calculate({ ...defaults, extras }).total, 39850);
  assert.equal(paymentReference('  Alex  Muster  ', women),
    'Alex Muster - 3 Umzüge, Gürtel, Spielzeug, Mütze, Weste, Fleecepullover, Polo Damen');
  assert.equal(paymentReference(' ', women), '');
});

test('incomplete selections have no payment reference', () => {
  for (const incomplete of [{ route: null }, { group: null }, { route: 'single', count: 0 },
    { route: 'single', count: 10 }, { route: 'single', count: 1.5 }]) {
    const result = calculate({ ...defaults, ...incomplete });
    assert.equal(result.complete, false);
    assert.equal(paymentReference('Alex Muster', result), '');
  }
});
