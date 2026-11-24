'use strict';

const items = {
  full: ['Vollfahrer', 22500],
  single: ['Einzelne Umzüge', 3500],
  shirt: ['Hemd', 2900],
  belt: ['Gürtel', 1800],
  overalls: ['Latzhose', 2500],
  toy: ['Spielzeug (Hammer & Co.)', 500, 'Spielzeug'],
  cap: ['Gelbe Mütze', 800, 'Mütze'],
  vest: ['BIG-FOOT CLUB Weste (ärmellos)', 3300, 'Weste'],
  fleece: ['BIG-FOOT CLUB Fleecepullover', 2750, 'Fleecepullover'],
  menPolo: ['BIG-FOOT CLUB Polo mit Logo (Herren)', 2800, 'Polo Herren'],
  womenPolo: ['BIG-FOOT CLUB Polo mit Logo (Damen)', 2700, 'Polo Damen'],
};

function calculate({ route, count, group, ownOveralls, extras }) {
  const lines = [];
  const hasCount = route === 'single' && Number.isInteger(count) && count >= 1 && count <= 9;
  const hasGroup = group === 'men' || group === 'women';

  function add(key, quantity = 1, wording) {
    const [label, cents, shortLabel = label] = items[key];
    lines.push({ label: wording ?? label, cents: cents * quantity, reference: wording ?? shortLabel });
  }

  if (route === 'full') add('full');
  if (hasCount) add('single', count, `${count} ${count === 1 ? 'Umzug' : 'Umzüge'}`);
  if (group === 'men') add('shirt');
  add('belt');
  if (group === 'men' && !ownOveralls) add('overalls');
  add('toy');
  for (const extra of ['cap', 'vest', 'fleece']) {
    if (extras.includes(extra)) add(extra);
  }
  if (hasGroup && extras.includes('polo')) add(`${group}Polo`);

  return {
    lines,
    total: lines.reduce((total, { cents }) => total + cents, 0),
    complete: hasGroup && (route === 'full' || hasCount),
  };
}

function paymentReference(name, { complete, lines }) {
  const payer = name.trim().replace(/\s+/g, ' ');
  return complete && payer ? `${payer} - ${lines.map(line => line.reference).join(', ')}` : '';
}

if (typeof module !== 'undefined') module.exports = { calculate, paymentReference };

if (typeof document !== 'undefined') {
  const byId = id => document.getElementById(id);
  const form = byId('choices');
  const payer = byId('payer');
  const purpose = byId('purpose');
  const copy = byId('copy');
  const copyStatus = byId('copy-status');
  const euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
  const money = cents => euro.format(cents / 100);

  for (const label of document.querySelectorAll('[data-price]')) {
    label.textContent = money(items[label.dataset.price][1]);
  }
  const poloOptions = byId('polo-options');
  poloOptions.textContent = `Herren ${money(items.menPolo[1])} · Damen ${money(items.womenPolo[1])}`;

  function render() {
    const data = new FormData(form);
    const route = data.get('route');
    const group = data.get('group');
    const ownOveralls = data.has('ownOveralls');
    const result = calculate({
      route, count: Number(data.get('count')), group, ownOveralls, extras: data.getAll('extra'),
    });

    byId('count-option').hidden = route !== 'single';
    byId('shirt').hidden = group !== 'men';
    byId('overalls-option').hidden = group !== 'men';
    byId('overalls').hidden = group !== 'men' || ownOveralls;
    poloOptions.hidden = Boolean(group);
    byId('polo-price').textContent = group ? money(items[`${group}Polo`][1]) : '';

    byId('breakdown').replaceChildren(...result.lines.map(({ label, cents }) => {
      const line = document.createElement('li');
      const amount = document.createElement('strong');
      amount.textContent = money(cents);
      line.append(label, amount);
      return line;
    }));
    byId('total').value = result.complete ? money(result.total) : '–';
    byId('missing-choices').hidden = result.complete;
    purpose.value = paymentReference(payer.value, result);
    copy.disabled = !purpose.value;
    copyStatus.textContent = '';
  }

  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('input', render);
  payer.addEventListener('input', render);
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(purpose.value);
      copyStatus.textContent = 'Verwendungszweck kopiert.';
    } catch {
      purpose.focus();
      purpose.select();
      copyStatus.textContent = 'Der Text ist markiert. Du kannst ihn manuell kopieren.';
    }
  });
  render();
}
