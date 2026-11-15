/* Made by: Satyam */
/* Bloom & Petal - js/pages/staff.js - the florist's work board: today's numbers, the order board,
   flowers running low and today's deliveries. */
FS.ready(function () {
  const BOARD_STATUSES = FS.STATUSES.slice(0, 4);   // Pending, Confirmed, Preparing, Out for delivery
  const board = document.getElementById('board');

  // "Good morning", "Good afternoon" or "Good evening", by the clock.
  function greeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  // True when a date or a time falls on today's date.
  function isToday(value) {
    return FS.fmtDate(value) === FS.fmtDate(FS.today(0));
  }

  // "Today", "Tomorrow" or a date such as "17 Nov 2026".
  function dayLabel(date) {
    if (date === FS.today(0)) return 'Today';
    if (date === FS.today(1)) return 'Tomorrow';
    return FS.fmtDate(date);
  }

  // "1 item" or "4 items" (counts every flower, not every line).
  function itemsText(order) {
    const n = order.items.reduce(function (sum, item) { return sum + item.qty; }, 0);
    return n + (n === 1 ? ' item' : ' items');
  }

  // The next step forward for an order. The board never offers "Cancelled".
  function nextStep(order) {
    return FS.nextStatuses(order).filter(function (s) { return s !== 'Cancelled'; })[0];
  }

  // Sort helper: soonest delivery first (by date, then by time slot).
  function bySoonest(a, b) {
    if (a.deliveryDate !== b.deliveryDate) return a.deliveryDate < b.deliveryDate ? -1 : 1;
    return FS.SLOTS.indexOf(a.slot) - FS.SLOTS.indexOf(b.slot);
  }

  // How many orders have this status.
  function countOf(orders, status) {
    return orders.filter(function (o) { return o.status === status; }).length;
  }

  // Green band: greeting with the first name, and two chips.
  function renderHero(me, orders) {
    const toConfirm = countOf(orders, 'Pending');
    const dueToday = orders.filter(function (o) {
      return o.deliveryDate === FS.today(0) && o.status !== 'Delivered' && o.status !== 'Cancelled';
    }).length;
    document.getElementById('greeting').textContent = greeting() + ', ' + me.name.split(' ')[0];
    document.getElementById('hero-chips').innerHTML =
      `<span class="chip chip-gold">${FS.icon('bell', 16)}${toConfirm ? toConfirm + ' to confirm' : 'Nothing to confirm'}</span>` +
      `<span class="chip">${FS.icon('truck', 16)}${dueToday ? dueToday + ' due today' : 'Nothing due today'}</span>`;
  }

  // Dark card: four numbers for today.
  function renderStats(orders) {
    const deliveredToday = orders.filter(function (o) {
      return o.status === 'Delivered' && isToday(o.history[o.history.length - 1].at);
    }).length;
    const tiles = [
      { icon: 'bell', label: 'To confirm', value: countOf(orders, 'Pending'), note: 'New orders waiting' },
      { icon: 'flower', label: 'Preparing', value: countOf(orders, 'Confirmed') + countOf(orders, 'Preparing'), note: 'Confirmed or on the table' },
      { icon: 'truck', label: 'Out for delivery', value: countOf(orders, 'Out for delivery'), note: 'On the road now' },
      { icon: 'check', label: 'Delivered today', value: deliveredToday, note: 'Handed over today' }
    ];
    document.getElementById('stats').innerHTML = tiles.map(function (t) {
      return `<div class="stat stat-dark"><span class="stat-label">${FS.icon(t.icon, 16)}${t.label}</span>` +
        `<span class="stat-value">${t.value}</span><span class="stat-note">${t.note}</span></div>`;
    }).join('');
  }

  // One small order card on the board, with its "Move to ..." button.
  function cardHTML(o) {
    const next = nextStep(o);
    const button = next
      ? `<button type="button" class="btn btn-primary btn-sm btn-block" data-id="${o.id}" data-to="${FS.esc(next)}">Move to ${FS.esc(next)}</button>`
      : '';
    return `<article class="card card-sm summary">
        <div class="summary-line"><a class="strong" href="order.html?id=${o.id}">#${o.id}</a><span class="strong">${FS.money(o.total)}</span></div>
        <div><div class="cell-main">${FS.esc(o.customer)}</div><div class="cell-sub">${itemsText(o)}</div></div>
        <div class="cell-sub">${FS.icon('calendar', 14)} ${dayLabel(o.deliveryDate)} · ${FS.esc(o.slot)}</div>
        ${button}
      </article>`;
  }

  // The four columns of the board, each with its orders or "All clear".
  function renderBoard(orders) {
    board.innerHTML = BOARD_STATUSES.map(function (status) {
      const list = orders.filter(function (o) { return o.status === status; }).sort(bySoonest);
      const cards = list.length
        ? list.map(cardHTML).join('')
        : `<div class="empty"><span class="empty-icon">${FS.icon('check', 24)}</span><p>All clear</p></div>`;
      return `<section class="stack">
          <div class="row between"><h3 class="mb-0">${status}</h3><span class="chip ${list.length ? 'chip-gold' : 'chip-light'}">${list.length}</span></div>
          ${cards}
        </section>`;
    }).join('');
  }

  // Flowers with only a few left (FS.stats() lists them, fewest first).
  function renderLowStock() {
    const low = FS.stats().lowStock;
    const box = document.getElementById('low-stock');
    if (!low.length) {
      box.innerHTML = `<div class="empty"><span class="empty-icon">${FS.icon('check', 26)}</span><h3>Stock looks healthy</h3>` +
        `<p>Every flower has more than ${FS.LOW_STOCK} left.</p></div>`;
      return;
    }
    box.innerHTML = '<ul class="list">' + low.map(function (f) {
      return `<li><div class="cell-flower">${FS.flowerImg(f)}<div><div class="cell-main">${FS.esc(f.name)}</div>` +
        `<div class="cell-sub">${FS.esc(f.category)} · ${FS.money(f.price)}</div></div></div>${FS.stockBadge(f)}</li>`;
    }).join('') + '</ul>';
  }

  // Orders to be delivered today (cancelled ones left out), by time slot.
  function renderDeliveries(orders) {
    const list = orders.filter(function (o) {
      return o.deliveryDate === FS.today(0) && o.status !== 'Cancelled';
    }).sort(bySoonest);
    const box = document.getElementById('deliveries');
    if (!list.length) {
      box.innerHTML = `<div class="empty"><span class="empty-icon">${FS.icon('calendar', 26)}</span><h3>No deliveries today</h3>` +
        '<p>Orders that are due today will show up here.</p></div>';
      return;
    }
    box.innerHTML = '<div class="stack">' + list.map(function (o) {
      return `<a class="mini-order between" href="order.html?id=${o.id}"><div><div class="cell-main">#${o.id} · ${FS.esc(o.recipient.name)}</div>` +
        `<div class="cell-sub">${FS.esc(o.slot)}</div></div>${FS.badge(o.status)}</a>`;
    }).join('') + '</div>';
  }

  // Draws the whole page from the saved data. Runs again on every fs:change.
  function render() {
    const me = FS.currentUser();
    if (!me || me.role !== 'florist') { location.reload(); return; }   // role changed in another tab: the page guard sends them on
    const orders = FS.getOrders();
    renderHero(me, orders);
    renderStats(orders);
    renderBoard(orders);
    renderLowStock();
    renderDeliveries(orders);
  }

  // One click on "Move to ..." moves that order one step on (one listener for the whole board).
  board.addEventListener('click', function (e) {
    const button = e.target.closest('button[data-to]');
    if (!button || e.detail > 1) return;   // the 2nd click of a double click would land on the next card
    const id = button.dataset.id;
    const result = FS.setOrderStatus(id, button.dataset.to);
    if (!result.ok) { FS.toast(result.error, 'error'); return; }
    FS.toast(`Order #${id} moved to ${result.order.status}.`);
    if (e.detail === 0) {                  // keyboard user: keep focus on the same order in its new column
      const again = board.querySelector(`button[data-id="${id}"]`);
      if (again) again.focus();
    }
  });

  // Small arrow after each "link-arrow" text link.
  document.querySelectorAll('.link-arrow').forEach(function (a) { a.insertAdjacentHTML('beforeend', FS.icon('arrow', 18)); });
  document.getElementById('today-date').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  render();
  window.addEventListener('fs:change', render);
});
