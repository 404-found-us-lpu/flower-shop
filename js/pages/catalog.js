/* Made by: Raghav */
/* Bloom & Petal - js/pages/catalog.js - the flowers page: search, type tabs, sort and add to cart.
   (The search suggestions and the tab buttons are plain HTML in catalog.html.) */
FS.ready(() => {
  const byId = (id) => document.getElementById(id);
  const search = byId('q');
  const grid = byId('grid');

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

  // Start once from the address bar, for example catalog.html?q=rose&type=Plants
  const params = FS.params();
  let q = '';
  let type = FS.CATEGORIES.find((t) => t.toLowerCase() === (params.get('type') || '').toLowerCase()) || 'All';
  search.value = params.get('q') || '';

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
  const cardHTML = (f) => `<article class="product">
      <div class="product-media">${FS.flowerImg(f)}<span class="stock-pill">${FS.stockBadge(f)}</span></div>
      <div class="product-body">
        <span class="product-cat">${FS.esc(f.category)}</span>
        <h2 class="product-name">${markName(f.name)}${hindiTag(f)}</h2>
        ${f.botanical ? `<i class="small muted">${FS.esc(f.botanical)}</i>` : ''}
        <p class="product-desc">${FS.esc(f.description)}</p>
        <div class="product-foot">
          <span class="product-price">${FS.money(f.price)}</span>
          <button type="button" class="btn btn-primary btn-sm" data-add="${FS.esc(f.id)}" aria-label="Add ${FS.esc(f.name)} to cart"${f.stock < 1 ? ' disabled' : ''}>${FS.icon('plus', 16)}Add</button>
        </div>
      </div>
    </article>`;

  // Adds one flower to the cart. Saving redraws the cards, so the focus goes back to the same Add button.
  const addFlower = (id) => {
    const { ok, error } = FS.addToCart(id);
    FS.toast(ok ? `${FS.getFlower(id).name} added to your cart.` : error, ok ? 'success' : 'error');
    grid.querySelector(`[data-add="${id}"]`).focus();
  };

  // Reads the search box, then draws the tab counts, the cards (or the empty message) and the result line.
  const render = () => {
    q = search.value.trim();
    const all = FS.getFlowers();
    const found = all.filter(matches);
    const shown = found.filter((f) => inType(f, type)).sort(SORTS[byId('sort').value]);
    document.querySelectorAll('#tabs .tab').forEach((tab) => {
      const t = tab.dataset.type;
      tab.classList.toggle('active', t === type);
      tab.setAttribute('aria-pressed', t === type);
      tab.querySelector('.count').textContent = found.filter((f) => inType(f, t)).length;
    });
    grid.innerHTML = shown.map(cardHTML).join('');
    byId('empty').hidden = shown.length > 0;
    byId('result').textContent =
      `Showing ${shown.length} of ${all.length} flowers` +
      (q ? ` for "${q}"` : '') +
      (type === 'All' ? '' : ` in ${type}`);
  };

  byId('filters').addEventListener('input', render); // typing a search or picking a sort
  byId('filters').addEventListener('submit', (e) => {
    e.preventDefault();
    search.blur();
  }); // Enter: stay here, close the phone keyboard

  // One click handler for the type tabs, the Add buttons and Clear search.
  document.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-type]');
    const add = e.target.closest('[data-add]');
    if (tab) {
      type = tab.dataset.type;
      render();
    } else if (add) addFlower(add.dataset.add);
    else if (e.target.closest('[data-clear]')) {
      search.value = '';
      type = 'All';
      render();
      search.focus();
    }
  });

  window.addEventListener('fs:change', render);
  render();
});
