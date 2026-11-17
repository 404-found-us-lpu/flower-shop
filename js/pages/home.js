/* Made by: Raghav */
/* Home page script: fills in the greeting, next delivery, recent orders and tip of the day. */
/* (Indian favourites and Shop by type are plain HTML in home.html.) */

FS.ready((user) => {
  // Short helper: find an element by its id.
  const byId = (id) => document.getElementById(id);

  /* ---------- Small helpers ---------- */

  // Turns the flowers of one order into short text, like "Rose Bouquet × 2, Single Lily".
  const itemsText = (items) => {
    const parts = items.map(({ name, qty }) => (qty > 1 ? `${name} × ${qty}` : name));
    return parts.join(', ');
  };

  // Gives "Today", "Tomorrow" or the weekday name for a 'YYYY-MM-DD' date.
  const dayWord = (ymd) => {
    if (ymd === FS.today()) return 'Today';
    else if (ymd === FS.today(1)) return 'Tomorrow';

    return new Date(`${ymd}T00:00`).toLocaleDateString('en-IN', { weekday: 'long' });
  };

  // Picks one flower-care tip for each day of the week (getDay(): 0 = Sunday ... 6 = Saturday).
  const tipOfTheDay = () => {
    switch (new Date().getDay()) {
      case 0:
        return 'Cut the stems at a slant, under running water, so they drink better.';
      case 1:
        return 'Change the vase water every two days and rinse the vase each time.';
      case 2:
        return 'Keep bouquets away from fruit. Ripening fruit makes flowers fade faster.';
      case 3:
        return 'Pull off any leaves below the water line. They rot and cloud the water.';
      case 4:
        return 'Mogra and aprajita love the sun: give the pots at least four hours a day.';
      case 5:
        return 'Water potted plants in the morning, so the leaves dry before night.';
      default: // 6 = Saturday
        return 'Keep fresh flowers out of direct sun and away from the fan or the AC.';
    }
  };

  /* ---------- Next delivery (the dark card) ---------- */

  // Shows the nearest order arriving today or later, or a friendly nudge to go shopping.
  const renderNext = (orders) => {
    // Keep orders from today onwards, sort by date, and take the first one.
    const [next] = orders
      .filter((o) => o.deliveryDate >= FS.today())
      .sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate));

    // No upcoming order: show the "Nothing on the way" card.
    if (!next) {
      byId('next').innerHTML = `
        <div>
          <h2 class="big-number" id="next-title">Nothing on the way</h2>
          <p class="muted mb-0">Surprise someone today: fresh flowers, delivered to their door.</p>
        </div>
        <div class="row">
          <a class="btn btn-light" href="catalog.html">Shop flowers ${FS.icon('arrow', 18)}</a>
        </div>`;
      return;
    }

    // There is an upcoming order: show its date, who it is for, the time slot and the flowers.
    const { id, deliveryDate, slot, recipient, items } = next;

    byId('next').innerHTML = `
      <h2 class="mb-0" id="next-title">Next delivery</h2>
      <div class="hero-row">
        <p class="big-number mb-0">
          <time datetime="${FS.esc(deliveryDate)}">${FS.esc(FS.fmtDate(deliveryDate))}</time>
          <small>${FS.esc(dayWord(deliveryDate))}</small>
        </p>
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

  /* ---------- Recent orders ---------- */

  // Shows the three newest orders, each one a link to its own order page.
  const renderRecent = (orders) => {
    // No orders yet: show a short message instead of a list.
    if (!orders.length) {
      byId('recent').innerHTML = '<p class="muted mb-0">No orders yet. Once you send some flowers, they will show up here.</p>';
      return;
    }

    // One link card for each of the first three orders, joined into one HTML string.
    byId('recent').innerHTML = orders
      .slice(0, 3)
      .map(({ id, items, deliveryDate, total }) => `
        <a class="mini-order row between" href="order.html?id=${FS.esc(id)}">
          <span class="cell-flower">
            ${FS.flowerImg(FS.getFlower(items[0].flowerId))}
            <span>
              <strong>Order #${FS.esc(id)}</strong><br>
              <small class="muted">
                ${FS.esc(itemsText(items))} · delivery
                <time datetime="${FS.esc(deliveryDate)}">${FS.esc(FS.fmtDate(deliveryDate))}</time>
              </small>
            </span>
          </span>
          <strong class="num">${FS.money(total)}</strong>
        </a>`)
      .join('');
  };

  /* ---------- Start the page ---------- */

  // Draws both order parts of the page from the latest saved orders.
  const render = () => {
    const orders = FS.getOrders();
    renderNext(orders);
    renderRecent(orders);
  };

  // Greeting with the first name only, e.g. "Good morning, Neha".
  byId('hello').textContent = `${FS.greeting()}, ${user.name.split(' ')[0]}`;

  // Today's flower-care tip.
  byId('tip').textContent = tipOfTheDay();

  render();

  // Draw the orders again whenever saved data changes (for example in another tab).
  window.addEventListener('fs:change', render);
});
