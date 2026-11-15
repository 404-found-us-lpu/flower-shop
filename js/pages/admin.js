/* Made by: Satyam */
/* Bloom & Petal - js/pages/admin.js - the shop owner's dashboard: sales, open orders, stock and best sellers. */
FS.ready(function () {
  // Today's date above the greeting, for example "Sunday, 15 November"
  byId('today').innerHTML = FS.icon('calendar', 16) +
    FS.esc(new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }));
  addIcons();
  render();
  window.addEventListener('fs:change', render);   // data changed here or in another tab: draw again

  // A click anywhere on a recent order row opens that order (the order number is also a real link)
  byId('recent').addEventListener('click', function (e) {
    const row = e.target.closest('tr[data-id]');
    if (row && !e.target.closest('a')) location.href = 'order.html?id=' + encodeURIComponent(row.dataset.id);
  });

  // Draws every part of the dashboard from the latest data
  function render() {
    const me = FS.currentUser();
    const s = FS.stats();
    if (!me || !s) return;                          // the page guard already sends everyone else away
    byId('welcome').textContent = 'Welcome, ' + me.name.split(' ')[0];
    byId('open-chip').innerHTML = FS.icon('clock', 16) + plural(s.open, 'open order');
    renderSales(s);
    renderDays();
    renderStatus(s);
    renderRecent();
    renderLowStock(s.lowStock);
    renderTopFlowers(s.topFlowers);
  }

  // The dark card: money taken so far and three small numbers
  function renderSales(s) {
    const pending = s.byStatus.Pending || 0;
    const low = s.lowStock.length;
    byId('revenue').innerHTML = FS.money(s.revenue) + '<small>INR</small>';
    byId('revenue-note').textContent = plural(s.paidOrders, 'order') + ' · average ' + FS.money(s.average);
    byId('dark-stats').innerHTML =
      darkStat('clock', 'Open orders', s.open, pending ? pending + ' waiting to be confirmed' : 'None waiting to be confirmed') +
      darkStat('users', 'Customers', s.customers, s.topCustomers.length + ' with orders') +
      darkStat('alert', 'Low stock', low, low ? FS.LOW_STOCK + ' or fewer left' : 'Every flower is well stocked');
  }

  // One small number box for the dark card
  function darkStat(icon, label, value, note) {
    return `<div class="stat stat-dark"><span class="stat-label">${FS.icon(icon, 16)}${FS.esc(label)}</span>` +
      `<span class="stat-value">${FS.esc(value)}</span><span class="stat-note">${FS.esc(note)}</span></div>`;
  }

  // "Last 14 days": one column a day, with the totals underneath
  function renderDays() {
    const days = FS.dailySales(14);
    const total = days.reduce((sum, d) => sum + d.revenue, 0);
    const orders = days.reduce((sum, d) => sum + d.orders, 0);
    byId('days-range').textContent = days[0].label + ' – ' + days[days.length - 1].label + ' · one column a day';
    if (!total) {
      byId('days').innerHTML = emptyHTML('chart', 'No sales in the last 14 days', 'New orders will show up here day by day.',
        '<a class="btn btn-ghost btn-sm" href="reports.html">See older sales</a>');
      return;
    }
    const best = days.reduce((a, b) => (b.revenue > a.revenue ? b : a));
    byId('days').innerHTML = FS.colsHTML(days.map(d => ({
      label: String(Number(d.date.slice(8))),        // only the day number, so 14 columns fit on a phone
      value: d.revenue,
      title: d.label + ': ' + FS.money(d.revenue) + ' from ' + plural(d.orders, 'order')
    }))) +
      `<div class="legend"><span>14-day total <strong>${FS.money(total)}</strong></span><span>${plural(orders, 'order')}</span>` +
      `<span>Best day <strong>${FS.esc(best.label)}</strong> with ${FS.money(best.revenue)}</span></div>`;
  }

  // "Orders by status": how many orders sit at each step
  function renderStatus(s) {
    byId('status-total').textContent = plural(s.orders, 'order') + ' in all';
    byId('status').innerHTML = s.orders
      ? FS.barsHTML(FS.STATUSES.concat('Cancelled').map(st => ({ label: st, value: s.byStatus[st] || 0 })))
      : emptyHTML('receipt', 'No orders yet', 'Each new order shows up here with its status.');
  }

  // "Recent orders": the six newest orders
  function renderRecent() {
    const list = FS.getOrders().slice(0, 6);
    if (!list.length) {
      byId('recent').innerHTML = emptyHTML('receipt', 'No orders yet', 'When customers buy flowers, the newest orders show up here.',
        '<a class="btn btn-primary btn-sm" href="stock.html">Check the stock</a>');
      return;
    }
    byId('recent').innerHTML = '<div class="table-wrap"><table class="table"><thead><tr><th scope="col">Order</th>' +
      '<th scope="col">Customer</th><th scope="col" class="right">Total</th><th scope="col">Status</th></tr></thead><tbody>' +
      list.map(o => `<tr class="clickable" data-id="${FS.esc(o.id)}">` +
        `<td><a class="cell-main" href="order.html?id=${encodeURIComponent(o.id)}">#${FS.esc(o.id)}</a><div class="cell-sub">${FS.esc(FS.timeAgo(o.createdAt))}</div></td>` +
        `<td><div class="cell-main">${FS.esc(o.customer)}</div><div class="cell-sub">${plural(itemCount(o), 'item')}</div></td>` +
        `<td class="right num strong">${FS.money(o.total)}</td><td>${FS.badge(o.status)}</td></tr>`).join('') +
      '</tbody></table></div>';
  }

  // "Low stock": flowers with FS.LOW_STOCK or fewer left, fewest first
  function renderLowStock(list) {
    if (!list.length) {
      byId('low').innerHTML = emptyHTML('check', 'Stock looks healthy', 'Every flower has more than ' + FS.LOW_STOCK + ' left.');
      return;
    }
    byId('low').innerHTML = '<ul class="list">' + list.slice(0, 6).map(f => `<li><div class="cell-flower">${FS.flowerImg(f)}` +
      `<div><div class="cell-main">${FS.esc(f.name)}</div><div class="cell-sub">${FS.esc(f.category)} · ${FS.money(f.price)}</div></div></div>` +
      `${FS.stockBadge(f)}</li>`).join('') + '</ul>' +
      (list.length > 6 ? `<p class="muted small mb-0">And ${list.length - 6} more on the stock page.</p>` : '');
  }

  // "Top flowers": the five that sold the most units
  function renderTopFlowers(list) {
    byId('top').innerHTML = list.length
      ? FS.barsHTML(list.slice(0, 5).map(f => ({ label: f.name, value: f.qty, display: f.qty + ' sold' })))
      : emptyHTML('flower', 'No sales yet', 'Your best sellers show up after the first order.');
  }

  /* ---- small helpers ---- */
  function byId(id) { return document.getElementById(id); }

  // "1 order", "3 orders"
  function plural(n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); }

  // How many flowers are in an order
  function itemCount(order) { return order.items.reduce((sum, i) => sum + i.qty, 0); }

  // A friendly message for an empty card, with an optional button
  function emptyHTML(icon, title, text, button) {
    return `<div class="empty"><div class="empty-icon">${FS.icon(icon, 26)}</div><h3>${FS.esc(title)}</h3>` +
      `<p>${FS.esc(text)}</p>${button || ''}</div>`;
  }

  // Puts the icon named in data-icon at the start of an element, and an arrow after each "link-arrow"
  function addIcons() {
    document.querySelectorAll('#main [data-icon]').forEach(el =>
      el.insertAdjacentHTML('afterbegin', FS.icon(el.dataset.icon, Number(el.dataset.size) || 18)));
    document.querySelectorAll('#main .link-arrow').forEach(el => el.insertAdjacentHTML('beforeend', FS.icon('arrow', 16)));
  }
});
