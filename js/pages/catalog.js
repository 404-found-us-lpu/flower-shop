/* Made by: Raghav */
/* Bloom & Petal - js/pages/catalog.js - the flowers page: search, filter, sort, add to cart. */
FS.ready(function () {
  // How each choice in the sort box orders the flowers. FS.getFlowers() comes A-Z and
  // sort() keeps that order for ties, so two flowers with the same price stay A-Z.
  const SORTS = {
    popular: function (a, b) { return b.stock - a.stock; },          // most in stock first
    'price-asc': function (a, b) { return a.price - b.price; },
    'price-desc': function (a, b) { return b.price - a.price; },
    name: function (a, b) { return a.name.localeCompare(b.name); }
  };
  // Keeps a long description on one line in a card (the pop-up shows all of it).
  const ONE_LINE = 'white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';

  const form = document.getElementById('filters');
  const search = document.getElementById('q');
  const sortBox = document.getElementById('sort');
  const stockBox = document.getElementById('instock');
  const tabs = document.getElementById('tabs');
  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');
  const resultText = document.getElementById('result-text');
  const shownChip = document.getElementById('shown-chip');
  const clearTop = document.getElementById('clear-top');

  // What the customer is looking for. It starts from the address bar: ?q=rose&cat=Plants&sort=price-asc
  const params = FS.params();
  const state = {
    q: params.get('q') || '',
    cat: findCategory(params.get('cat')),
    sort: Object.keys(SORTS).indexOf(params.get('sort')) !== -1 ? params.get('sort') : 'popular',
    inStock: params.get('instock') === '1'
  };
  let drawnFlowers = '';   // the flower data now on screen, so a cart-only change does not redraw the cards

  // The category named in the address bar (capitals do not matter). '' means all types.
  function findCategory(value) {
    const wanted = String(value || '').toLowerCase();
    return FS.CATEGORIES.find(function (c) { return c.toLowerCase() === wanted; }) || '';
  }

  // "1 flower", "5 flowers"
  function plural(n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); }

  // True when a flower fits the search words, the "In stock only" box and (unless skipType) the chosen tab.
  function matches(f, skipType) {
    const text = (f.name + ' ' + f.category + ' ' + (f.description || '')).toLowerCase();
    const words = state.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.every(function (w) { return text.indexOf(w) !== -1; })) return false;
    if (state.inStock && f.stock < 1) return false;
    return skipType || !state.cat || f.category === state.cat;
  }

  function hasFilters() { return state.q.trim() !== '' || state.cat !== '' || state.inStock; }

  // Builds the type tabs once: "All" and one per category. drawTabs() keeps them up to date.
  function buildTabs() {
    tabs.innerHTML = [''].concat(FS.CATEGORIES).map(function (cat) {
      return `<button type="button" class="tab" data-cat="${FS.esc(cat)}" aria-pressed="false">${FS.esc(cat || 'All')}<span class="count">0</span></button>`;
    }).join('');
  }

  // Marks the chosen tab and shows how many flowers each type has after the search and stock filters.
  function drawTabs(all) {
    const pool = all.filter(function (f) { return matches(f, true); });
    tabs.querySelectorAll('.tab').forEach(function (tab) {
      const cat = tab.dataset.cat;
      const on = cat === state.cat;
      tab.querySelector('.count').textContent = pool.filter(function (f) { return !cat || f.category === cat; }).length;
      tab.classList.toggle('active', on);
      tab.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  // The [-] [1] [+] quantity box (max = stock). It is switched off when the flower is sold out.
  function qtyHTML(f, label, id) {
    const off = f.stock < 1 ? ' disabled' : '';
    return `<div class="qty">
        <button type="button" data-step="-1" aria-label="Less"${off}>−</button>
        <input type="number" value="1" min="1" max="${FS.esc(f.stock)}" step="1" inputmode="numeric"${id ? ` id="${id}"` : ''}${label ? ` aria-label="${FS.esc(label)}"` : ''}${off}>
        <button type="button" data-step="1" aria-label="More"${off}>+</button>
      </div>`;
  }

  // One flower card. The photo and the name both open the pop-up.
  function cardHTML(f) {
    const id = FS.esc(f.id);
    const name = FS.esc(f.name);
    return `<article class="product" data-flower="${id}">
      <button type="button" class="product-media" data-open="${id}" tabindex="-1">${FS.flowerImg(f)}${f.stock <= FS.LOW_STOCK ? FS.stockBadge(f) : ''}</button>
      <div class="product-body">
        <span class="product-cat">${FS.esc(f.category)}</span>
        <h3 class="product-name"><a href="catalog.html?flower=${id}" data-open="${id}">${name}</a></h3>
        <p class="product-desc" style="${ONE_LINE}">${FS.esc(f.description)}</p>
        <div class="product-foot">
          <span class="product-price">${FS.money(f.price)}</span>
          <div class="row">
            ${qtyHTML(f, 'Quantity of ' + f.name)}
            <button type="button" class="btn btn-primary btn-sm" data-add="${id}" aria-label="Add ${name} to cart"${f.stock < 1 ? ' disabled' : ''}>Add</button>
          </div>
        </div>
      </div>
    </article>`;
  }

  // What to show when no card is on screen.
  function emptyHTML(total) {
    if (!total) {
      return `<span class="empty-icon">${FS.icon('flower', 28)}</span>
        <h3>No flowers on sale right now</h3>
        <p>The shop is restocking. Please look again a little later.</p>
        <a class="btn btn-primary" href="home.html">Back to home</a>`;
    }
    const q = state.q.trim();
    const what = (q ? ` for "${FS.esc(q)}"` : '') + (state.cat ? ` in ${FS.esc(state.cat)}` : '') + (state.inStock ? ' that is in stock' : '');
    return `<span class="empty-icon">${FS.icon('search', 28)}</span>
      <h3>No flowers match</h3>
      <p>We found nothing${what}. Try another word or type, or clear the filters to see every flower.</p>
      <button type="button" class="btn btn-primary" data-clear>Clear filters</button>`;
  }

  // "Showing all 12 flowers" or "Showing 3 of 12 flowers for "rose" in Bouquets"
  function resultLine(shown, total) {
    if (!total) return 'No flowers on sale right now.';
    if (!hasFilters()) return 'Showing all ' + plural(total, 'flower');
    let line = 'Showing ' + shown + ' of ' + plural(total, 'flower');
    if (state.q.trim()) line += ' for "' + state.q.trim() + '"';
    if (state.cat) line += ' in ' + state.cat;
    if (state.inStock) line += ', in stock only';
    return line;
  }

  // Draws the tabs, the cards (or the empty state) and the counts.
  function render() {
    const all = FS.getFlowers();
    const shown = all.filter(function (f) { return matches(f, false); }).sort(SORTS[state.sort]);
    drawnFlowers = JSON.stringify(all);
    drawTabs(all);
    grid.innerHTML = shown.map(cardHTML).join('');
    grid.hidden = shown.length === 0;
    empty.hidden = shown.length > 0;
    if (!shown.length) empty.innerHTML = emptyHTML(all.length);
    shownChip.innerHTML = FS.icon('flower', 16) + plural(shown.length, 'flower') + ' shown';
    resultText.textContent = resultLine(shown.length, all.length);
    clearTop.hidden = !hasFilters() || !shown.length;
  }

  // Keeps the address bar in step (?q=&cat=&sort=), so a refresh or a shared link shows the same flowers.
  function saveToUrl() {
    const p = new URLSearchParams();
    if (state.q.trim()) p.set('q', state.q.trim());
    if (state.cat) p.set('cat', state.cat);
    if (state.sort !== 'popular') p.set('sort', state.sort);
    if (state.inStock) p.set('instock', '1');
    const query = p.toString();
    try { history.replaceState(null, '', location.pathname + (query ? '?' + query : '')); } catch (err) { /* some browsers block this for local files */ }
  }

  // A filter changed: redraw and update the address bar.
  function update() { render(); saveToUrl(); }

  // "Clear filters": back to every flower. The sort order stays as it is.
  function clearFilters() {
    state.q = ''; state.cat = ''; state.inStock = false;
    search.value = ''; stockBox.checked = false;
    update();
    tabs.querySelector('.tab').focus();
  }

  // Reads a quantity box and corrects it to a whole number from 1 to its max (the stock).
  function readQty(input) {
    const max = Math.max(Number(input.max) || 1, 1);
    let n = Math.floor(Number(input.value));
    if (!(n >= 1)) n = 1;
    if (n > max) n = max;
    input.value = n;
    return n;
  }

  // [-] and [+]: change the number by one, staying inside the limits.
  function stepQty(button) {
    const input = button.parentElement.querySelector('input');
    input.value = (Number(input.value) || 1) + Number(button.dataset.step);
    readQty(input);
  }

  // The small line under the pop-up buttons.
  function noteText(f) {
    if (f.stock < 1) return 'Sold out right now. Please check again soon.';
    const line = FS.getCart().find(function (l) { return l.flower.id === f.id; });
    if (line) return `You have ${line.qty} in your cart. We have ${f.stock} in stock.`;
    return 'Free delivery on orders over ' + FS.money(FS.FREE_DELIVERY_FROM) + '.';
  }

  // "Add" on a card or "Add to cart" in the pop-up: put the chosen number in the cart.
  function addFromButton(button) {
    const box = button.closest('[data-flower]');
    const input = box.querySelector('.qty input');
    const qty = readQty(input);
    const result = FS.addToCart(button.dataset.add, qty);
    if (!result.ok) { FS.toast(result.error, 'error'); return; }
    const flower = FS.getFlower(button.dataset.add);
    FS.toast(`Added ${qty} x ${flower.name} to your cart (${plural(result.count, 'item')} in total).`);
    input.value = 1;
    const note = box.querySelector('[data-note]');
    if (note) note.textContent = noteText(flower);
  }

  // The pop-up: big photo and full details of one flower.
  function modalHTML(f) {
    const id = FS.esc(f.id);
    return `<div class="grid-2" data-flower="${id}">
      <div class="tile">${FS.flowerImg(f)}</div>
      <div class="stack">
        <span class="product-cat">${FS.esc(f.category)}</span>
        <p class="mb-0">${FS.esc(f.description || 'A fresh pick from our shop.')}</p>
        <div class="row between">
          <span class="product-price">${FS.money(f.price)}</span>
          ${FS.stockBadge(f)}
        </div>
        <div class="row">
          <label class="label" for="modal-qty">Quantity</label>
          ${qtyHTML(f, '', 'modal-qty')}
        </div>
        <div class="row">
          <button type="button" class="btn btn-primary" data-add="${id}"${f.stock < 1 ? ' disabled' : ''}>${FS.icon('bag', 18)}Add to cart</button>
          <a class="btn btn-ghost" href="cart.html">Go to cart</a>
        </div>
        <p class="hint" data-note>${FS.esc(noteText(f))}</p>
      </div>
    </div>`;
  }

  // Opens the pop-up for one flower. opener gets the focus back when it closes.
  function openFlower(id, opener) {
    const f = FS.getFlower(id);
    if (!f || !f.active) { FS.toast('Sorry, that flower is not on sale any more.', 'error'); return; }
    const modal = FS.openModal({ title: f.name, html: modalHTML(f), wide: true });
    const add = modal.el.querySelector('[data-add]');
    (add.disabled ? modal.el.querySelector('a.btn') : add).focus();
    modal.closed.then(function () { if (opener && opener.isConnected) opener.focus(); });
  }

  // Filters: live while typing or clicking.
  search.addEventListener('input', function () { state.q = search.value; update(); });
  form.addEventListener('submit', function (e) { e.preventDefault(); search.blur(); });   // Enter: stay here, close the phone keyboard
  sortBox.addEventListener('change', function () { state.sort = sortBox.value; update(); });
  stockBox.addEventListener('change', function () { state.inStock = stockBox.checked; update(); });
  tabs.addEventListener('click', function (e) {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    state.cat = tab.dataset.cat;
    update();
  });

  // One click handler for the cards and the pop-up (the pop-up lives outside the grid).
  document.addEventListener('click', function (e) {
    const step = e.target.closest('.qty [data-step]');
    const add = e.target.closest('[data-add]');
    const clear = e.target.closest('[data-clear]');
    const open = e.target.closest('[data-open]');
    if (step) stepQty(step);
    else if (add) addFromButton(add);
    else if (clear) clearFilters();
    else if (open && !(e.ctrlKey || e.metaKey || e.shiftKey)) {   // Ctrl+click on a name still opens a new tab
      e.preventDefault();
      openFlower(open.dataset.open, open);
    }
  });
  // A typed quantity is corrected when the box loses focus.
  document.addEventListener('change', function (e) {
    if (e.target.matches('.qty input')) readQty(e.target);
  });

  // Data changed here or in another tab. Redraw only when the flowers changed (stock, price, new ones),
  // so adding to the cart does not reset the other quantity boxes.
  window.addEventListener('fs:change', function () {
    if (JSON.stringify(FS.getFlowers()) !== drawnFlowers) render();
  });

  // Start: fill the controls from the address bar, draw, and open a flower if the link asked for one.
  buildTabs();
  search.value = state.q;
  sortBox.value = state.sort;
  stockBox.checked = state.inStock;
  document.getElementById('delivery-chip').innerHTML = FS.icon('truck', 16) + 'Free delivery over ' + FS.money(FS.FREE_DELIVERY_FROM);
  render();
  saveToUrl();
  if (params.get('flower')) openFlower(params.get('flower'));
});
