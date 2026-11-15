/* Made by: Satyam */
/* Bloom & Petal - js/pages/manage-orders.js - every order in one table: search, status tabs,
   a date filter and quick buttons that move an order to its next status. */
FS.ready(function () {
  const TABS = ['All'].concat(FS.STATUSES, ['Cancelled']);
  const search = document.getElementById('q');
  const when = document.getElementById('when');
  const tabs = document.getElementById('tabs');
  const results = document.getElementById('results');
  const asked = FS.params().get('status');            // manage-orders.html?status=Pending opens that tab
  let status = TABS.includes(asked) ? asked : 'All';

  // "Today", "Tomorrow" or a date such as "17 Nov 2026".
  function dayLabel(date) {
    if (date === FS.today(0)) return 'Today';
    if (date === FS.today(1)) return 'Tomorrow';
    return FS.fmtDate(date);
  }

  // How many flowers are in an order (every flower, not every line).
  function itemCount(order) {
    return order.items.reduce(function (sum, item) { return sum + item.qty; }, 0);
  }

  // Still being worked on: not delivered and not cancelled.
  function isOpen(order) {
    return order.status !== 'Delivered' && order.status !== 'Cancelled';
  }

  // The next step forward for an order (cancelling has its own button).
  function nextStep(order) {
    return FS.nextStatuses(order).filter(function (s) { return s !== 'Cancelled'; })[0];
  }

  // Start of the chosen period (1 = since midnight today), or null for "Any time".
  function periodStart(days) {
    return days ? new Date(FS.today(1 - days) + 'T00:00:00') : null;
  }

  // True when the search text is in the order number, the customer's name or the receiver's name.
  function matches(order, text) {
    return ('#' + order.id + ' ' + order.customer + ' ' + order.recipient.name).toLowerCase().includes(text);
  }

  // The buttons at the end of a row: move on, cancel (when allowed) and view.
  function actionsHTML(o) {
    const next = nextStep(o);
    let html = '';
    if (next) {
      html += `<button type="button" class="btn btn-ghost btn-sm" data-id="${o.id}" data-to="${FS.esc(next)}">Move to ${FS.esc(next)}</button>`;
    }
    if (FS.canCancel(o)) {
      html += `<button type="button" class="btn-icon danger" data-id="${o.id}" data-to="Cancelled" aria-label="Cancel order #${o.id}" title="Cancel order">${FS.icon('x', 16)}</button>`;
    }
    html += `<a class="btn-icon" href="order.html?id=${o.id}" aria-label="View order #${o.id}" title="View order">${FS.icon('eye', 16)}</a>`;
    return html;
  }

  // One table row. A click on the row (but not on its buttons) opens the order.
  function rowHTML(o) {
    const receiver = o.recipient.name !== o.customer ? `<div class="cell-sub">To ${FS.esc(o.recipient.name)}</div>` : '';
    return `<tr class="clickable" data-id="${o.id}">
        <td><div class="cell-main">#${o.id}</div><div class="cell-sub">Placed ${FS.timeAgo(o.createdAt)}</div></td>
        <td><div class="cell-main">${FS.esc(o.customer)}</div>${receiver}</td>
        <td><div>${dayLabel(o.deliveryDate)}</div><div class="cell-sub">${FS.esc(o.slot)}</div></td>
        <td class="num">${itemCount(o)}</td>
        <td class="right num strong">${FS.money(o.total)}</td>
        <td>${FS.badge(o.status)}</td>
        <td><div class="t-actions">${actionsHTML(o)}</div></td>
      </tr>`;
  }

  // The table, or a friendly message when there is nothing to show.
  function resultsHTML(list, total) {
    if (!total) {
      return `<div class="empty"><span class="empty-icon">${FS.icon('receipt', 28)}</span><h3>No orders yet</h3>
          <p>When customers order flowers, their orders will show up here.</p>
          <a class="btn btn-primary btn-sm" href="stock.html">Check the stock</a></div>`;
    }
    if (!list.length) {
      return `<div class="empty"><span class="empty-icon">${FS.icon('search', 28)}</span><h3>No orders match</h3>
          <p>Try another name or order number, or clear the filters.</p>
          <button type="button" class="btn btn-primary btn-sm" data-act="clear">Clear filters</button></div>`;
    }
    return `<div class="table-wrap"><table class="table">
        <thead><tr><th scope="col">Order</th><th scope="col">Customer</th><th scope="col">Delivery</th><th scope="col">Items</th>
          <th scope="col" class="right">Total</th><th scope="col">Status</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>
        <tbody>${list.map(rowHTML).join('')}</tbody>
      </table></div>`;
  }

  // Draws the chip, the tab numbers and the table from the saved data. Runs again on every change.
  function render() {
    const me = FS.currentUser();
    if (!me || me.role === 'customer') { location.reload(); return; }   // role changed in another tab: the page guard sends them on
    const all = FS.getOrders();
    const text = search.value.trim().toLowerCase();
    const from = periodStart(Number(when.value));
    const found = all.filter(function (o) { return matches(o, text) && (!from || new Date(o.createdAt) >= from); });
    const shown = status === 'All' ? found : found.filter(function (o) { return o.status === status; });
    const open = all.filter(isOpen).length;

    document.getElementById('open-chip').innerHTML = FS.icon('clock', 16) +
      (open ? open + (open === 1 ? ' open order' : ' open orders') : 'No open orders');
    tabs.querySelectorAll('.tab').forEach(function (tab) {
      const s = tab.dataset.status;
      tab.querySelector('.count').textContent = s === 'All' ? found.length : found.filter(function (o) { return o.status === s; }).length;
      tab.classList.toggle('active', s === status);
      tab.setAttribute('aria-pressed', String(s === status));
    });
    results.innerHTML = resultsHTML(shown, all.length);
  }

  // Back to every order: empty search, any time, the "All" tab.
  function clearFilters() {
    search.value = '';
    when.value = '0';
    status = 'All';
    render();
    search.focus();
  }

  // Moves an order to a new status. Cancelling asks first, because it cannot be undone.
  function moveOrder(id, to, fromKeyboard) {
    const ask = to === 'Cancelled'
      ? FS.confirm('Its flowers go back into stock and the customer is told. This cannot be undone.',
          { title: `Cancel order #${id}?`, okText: 'Cancel order', cancelText: 'Keep order', danger: true })
      : Promise.resolve(true);
    ask.then(function (yes) {
      if (!yes) return;
      const result = FS.setOrderStatus(id, to, to === 'Cancelled' ? 'Cancelled by the shop' : '');
      if (!result.ok) { FS.toast(result.error, 'error'); return; }
      FS.toast(to === 'Cancelled' ? `Order #${id} was cancelled. Its flowers are back in stock.` : `Order #${id} moved to ${to}.`);
      if (fromKeyboard) {                    // keep keyboard focus on the same row when it is still shown
        const again = results.querySelector(`tr[data-id="${id}"] .t-actions button, tr[data-id="${id}"] .t-actions a`);
        if (again) again.focus();
      }
    });
  }

  // Status tabs are made once; render() only updates their numbers and the active one.
  tabs.innerHTML = TABS.map(function (s) {
    return `<button type="button" class="tab" data-status="${FS.esc(s)}" aria-pressed="false">${FS.esc(s)}<span class="count">0</span></button>`;
  }).join('');

  search.addEventListener('input', render);
  when.addEventListener('change', render);
  tabs.addEventListener('click', function (e) {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    status = tab.dataset.status;
    render();
  });

  // Clicks in the table: action buttons, "Clear filters", or anywhere else on a row to open the order.
  results.addEventListener('click', function (e) {
    const move = e.target.closest('button[data-to]');
    if (move) {
      if (e.detail < 2) moveOrder(move.dataset.id, move.dataset.to, e.detail === 0);   // a double click must not move two steps
      return;
    }
    if (e.target.closest('[data-act="clear"]')) { clearFilters(); return; }
    if (e.target.closest('a, button')) return;   // links do their own job
    const row = e.target.closest('tr[data-id]');
    if (row) location.href = 'order.html?id=' + row.dataset.id;
  });

  render();
  window.addEventListener('fs:change', render);
});
