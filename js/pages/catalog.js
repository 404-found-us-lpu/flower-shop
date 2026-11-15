/* Made by: Raghav */
/* Bloom & Petal - js/pages/catalog.js - the flowers page: search, type tabs, sort, flower pop-up and add to cart. */
FS.ready(() => {
  const byId = (id) => document.getElementById(id);
  const search = byId('q');
  const sortBox = byId('sort');
  const tabs = byId('tabs');
  const grid = byId('grid');

  // Hindi names of the Indian flowers, found by the first word of the flower's name.
  const HINDI = { Mogra: 'मोगरा', Marigold: 'गेंदा', Aprajita: 'अपराजिता', Guldaudi: 'गुलदाउदी', Madhumalti: 'मधुमालती' };

  // How each sort choice orders two flowers a and b.
  const SORTS = {
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    name: (a, b) => a.name.localeCompare(b.name),
    stock: (a, b) => b.stock - a.stock
  };

  // Start from the address bar, for example catalog.html?q=rose&type=Plants
  const params = FS.params();
  let q = (params.get('q') || '').trim();
  let type = FS.CATEGORIES.find((t) => t.toLowerCase() === (params.get('type') || '').toLowerCase()) || 'All';

  // The Hindi name of an Indian flower ('' for the others).
  const hindi = ({ name }) => HINDI[name.split(' ')[0]] || '';

  // The Hindi name in a small <span lang="hi">, so it is read out in Hindi.
  const hindiTag = (f) => (hindi(f) ? ` <span class="hindi" lang="hi">${hindi(f)}</span>` : '');

  // True when the search words are in the flower's name, botanical name, Hindi name or type.
  const matches = (f) => `${f.name} ${f.botanical} ${hindi(f)} ${f.category}`.toLowerCase().includes(q.toLowerCase());

  // True when the flower belongs to tab t ("All" holds every flower).
  const inType = (f, t) => t === 'All' || f.category === t;

  // The name with the search words wrapped in <mark>. The name is escaped first, so it stays safe.
  const markName = (name) => {
    const safe = FS.esc(name);
    const word = FS.esc(q);
    const at = safe.toLowerCase().indexOf(word.toLowerCase());
    if (!word || at < 0) return safe;
    return `${safe.slice(0, at)}<mark>${safe.slice(at, at + word.length)}</mark>${safe.slice(at + word.length)}`;
  };

  // One flower card: photo with its stock pill, name, botanical name, price and Add (off when sold out).
  const cardHTML = (f) => {
    const id = FS.esc(f.id);
    return `<article class="product">
      <button type="button" class="product-media" data-open="${id}" tabindex="-1">${FS.flowerImg(f)}<span class="stock-pill">${FS.stockBadge(f)}</span></button>
      <div class="product-body">
        <span class="product-cat">${FS.esc(f.category)}</span>
        <h2 class="product-name"><a href="catalog.html?flower=${id}" data-open="${id}">${markName(f.name)}</a>${hindiTag(f)}</h2>
        ${f.botanical ? `<i class="small muted">${FS.esc(f.botanical)}</i>` : ''}
        <p class="product-desc">${FS.esc(f.description)}</p>
        <div class="product-foot">
          <span class="product-price">${FS.money(f.price)}</span>
          <button type="button" class="btn btn-primary btn-sm" data-add="${id}" aria-label="Add ${FS.esc(f.name)} to cart"${f.stock < 1 ? ' disabled' : ''}>${FS.icon('plus', 16)}Add</button>
        </div>
      </div>
    </article>`;
  };

  // A care tip with <sub> and <sup>: pots get a sun-and-water tip, cut flowers a vase tip.
  const careTip = ({ name }) => (name.includes('Pot')
    ? 'Give it 4 to 6 hours of sun and water it every 3<sup>rd</sup> day. In daylight its leaves turn CO<sub>2</sub> into fresh O<sub>2</sub>.'
    : 'Trim 2 cm off the stems and change the H<sub>2</sub>O every 2<sup>nd</sup> day.');

  // The pop-up: the photo in a <figure> captioned with the names and description, then the tip, quantity and Add to cart.
  const modalHTML = (f) => {
    const off = f.stock < 1 ? ' disabled' : '';
    return `<div class="grid-2">
      <figure>
        <div class="tile">${FS.flowerImg(f)}<span class="stock-pill">${FS.stockBadge(f)}</span></div>
        <figcaption><strong>${FS.esc(f.name)}</strong>${hindiTag(f)}${f.botanical ? `<br><i>${FS.esc(f.botanical)}</i>` : ''}<br>${FS.esc(f.description)}</figcaption>
      </figure>
      <div class="stack">
        <span class="product-cat">${FS.esc(f.category)}</span>
        <p class="callout mb-0">${FS.icon('flower', 18)}<span>${careTip(f)}</span></p>
        <p class="product-price mb-0">${FS.money(f.price)}</p>
        <div class="row">
          <label class="label" for="qty">Quantity</label>
          <div class="qty">
            <button type="button" data-step="-1" aria-label="One less"${off}>${FS.icon('minus', 16)}</button>
            <input type="number" id="qty" value="1" min="1" max="${FS.esc(f.stock)}" step="1"${off}>
            <button type="button" data-step="1" aria-label="One more"${off}>${FS.icon('plus', 16)}</button>
          </div>
        </div>
        <button type="button" class="btn btn-primary" data-add="${FS.esc(f.id)}"${off}>${FS.icon('bag', 18)}Add to cart</button>
      </div>
    </div>`;
  };

  // Opens the pop-up for one flower. When it closes, the focus goes back to that flower's card.
  const openFlower = (id) => {
    const f = FS.getFlower(id);
    if (!f) return;
    FS.openModal({ title: f.name, html: modalHTML(f), wide: true }).closed
      .then(() => grid.querySelector(`a[data-open="${f.id}"]`)?.focus());
  };

  // Keeps a quantity box a whole number from 1 to its max (the stock).
  const readQty = (input) => {
    const n = Math.min(Math.max(Math.floor(Number(input.value)) || 1, 1), Number(input.max));
    input.value = n;
    return n;
  };

  // [-] and [+] change the quantity by one.
  const stepQty = (button) => {
    const input = button.parentElement.querySelector('input');
    input.value = Number(input.value) + Number(button.dataset.step);
    readQty(input);
  };

  // Adds to the cart: 1 from a card, the chosen number from the pop-up.
  const addFlower = (button) => {
    const id = button.dataset.add;
    const modal = button.closest('.modal');
    const qty = modal ? readQty(modal.querySelector('input')) : 1;
    const { ok, error } = FS.addToCart(id, qty);   // saving fires fs:change, which redraws the cards
    FS.toast(ok ? `${qty} × ${FS.getFlower(id).name} added to your cart.` : error, ok ? 'success' : 'error');
    if (!modal) grid.querySelector(`[data-add="${id}"]`).focus();   // keep the focus on the same Add button
  };

  // Draws the tab counts, the cards (or the empty message) and the result line.
  const render = () => {
    const all = FS.getFlowers();
    const found = all.filter(matches);
    const shown = found.filter((f) => inType(f, type)).sort(SORTS[sortBox.value]);
    tabs.querySelectorAll('.tab').forEach((tab) => {
      const t = tab.dataset.type;
      tab.classList.toggle('active', t === type);
      tab.setAttribute('aria-pressed', t === type);
      tab.querySelector('.count').textContent = found.filter((f) => inType(f, t)).length;
    });
    grid.innerHTML = shown.map(cardHTML).join('');
    byId('empty').hidden = shown.length > 0;
    byId('result').textContent = `Showing ${shown.length} of ${all.length} flowers` +
      (q ? ` for "${q}"` : '') + (type === 'All' ? '' : ` in ${type}`);
  };

  // A filter changed: draw again and keep ?q= and ?type= in the address bar, so a refresh or a shared link shows the same flowers.
  const update = () => {
    render();
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (type !== 'All') p.set('type', type);
    history.replaceState(null, '', p.toString() ? `?${p}` : location.pathname);
  };

  // Build the tabs once ("All" and the five types) and the search suggestions.
  tabs.innerHTML = ['All', ...FS.CATEGORIES].map((t) =>
    `<button type="button" class="tab" data-type="${FS.esc(t)}">${FS.esc(t)} <span class="count"></span></button>`).join('');
  byId('flower-names').innerHTML = FS.getFlowers().map(({ name }) => `<option value="${FS.esc(name)}">`).join('');
  search.value = q;

  search.addEventListener('input', () => { q = search.value.trim(); update(); });
  byId('filters').addEventListener('submit', (e) => { e.preventDefault(); search.blur(); });   // Enter: stay here, close the phone keyboard
  sortBox.addEventListener('change', render);
  document.addEventListener('change', (e) => { if (e.target.id === 'qty') readQty(e.target); });

  // One click handler for the tabs, the cards and the pop-up (the pop-up sits outside the grid).
  document.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-type]');
    const open = e.target.closest('[data-open]');
    const add = e.target.closest('[data-add]');
    const step = e.target.closest('[data-step]');
    if (tab) { type = tab.dataset.type; update(); }
    else if (open) { e.preventDefault(); openFlower(open.dataset.open); }
    else if (add) addFlower(add);
    else if (step) stepQty(step);
    else if (e.target.closest('[data-clear]')) { q = ''; type = 'All'; search.value = ''; update(); search.focus(); }
  });

  window.addEventListener('fs:change', render);
  update();
  if (params.get('flower')) openFlower(params.get('flower'));
});
