/* Made by: Raghav */
/* Bloom & Petal - js/pages/home.js - the customer home: next delivery, Indian favourites, shop by type, recent orders, tip of the day. */
FS.ready((user) => {
  const byId = (id) => document.getElementById(id);

  // "Rose Bouquet × 2, Single Lily": the flowers of one order as short text.
  const itemsText = (items) => items.map(({ name, qty }) => (qty > 1 ? `${name} × ${qty}` : name)).join(', ');

  // "Today", "Tomorrow" or the weekday name of a 'YYYY-MM-DD' date.
  const dayWord = (ymd) => {
    if (ymd === FS.today()) return 'Today';
    else if (ymd === FS.today(1)) return 'Tomorrow';
    return new Date(`${ymd}T00:00`).toLocaleDateString('en-IN', { weekday: 'long' });
  };

  // One flower-care tip for each day of the week (getDay(): 0 = Sunday ... 6 = Saturday).
  const tipOfTheDay = () => {
    switch (new Date().getDay()) {
      case 0: return 'Cut the stems at a slant, under running water, so they drink better.';
      case 1: return 'Change the vase water every two days and rinse the vase each time.';
      case 2: return 'Keep bouquets away from fruit. Ripening fruit makes flowers fade faster.';
      case 3: return 'Pull off any leaves below the water line. They rot and cloud the water.';
      case 4: return 'Mogra and aprajita love the sun: give the pots at least four hours a day.';
      case 5: return 'Water potted plants in the morning, so the leaves dry before night.';
      default: return 'Keep fresh flowers out of direct sun and away from the fan or the AC.';   // 6 = Saturday
    }
  };

  // The dark card: the nearest order arriving today or later, or a friendly nudge to go shopping.
  const renderNext = (orders) => {
    const [next] = orders.filter((o) => o.deliveryDate >= FS.today())
      .sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate));
    if (!next) {
      byId('next').innerHTML = `<div>
          <h2 class="big-number" id="next-title">Nothing on the way</h2>
          <p class="muted mb-0">Surprise someone today: fresh flowers, delivered to their door.</p>
        </div>
        <div class="row"><a class="btn btn-light" href="catalog.html">Shop flowers ${FS.icon('arrow', 18)}</a></div>`;
      return;
    }
    const { id, deliveryDate, slot, recipient, items } = next;
    byId('next').innerHTML = `<h2 class="mb-0" id="next-title">Next delivery</h2>
      <div class="hero-row">
        <p class="big-number mb-0"><time datetime="${FS.esc(deliveryDate)}">${FS.esc(FS.fmtDate(deliveryDate))}</time> <small>${FS.esc(dayWord(deliveryDate))}</small></p>
        <div class="small">
          <p class="mb-0">For <strong>${FS.esc(recipient.name)}</strong></p>
          <p class="muted mb-0">${FS.esc(slot)}</p>
          <p class="muted mb-0">${FS.esc(itemsText(items))}</p>
        </div>
      </div>
      <div class="row">
        <a class="btn btn-light" href="order.html?id=${FS.esc(id)}">See order #${FS.esc(id)} ${FS.icon('arrow', 18)}</a>
        <a class="btn btn-outline-light" href="catalog.html">Order more</a>
      </div>`;
  };

  // Photo tiles of the six Indian favourites, each with its price and stock. A tile opens that flower in the shop.
  const renderIndian = (flowers) => {
    byId('indian').innerHTML = flowers.filter((f) => f.category === 'Indian favourites').map((f) =>
      `<a class="tile" href="catalog.html?flower=${FS.esc(f.id)}">${FS.flowerImg(f)}
        <span class="tile-name">${FS.esc(f.name)}</span>
        <span class="stock-pill">${FS.stockBadge(f)}</span>
        <span class="price-pill">${FS.money(f.price)}</span>
      </a>`).join('');
  };

  // One row per flower type: a photo, the type and how many flowers it has (counted with reduce).
  const renderTypes = (flowers) => {
    const counts = flowers.reduce((acc, f) => {
      acc[f.category] = (acc[f.category] || 0) + 1;
      return acc;
    }, {});
    byId('types').innerHTML = FS.CATEGORIES.map((type) => `<li>
        <a class="cell-flower" href="catalog.html?type=${encodeURIComponent(type)}">${FS.flowerImg(flowers.find((f) => f.category === type))}<strong>${FS.esc(type)}</strong></a>
        <span class="chip chip-light">${counts[type] || 0} flower${counts[type] === 1 ? '' : 's'}</span>
      </li>`).join('');
  };

  // The three newest orders, each one a link to its own page.
  const renderRecent = (orders) => {
    byId('recent').innerHTML = orders.length
      ? orders.slice(0, 3).map(({ id, items, deliveryDate, total }) =>
        `<a class="mini-order row between" href="order.html?id=${FS.esc(id)}">
          <span class="cell-flower">${FS.flowerImg(FS.getFlower(items[0].flowerId))}
            <span><strong>Order #${FS.esc(id)}</strong><br>
            <small class="muted">${FS.esc(itemsText(items))} · delivery <time datetime="${FS.esc(deliveryDate)}">${FS.esc(FS.fmtDate(deliveryDate))}</time></small></span>
          </span>
          <strong class="num">${FS.money(total)}</strong>
        </a>`).join('')
      : '<p class="muted mb-0">No orders yet. Once you send some flowers, they will show up here.</p>';
  };

  // Draws every live part of the page from the latest data.
  const render = () => {
    const orders = FS.getOrders();
    const flowers = FS.getFlowers();
    renderNext(orders);
    renderIndian(flowers);
    renderTypes(flowers);
    renderRecent(orders);
  };

  byId('hello').textContent = `${FS.greeting()}, ${user.name.split(' ')[0]}`;
  byId('tip').textContent = tipOfTheDay();
  render();
  window.addEventListener('fs:change', render);
});
