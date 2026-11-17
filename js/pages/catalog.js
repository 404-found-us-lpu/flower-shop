/* Made by: Raghav */
/* Bloom & Petal - js/pages/catalog.js - the flowers page: search, type tabs, sort and add to cart.
   (The search suggestions and the tab buttons are plain HTML in catalog.html.) */

FS.ready(() => {
  // ---------- Page elements ----------

  const byId = (id) => document.getElementById(id);
  const search = byId('q');
  const grid = byId('grid');

  // ---------- Fixed data ----------

  // Hindi names of the Indian flowers, found by the first word of the flower's name.
  const HINDI = {
    Mogra: 'मोगरा',
    Marigold: 'गेंदा',
    Aprajita: 'अपराजिता',
    Guldaudi: 'गुलदाउदी',
    Madhumalti: 'मधुमालती',
    Rajnigandha: 'रजनीगंधा',
    Champa: 'चंपा',
    Gudhal: 'गुड़हल',
    Kamal: 'कमल',
    Raat: 'रात की रानी',
    Parijat: 'पारिजात',
    Sadabahar: 'सदाबहार',
    Rangan: 'रंगन',
  };

  // How each sort choice orders two flowers a and b.
  const SORTS = {
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    name: (a, b) => a.name.localeCompare(b.name),
    stock: (a, b) => b.stock - a.stock,
  };

  // ---------- Starting state ----------

  // Read the address bar once, for example catalog.html?q=rose&type=Plants
  const params = FS.params();
  const typeInUrl = (params.get('type') || '').toLowerCase();

  // The search words typed in the box, and the chosen type tab.
  let searchText = '';
  let type = FS.CATEGORIES.find((t) => t.toLowerCase() === typeInUrl) || 'All';

  search.value = params.get('q') || '';

  // ---------- Small helpers ----------

  // The Hindi name of an Indian flower ('' for the others).
  const hindi = ({ name }) => HINDI[name.split(' ')[0]] || '';

  // True when the search words are in the flower's name, botanical name, Hindi name or type.
  const matches = (f) => {
    const text = `${f.name} ${f.botanical} ${hindi(f)} ${f.category}`;
    return text.toLowerCase().includes(searchText.toLowerCase());
  };

  // True when the flower belongs to tab t ("All" holds every flower).
  const inType = (f, t) => t === 'All' || f.category === t;

  // The name with the search words wrapped in <mark>. The name is escaped first, so it stays safe.
  const markName = (name) => {
    const safe = FS.esc(name);
    const word = FS.esc(searchText);
    const at = safe.toLowerCase().indexOf(word.toLowerCase());

    if (!word || at < 0) return safe;

    const before = safe.slice(0, at);
    const hit = safe.slice(at, at + word.length);
    const after = safe.slice(at + word.length);
    return `${before}<mark>${hit}</mark>${after}`;
  };

  // ---------- One flower card ----------

  // Photo with its stock pill, name, Hindi name (lang="hi" so it is read out in Hindi),
  // botanical name, price and Add (off when sold out).
  const cardHTML = (f) => `<article class="product">
    <div class="product-media">${FS.flowerImg(f)}<span class="stock-pill">${FS.stockBadge(f)}</span></div>
    <div class="product-body">
      <span class="product-cat">${FS.esc(f.category)}</span>
      <h2 class="product-name">${markName(f.name)}${hindi(f) ? ` <span class="hindi" lang="hi">${hindi(f)}</span>` : ''}</h2>
      ${f.botanical ? `<i class="small muted">${FS.esc(f.botanical)}</i>` : ''}
      <p class="product-desc">${FS.esc(f.description)}</p>
      <div class="product-foot">
        <span class="product-price">${FS.money(f.price)}</span>
        <button type="button" class="btn btn-primary btn-sm"
          data-add="${FS.esc(f.id)}"
          aria-label="Add ${FS.esc(f.name)} to cart"
          ${f.stock < 1 ? 'disabled' : ''}>${FS.icon('plus', 16)}Add</button>
      </div>
    </div>
  </article>`;

  // ---------- Draw the page ----------

  // Reads the search box, then draws the tab counts, the cards (or the empty message) and the result line.
  const render = () => {
    searchText = search.value.trim();

    const all = FS.getFlowers();
    const found = all.filter(matches);
    const shown = found
      .filter((f) => inType(f, type))
      .sort(SORTS[byId('sort').value]);

    // Each tab: highlight the chosen one and show how many flowers it has.
    document.querySelectorAll('#tabs .tab').forEach((tab) => {
      const tabType = tab.dataset.type;
      tab.classList.toggle('active', tabType === type);
      tab.setAttribute('aria-pressed', tabType === type);
      tab.querySelector('.count').textContent = found.filter((f) => inType(f, tabType)).length;
    });

    grid.innerHTML = shown.map(cardHTML).join('');
    byId('empty').hidden = shown.length > 0;

    byId('result').textContent =
      `Showing ${shown.length} of ${all.length} flowers` +
      (searchText ? ` for "${searchText}"` : '') +
      (type === 'All' ? '' : ` in ${type}`);
  };

  // ---------- Events ----------

  // Typing a search or picking a sort redraws the cards.
  byId('filters').addEventListener('input', render);

  // Enter in the search box: stay on this page and close the phone keyboard.
  byId('filters').addEventListener('submit', (e) => {
    e.preventDefault();
    search.blur();
  });

  // One click handler for the type tabs, the Add buttons and Clear search.
  document.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-type]');
    const add = e.target.closest('[data-add]');

    if (tab) {
      type = tab.dataset.type;
      render();
    } else if (add) {
      // Saving redraws the cards, so put the focus back on the new Add button.
      const id = add.dataset.add;
      const { ok, error } = FS.addToCart(id);
      FS.toast(ok ? `${FS.getFlower(id).name} added to your cart.` : error, ok ? 'success' : 'error');
      grid.querySelector(`[data-add="${id}"]`).focus();
    } else if (e.target.closest('[data-clear]')) {
      search.value = '';
      type = 'All';
      render();
      search.focus();
    }
  });

  // Redraw when the flowers or the cart change (also from another tab).
  window.addEventListener('fs:change', render);

  render();
});
