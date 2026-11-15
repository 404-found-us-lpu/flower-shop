/* Made by: Raghav */
/* Bloom & Petal - js/pages/orders.js - the customer's own orders: tabs, order cards with photos and tracker, cancel. */
FS.ready(function (user) {
  const chipsBox = document.getElementById('order-chips');
  const tabsBox = document.getElementById('order-tabs');
  const listTitle = document.getElementById('list-title');
  const listBox = document.getElementById('order-list');
  const shown = {};   // the HTML last put into each box (see fill)
  let tab = 'all';    // the open tab: all, active, delivered or cancelled

  // The four tabs: which orders each one shows, and what to say when it has none.
  const TABS = {
    all: {
      title: 'All orders', icon: 'flower', test: function () { return true; },
      empty: 'No orders yet', text: 'Choose some flowers and your orders will show up here, from our workbench to the door.'
    },
    active: {
      title: 'Active orders', icon: 'truck', test: isActive,
      empty: 'Nothing on the way', text: 'You have no orders waiting, being prepared or out for delivery right now.'
    },
    delivered: {
      title: 'Delivered orders', icon: 'gift', test: function (o) { return o.status === 'Delivered'; },
      empty: 'Nothing delivered yet', text: 'Orders that reach their receiver are kept here.'
    },
    cancelled: {
      title: 'Cancelled orders', icon: 'receipt', test: function (o) { return o.status === 'Cancelled'; },
      empty: 'No cancelled orders', text: 'Orders you cancel will be listed here.'
    }
  };

  // An order that is still on its way (not delivered and not cancelled).
  function isActive(o) {
    return o.status !== 'Delivered' && o.status !== 'Cancelled';
  }

  // Puts HTML into a box only when it changed, so photos do not flicker on every data change.
  function fill(box, html) {
    if (shown[box.id] === html) return;
    shown[box.id] = html;
    box.innerHTML = html;
  }

  // "today", "tomorrow" or a date like "18 Nov 2026".
  function dayText(date) {
    if (date === FS.today(0)) return 'today';
    if (date === FS.today(1)) return 'tomorrow';
    return FS.fmtDate(date);
  }

  // When the order reached the status it has now.
  function changedAt(o) {
    const step = o.history.filter(function (h) { return h.status === o.status; }).pop();
    return step ? step.at : o.createdAt;
  }

  // Small flower photos: all of them when there are up to 3, else 2 photos and a "+N" bubble.
  function thumbsHTML(o) {
    const many = o.items.length > 3;
    const photos = (many ? o.items.slice(0, 2) : o.items).map(function (item) {
      const flower = FS.getFlower(item.flowerId);
      return FS.flowerImg({ name: item.name, image: flower ? flower.image : '' });
    });
    if (many) photos.push('<span class="ph strong" aria-hidden="true">+' + (o.items.length - 2) + '</span>');
    return photos.join('');
  }

  // "Pink Tulip Bunch, Single Sunflower × 3"
  function namesHTML(o) {
    return o.items.map(function (item) {
      return FS.esc(item.name) + (item.qty > 1 ? ' <span class="muted">× ' + FS.esc(item.qty) + '</span>' : '');
    }).join(', ');
  }

  // When it will arrive, or when it was delivered or cancelled.
  function whenHTML(o) {
    if (o.status === 'Delivered') return FS.icon('check', 16) + ' Delivered ' + FS.fmtDateTime(changedAt(o));
    if (o.status === 'Cancelled') return FS.icon('x', 16) + ' Cancelled ' + FS.fmtDateTime(changedAt(o));
    const late = o.deliveryDate < FS.today(0);
    return FS.icon('calendar', 16) + (late ? ' Was due ' : ' Arriving ') + dayText(o.deliveryDate) + ', ' + FS.esc(o.slot);
  }

  // One order as a card: number, total, status, photos, tracker (while active) and buttons.
  function orderCard(o) {
    const id = FS.esc(o.id);
    const count = o.items.reduce(function (sum, item) { return sum + item.qty; }, 0);   // 2 roses and 1 lily = 3
    const receiver = o.recipient.name === user.name ? 'you' : o.recipient.name;
    const cancel = FS.canCancel(o)
      ? `<button type="button" class="btn btn-soft-danger btn-sm" data-cancel="${id}">Cancel</button>`
      : '';
    return `
      <article class="card card-sm stack" aria-labelledby="order-${id}">
        <div>
          <div class="row between">
            <h3 class="mb-0" id="order-${id}">Order #${id}</h3>
            <span class="product-price">${FS.money(o.total)}</span>
          </div>
          <div class="row small muted" style="margin-top: 6px">${FS.badge(o.status)}<span>Placed ${FS.fmtDate(o.createdAt)}</span></div>
        </div>
        <div class="cell-flower">
          ${thumbsHTML(o)}
          <div>
            <div class="cell-main">${namesHTML(o)}</div>
            <div class="cell-sub">${FS.esc(count)} ${count === 1 ? 'item' : 'items'} for ${FS.esc(receiver)}</div>
          </div>
        </div>
        ${isActive(o) ? FS.trackerHTML(o) : ''}
        <div class="row between">
          <p class="muted small mb-0">${whenHTML(o)}</p>
          <div class="row">
            ${cancel}
            <a class="btn btn-ghost btn-sm" href="order.html?id=${id}">View details ${FS.icon('arrow', 16)}</a>
          </div>
        </div>
      </article>`;
  }

  // The message for a tab with no orders.
  function emptyHTML() {
    const t = TABS[tab];
    return `
      <div class="card empty">
        <span class="empty-icon">${FS.icon(t.icon, 28)}</span>
        <h3>${t.empty}</h3>
        <p>${t.text}</p>
        <a class="btn btn-primary" href="catalog.html">${FS.icon('flower', 18)} Browse flowers</a>
      </div>`;
  }

  // Draws the hero chips, the tab counts and the cards of the open tab.
  function render() {
    const orders = FS.getOrders();
    const count = {};
    Object.keys(TABS).forEach(function (key) { count[key] = orders.filter(TABS[key].test).length; });

    fill(chipsBox,
      `<span class="chip chip-gold">${FS.icon('truck', 16)} ${count.active} active</span>` +
      `<span class="chip">${FS.icon('check', 16)} ${count.delivered} delivered</span>`);

    tabsBox.querySelectorAll('.tab').forEach(function (button) {
      const open = button.dataset.tab === tab;
      button.classList.toggle('active', open);
      button.setAttribute('aria-pressed', String(open));
      button.querySelector('.count').textContent = count[button.dataset.tab];
    });

    listTitle.textContent = TABS[tab].title;
    const list = orders.filter(TABS[tab].test);
    fill(listBox, list.length ? list.map(orderCard).join('') : emptyHTML());
  }

  // Asks first, then cancels. The list redraws itself through the fs:change event.
  function cancelOrder(id) {
    FS.confirm('Order #' + id + ' will be cancelled and the flowers go back to the shop. This cannot be undone.',
      { title: 'Cancel this order?', okText: 'Cancel order', cancelText: 'Keep order', danger: true })
      .then(function (yes) {
        if (!yes) return;
        const result = FS.setOrderStatus(id, 'Cancelled', 'Cancelled by customer');
        if (result.ok) FS.toast('Order #' + id + ' was cancelled.');
        else FS.toast(result.error, 'error');
      });
  }

  // Tab buttons
  tabsBox.addEventListener('click', function (e) {
    const button = e.target.closest('.tab');
    if (!button) return;
    tab = button.dataset.tab;
    render();
  });

  // Cancel buttons on the cards (one listener for the whole list)
  listBox.addEventListener('click', function (e) {
    const button = e.target.closest('[data-cancel]');
    if (button) cancelOrder(Number(button.dataset.cancel));
  });

  window.addEventListener('fs:change', render);
  render();
});
