/* Made by: Raghav */
/* Bloom & Petal - js/pages/home.js - the customer home page: the order on its way, shop by type, recent orders and picks. */
FS.ready(function () {
  const hello = document.getElementById('hello');
  const chips = document.getElementById('chips');
  const current = document.getElementById('current');
  const types = document.getElementById('types');
  const steps = document.getElementById('steps');
  const cartLink = document.getElementById('cart-link');
  const recent = document.getElementById('recent');
  const picked = document.getElementById('picked');

  // "1 order" or "3 orders"
  function plural(n, word) {
    return n + ' ' + word + (n === 1 ? '' : 's');
  }

  // "Today", "Tomorrow" or the day of the week for a 'YYYY-MM-DD' date.
  function dayWord(ymd) {
    if (ymd === FS.today(0)) return 'Today';
    if (ymd === FS.today(1)) return 'Tomorrow';
    const p = ymd.split('-').map(Number);
    return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString('en-GB', { weekday: 'long' });
  }

  // Hero: "Welcome, Neha" and the two chips under it.
  function renderHero(me, orders) {
    const first = me.name.trim().split(/\s+/)[0];
    const since = FS.fmtDate(me.joined).replace(/^\d+ /, '');   // "27 Aug 2026" becomes "Aug 2026"
    hello.textContent = 'Welcome, ' + first;
    chips.innerHTML =
      (since ? `<span class="chip">${FS.icon('calendar', 16)}Member since ${FS.esc(since)}</span>` : '') +
      `<span class="chip chip-gold">${FS.icon('receipt', 16)}${plural(orders.length, 'order')}</span>`;
  }

  // The dark card: the newest order that is still on its way, or a nudge to go shopping.
  function renderCurrent(orders) {
    const open = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');   // still on its way
    const o = open[0];                                   // FS.getOrders() gives the newest first
    if (!o) {
      current.innerHTML = `
        <div>
          <h2 class="big-number">Nothing on the way</h2>
          <p class="muted mb-0">Pick something beautiful for someone today.</p>
        </div>
        <div class="row">
          <a class="btn btn-light" href="catalog.html">Browse flowers ${FS.icon('arrow', 18)}</a>
          ${orders.length ? '<a class="btn btn-outline-light" href="orders.html">My orders</a>' : ''}
        </div>`;
      return;
    }
    const day = FS.fmtDate(o.deliveryDate).replace(/ \d{4}$/, '');   // "17 Nov 2026" becomes "17 Nov"
    const more = open.length - 1;
    current.innerHTML = `
      <h2 class="sr-only">Your order on the way</h2>
      <div class="row between">
        <div class="row"><h3 class="mb-0">Order #${FS.esc(o.id)}</h3>${FS.badge(o.status)}</div>
        <span class="small"><span class="muted">Total</span> <strong class="num">${FS.money(o.total)}</strong></span>
      </div>
      <div class="hero-row">
        <div>
          <p class="muted small mb-0">${o.deliveryDate < FS.today(0) ? 'Delivery was due' : 'Arriving'}</p>
          <p class="big-number mb-0">${FS.esc(day)} <small>${dayWord(o.deliveryDate)}</small></p>
        </div>
        <div class="small">
          <p class="mb-0">For <strong>${FS.esc(o.recipient.name)}</strong></p>
          <p class="muted mb-0">${FS.esc(o.slot)}</p>
          <p class="muted mb-0">${FS.esc(o.recipient.address)}</p>
        </div>
      </div>
      ${FS.trackerHTML(o)}
      <div class="row between">
        <div class="row">
          <a class="btn btn-light" href="order.html?id=${FS.esc(o.id)}">Track order ${FS.icon('arrow', 18)}</a>
          <a class="btn btn-outline-light" href="catalog.html">Order more</a>
        </div>
        ${more ? `<a class="small" href="orders.html">${plural(more, 'more order')} on the way</a>` : ''}
      </div>`;
  }

  // One photo tile per flower type, showing the lowest price of that type.
  function renderTypes(flowers) {
    types.innerHTML = FS.CATEGORIES.map(function (cat) {
      const list = flowers.filter(f => f.category === cat);
      const photo = list.find(f => f.image) || list[0];
      const from = list.length ? FS.money(Math.min(...list.map(f => f.price))) : '';
      const label = cat + (from ? ', from ' + from : ', coming soon');
      return `<a class="tile" href="catalog.html?cat=${FS.esc(encodeURIComponent(cat))}" aria-label="${FS.esc(label)}">
        ${FS.flowerImg(photo)}
        <span class="tile-name">${FS.esc(cat)}</span>
        <span class="price-pill">${from ? '<small>from</small> ' + from : '<small>Coming soon</small>'}</span>
      </a>`;
    }).join('');
  }

  // "How it works": step 1 is lit while the cart is empty, step 2 once it has flowers in it.
  function renderSteps() {
    const count = FS.cartCount();
    const totals = FS.cartTotals();
    let checkout = `Say who the flowers are for, then pick a date and a time. Delivery is free from ${FS.money(FS.FREE_DELIVERY_FROM)}.`;
    if (count) {
      checkout = `${plural(count, 'item')} in your cart, ${FS.money(totals.subtotal)} so far. ` +
        (totals.toFree ? `Add ${FS.money(totals.toFree)} more for free delivery.` : 'Delivery is free.');
    }
    const list = [
      ['Choose flowers', 'Pick a bouquet, a single stem, a plant or a gift.', !count],
      ['Checkout', checkout, !!count],
      ['Track the order', 'Follow it from our workbench to their door.', false]
    ];
    steps.innerHTML = list.map((s, i) =>
      `<li${s[2] ? ' class="active" aria-current="step"' : ''}><span class="step-num">${i + 1}</span><div><strong>${s[0]}</strong><p>${s[1]}</p></div></li>`
    ).join('');
    cartLink.innerHTML = `Open your cart (${plural(count, 'item')}) ${FS.icon('arrow', 18)}`;
  }

  // Short text for an order's flowers: "Pink Tulip Bunch + 1 more"
  function itemsText(order) {
    const first = order.items[0];
    const more = order.items.length - 1;
    return first.name + (first.qty > 1 ? ' × ' + first.qty : '') + (more > 0 ? ' + ' + more + ' more' : '');
  }

  // A friendly empty box with one button to the flowers page.
  function emptyHTML(iconName, title, text, button) {
    return `<div class="empty"><span class="empty-icon">${FS.icon(iconName, 28)}</span><h3>${title}</h3><p>${text}</p>
      <a class="btn btn-primary" href="catalog.html">${button}</a></div>`;
  }

  // One table row. The order number is a real link, so keyboard users can open it too.
  function rowHTML(o) {
    const placed = FS.esc(FS.fmtDate(o.createdAt)).replace(/ /g, '&nbsp;');   // keep "12 Nov 2026" on one line
    return `<tr class="clickable" data-id="${FS.esc(o.id)}">
      <td><a class="cell-main" href="order.html?id=${FS.esc(o.id)}">#${FS.esc(o.id)}</a></td>
      <td class="num">${placed}</td>
      <td><div class="cell-main">${FS.esc(itemsText(o))}</div><div class="cell-sub">For ${FS.esc(o.recipient.name)}</div></td>
      <td class="right num strong">${FS.money(o.total)}</td>
      <td>${FS.badge(o.status)}</td>
    </tr>`;
  }

  // Table of the last five orders.
  function renderRecent(orders) {
    if (!orders.length) {
      recent.innerHTML = emptyHTML('receipt', 'No orders yet', 'When you place an order it shows up here, with its status.', 'Browse flowers');
      return;
    }
    recent.innerHTML = `<div class="table-wrap"><table class="table">
      <thead><tr><th scope="col">Order</th><th scope="col">Placed</th><th scope="col">Flowers</th><th scope="col" class="right">Total</th><th scope="col">Status</th></tr></thead>
      <tbody>${orders.slice(0, 5).map(rowHTML).join('')}</tbody>
    </table></div>`;
  }

  // One flower card with an "Add to cart" button (adds one).
  function productHTML(f) {
    const low = f.stock <= FS.LOW_STOCK ? FS.stockBadge(f) : '';
    return `<article class="product">
      <a class="product-media" href="catalog.html?q=${FS.esc(encodeURIComponent(f.name))}" aria-label="See ${FS.esc(f.name)} in the shop">${FS.flowerImg(f)}${low}</a>
      <div class="product-body">
        <span class="product-cat">${FS.esc(f.category)}</span>
        <h3 class="product-name">${FS.esc(f.name)}</h3>
        <p class="product-desc">${FS.esc(f.description)}</p>
        <div class="product-foot">
          <span class="product-price">${FS.money(f.price)}</span>
          <button type="button" class="btn btn-primary btn-sm" data-add="${FS.esc(f.id)}">${FS.icon('plus', 16)}Add to cart</button>
        </div>
      </div>
    </article>`;
  }

  // Four flowers that are well in stock (most stock first).
  function renderPicked(flowers) {
    const picks = flowers.filter(f => f.stock > 0).sort((a, b) => b.stock - a.stock).slice(0, 4);
    if (!picks.length) {
      picked.innerHTML = emptyHTML('flower', 'Nothing in stock right now', 'Our florists are restocking. Please look again a little later.', 'See all flowers');
      return;
    }
    picked.innerHTML = `<div class="product-grid">${picks.map(productHTML).join('')}</div>`;
  }

  // Draws every part of the page from the latest data.
  function render() {
    const me = FS.currentUser();
    if (!me || me.role !== 'customer') { location.reload(); return; }   // logged out or changed in another tab: the page guard sends them on
    const orders = FS.getOrders();
    const flowers = FS.getFlowers();
    renderHero(me, orders);
    renderCurrent(orders);
    renderTypes(flowers);
    renderSteps();
    renderRecent(orders);
    renderPicked(flowers);
  }

  // Clicking anywhere on an order row opens that order.
  recent.addEventListener('click', function (e) {
    const row = e.target.closest('tr[data-id]');
    if (row && !e.target.closest('a')) location.href = 'order.html?id=' + row.dataset.id;
  });

  // "Add to cart" on a picked flower.
  picked.addEventListener('click', function (e) {
    const button = e.target.closest('[data-add]');
    if (!button) return;
    const id = button.dataset.add;
    const result = FS.addToCart(id, 1);                  // saving fires fs:change, which draws the page again
    if (result.ok) FS.toast(FS.getFlower(id).name + ' is in your cart.');
    else FS.toast(result.error, 'error');
    const again = picked.querySelector(`[data-add="${id}"]`);
    if (again) again.focus();                            // keep the focus on the same button after the redraw
  });

  render();
  window.addEventListener('fs:change', render);
});
