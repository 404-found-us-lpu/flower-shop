/* Made by: Yash */
/* Bloom & Petal - js/pages/index.js - the public front page: live shop numbers, flowers in season and the sign-up buttons. */
FS.ready(function (user) {
  const shown = {};                                   // the HTML each box shows now (see setHTML)

  // Puts the icon named in data-icon="..." at the start of each element. data-size sets its size.
  function addIcons() {
    document.querySelectorAll('[data-icon]').forEach(function (el) {
      el.insertAdjacentHTML('afterbegin', FS.icon(el.dataset.icon, Number(el.dataset.size) || 18));
    });
  }

  // Changes a box only when its HTML is different, so the photos do not flash on every data change.
  function setHTML(id, html) {
    if (shown[id] === html) return;
    shown[id] = html;
    document.getElementById(id).innerHTML = html;
  }

  // Where a flower link goes: customers search the catalogue, the shop team opens stock, guests sign in first.
  function flowerLink(name) {
    const catalog = name ? 'catalog.html?q=' + encodeURIComponent(name) : 'catalog.html';
    if (!user) return 'login.html?next=' + encodeURIComponent(catalog);
    return user.role === 'customer' ? catalog : 'stock.html';
  }

  // Signed-in people get one "Go to my dashboard" button in place of "Create an account" and "Sign in".
  function showDashboardButtons() {
    if (!user) return;                                // guests keep the buttons written in the HTML
    const button = `<a class="btn btn-light btn-lg" href="${FS.esc(FS.ROLE_HOME[user.role])}">Go to my dashboard${FS.icon('arrow', 18)}</a>`;
    document.querySelectorAll('[data-actions]').forEach(function (box) { box.innerHTML = button; });
  }

  // The link above the flower tiles.
  function setAllFlowersLink() {
    const link = document.getElementById('all-flowers');
    const staff = user && user.role !== 'customer';
    link.href = flowerLink('');
    link.innerHTML = (staff ? 'Manage stock' : 'See all flowers') + FS.icon('arrow', 16);
  }

  // Text for the first hero chip: "12 kinds of flowers".
  function kindsText(count) {
    if (count === 0) return 'New flowers coming soon';
    return count === 1 ? '1 kind of flower' : count + ' kinds of flowers';
  }

  // One small number box in the dark card.
  function statHTML(iconName, label, value, note) {
    return `<div class="stat stat-dark">
      <span class="stat-label">${FS.icon(iconName, 16)}${FS.esc(label)}</span>
      <span class="stat-value">${FS.esc(value)}</span>
      <span class="stat-note">${FS.esc(note)}</span>
    </div>`;
  }

  // The dark card over the hero: how many flowers are on sale, the cheapest one, free delivery and stock.
  function todayHTML(flowers) {
    const cheapest = flowers.reduce(function (low, f) { return !low || f.price < low.price ? f : low; }, null);
    const units = flowers.reduce(function (sum, f) { return sum + f.stock; }, 0);
    return `<div>
        <p class="hero-eyebrow">Flowers today</p>
        <div class="big-number">${flowers.length}<small>on sale</small></div>
      </div>
      ${statHTML('receipt', 'Cheapest', cheapest ? FS.money(cheapest.price) : 'None yet', cheapest ? cheapest.name : 'New stock is on its way')}
      ${statHTML('truck', 'Free delivery from', FS.money(FS.FREE_DELIVERY_FROM), FS.money(FS.DELIVERY_FEE) + ' delivery below that')}
      ${statHTML('box', 'In stock', units.toLocaleString('en-IN'), units === 1 ? 'item ready to send' : 'items ready to send')}`;
  }

  // One photo tile: picture, name and price.
  function tileHTML(f) {
    return `<a class="tile" href="${FS.esc(flowerLink(f.name))}" aria-label="${FS.esc(f.name + ', ' + FS.money(f.price))}">
      ${FS.flowerImg(f)}
      <span class="tile-name">${FS.esc(f.name)}</span>
      <span class="price-pill">${Number(f.price).toLocaleString('en-IN')} <small>INR</small></span>
    </a>`;
  }

  // The button under the empty state, for this visitor.
  function emptyButton() {
    if (!user) return '<a class="btn btn-primary" href="register.html">Create an account</a>';
    if (user.role === 'customer') return '<a class="btn btn-primary" href="catalog.html">See all flowers</a>';
    return '<a class="btn btn-primary" href="stock.html">Update stock</a>';
  }

  // "In season": the 8 flowers in stock that we have the most of, or a friendly empty state.
  function seasonHTML(flowers) {
    const picks = flowers.filter(function (f) { return f.stock > 0; })
      .sort(function (a, b) { return b.stock - a.stock; })
      .slice(0, 8);
    if (picks.length) return `<div class="tiles">${picks.map(tileHTML).join('')}</div>`;
    return `<div class="empty">
      <span class="empty-icon">${FS.icon('flower', 28)}</span>
      <h3>Nothing in stock right now</h3>
      <p>Fresh flowers are on their way. Please check back soon.</p>
      ${emptyButton()}
    </div>`;
  }

  // The last dark card: its words change for people who are signed in.
  function renderCta() {
    if (!user) return;                                // guests keep the words written in the HTML
    let title = 'Back to the shop';
    let text = user.role === 'owner' ? 'Sales, orders, stock and your team are all on your dashboard.' : 'New orders and stock levels are on your dashboard.';
    if (user.role === 'customer') {
      const placed = FS.getOrders().length;
      title = placed ? 'Plan your next order' : 'Start your first order';
      text = placed ? 'Your orders and delivery updates are waiting on your dashboard.' : 'Pick your flowers, choose a delivery time and leave the rest to us.';
    }
    document.getElementById('cta-title').textContent = title;
    document.getElementById('cta-text').textContent = text;
  }

  // Draws every part of the page that depends on the shop data.
  function render() {
    const flowers = FS.getFlowers();
    document.getElementById('flower-kinds').textContent = kindsText(flowers.length);
    setHTML('shop-today', todayHTML(flowers));
    setHTML('season', seasonHTML(flowers));
    renderCta();
  }

  addIcons();
  showDashboardButtons();
  setAllFlowersLink();
  render();
  window.addEventListener('fs:change', render);      // data changed here or in another tab
});
