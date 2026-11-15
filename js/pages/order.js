/* Made by: Raghav */
/* Bloom & Petal - js/pages/order.js - one order: tracker, flowers, delivery details, history, and the cancel or status buttons. */
FS.ready(function (user) {
  const id = Number(FS.params().get('id'));
  const isCustomer = user.role === 'customer';
  const back = isCustomer ? { href: 'orders.html', label: 'My orders' } : { href: 'manage-orders.html', label: 'Orders' };
  const hero = document.getElementById('order-hero');
  const head = document.getElementById('order-head');
  const pull = document.getElementById('order-pull');
  const body = document.getElementById('order-body');
  const shown = {};     // the HTML last put into each part of the page (see fill)
  let draftNote = '';   // what the florist typed in the note box, kept when the page redraws

  // Icon for each status (used in the hero chip).
  const STATUS_ICON = {
    'Pending': 'clock', 'Confirmed': 'check', 'Preparing': 'flower',
    'Out for delivery': 'truck', 'Delivered': 'gift', 'Cancelled': 'x'
  };

  // The big line on the dark card (Out for delivery and Delivered are in headline()).
  const HEADLINES = {
    'Pending': 'Waiting for the shop to confirm',
    'Confirmed': 'Confirmed by the shop',
    'Preparing': 'Being made by our florists',
    'Cancelled': 'Order cancelled'
  };

  // Why a customer can no longer cancel.
  const WHY_NOT = {
    'Preparing': 'Our florists have started on this order, so it can no longer be cancelled.',
    'Out for delivery': 'This order is already on its way, so it can no longer be cancelled.',
    'Delivered': 'This order has been delivered. We hope they loved it.',
    'Cancelled': 'This order was cancelled, so there is nothing more to do.'
  };

  // Puts HTML into a part of the page only when it changed. Returns true when it did.
  function fill(box, html) {
    if (shown[box.id] === html) return false;
    shown[box.id] = html;
    box.innerHTML = html;
    return true;
  }

  // "today", "tomorrow" or a date like "18 Nov 2026".
  function dayText(date) {
    if (date === FS.today(0)) return 'today';
    if (date === FS.today(1)) return 'tomorrow';
    return FS.fmtDate(date);
  }

  // How many flowers are in the order (2 roses and 1 lily = 3).
  function itemCount(order) {
    return order.items.reduce(function (sum, item) { return sum + item.qty; }, 0);
  }

  // "1 item" or "4 items"
  function itemsText(count) {
    return FS.esc(count) + (count === 1 ? ' item' : ' items');
  }

  // The history entry that set the present status (who did it and when).
  function lastStep(order) {
    const step = order.history.filter(function (h) { return h.status === order.status; }).pop();
    return step || { at: order.createdAt, by: order.customer };
  }

  // The big line on the dark card.
  function headline(order) {
    const first = order.recipient.name.split(' ')[0];
    if (order.status === 'Out for delivery') return 'On its way to ' + first;
    if (order.status === 'Delivered') return 'Delivered to ' + first;
    return HEADLINES[order.status] || order.status;
  }

  // "Arriving tomorrow, Morning (9 am - 12 pm)." or when it was delivered or cancelled.
  function deliveryLine(order) {
    const step = lastStep(order);
    if (order.status === 'Delivered') return FS.icon('check', 18) + ' Delivered on ' + FS.fmtDateTime(step.at) + '.';
    if (order.status === 'Cancelled') return FS.icon('x', 18) + ' Cancelled on ' + FS.fmtDateTime(step.at) + ' by ' + FS.esc(step.by) + '.';
    const late = order.deliveryDate < FS.today(0);
    return FS.icon('calendar', 18) + (late ? ' Was due ' : ' Arriving ') + dayText(order.deliveryDate) + ', ' + FS.esc(order.slot) + '.';
  }

  // "My orders / Order #1007" above the title (the shop team sees "Orders").
  function crumbsHTML(current) {
    return `
      <nav class="crumbs no-print" aria-label="Breadcrumb">
        <a href="${back.href}">${back.label}</a><span aria-hidden="true">/</span><span aria-current="page">${current}</span>
      </nav>`;
  }

  // Green hero: crumbs, title, date and chips.
  function headHTML(order) {
    const chips = [
      `<span class="chip chip-gold">${FS.icon(STATUS_ICON[order.status] || 'clock', 16)} ${FS.esc(order.status)}</span>`,
      `<span class="chip">${FS.icon('receipt', 16)} ${FS.esc(order.payment)}</span>`
    ];
    if (!isCustomer) chips.push(`<span class="chip">${FS.icon('user', 16)} ${FS.esc(order.customer)}</span>`);
    return `
      ${crumbsHTML('Order #' + FS.esc(order.id))}
      <h1>Order #${FS.esc(order.id)}</h1>
      <p class="hero-sub">Placed ${FS.fmtDate(order.createdAt)} at ${FS.fmtTime(order.createdAt)} · ${itemsText(itemCount(order))}</p>
      <div class="chips no-print">${chips.join('')}</div>`;
  }

  // The dark card over the hero: headline, total, the 5-step tracker and when it arrives.
  function pullHTML(order) {
    return `
      <div class="card-dark stack-lg">
        <div class="row between">
          <div>
            <span class="hero-eyebrow">${FS.icon('truck', 16)} Order progress</span>
            <h2 class="mb-0">${FS.esc(headline(order))}</h2>
          </div>
          <div class="stat stat-dark">
            <span class="stat-label">${FS.icon('receipt', 16)} Order total</span>
            <span class="stat-value">${FS.money(order.total)}</span>
            <span class="stat-note">${FS.esc(order.payment)}</span>
          </div>
        </div>
        ${FS.trackerHTML(order)}
        <p class="muted mb-0">${deliveryLine(order)}</p>
      </div>`;
  }

  // Card with the flowers in the order and the money summary.
  function itemsCard(order) {
    const count = itemCount(order);
    const rows = order.items.map(function (item) {
      const flower = FS.getFlower(item.flowerId);
      const photo = FS.flowerImg({ name: item.name, image: flower ? flower.image : '' });
      return `
        <tr>
          <td><div class="cell-flower">${photo}<div><div class="cell-main">${FS.esc(item.name)}</div><div class="cell-sub">${FS.esc(flower ? flower.category : 'Flowers')}</div></div></div></td>
          <td class="right num">${FS.esc(item.qty)}</td>
          <td class="right num">${FS.money(item.price)}</td>
          <td class="right num strong">${FS.money(item.price * item.qty)}</td>
        </tr>`;
    }).join('');
    return `
      <section class="card" aria-labelledby="items-title">
        <div class="card-head">
          <h2 class="card-title" id="items-title">Items</h2>
          <span class="muted">${itemsText(count)}</span>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th scope="col">Flower</th><th scope="col" class="right">Qty</th><th scope="col" class="right">Price</th><th scope="col" class="right">Total</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <hr class="divider">
        <div class="summary">
          <div class="summary-line"><span class="muted">Items (${FS.esc(count)})</span><span>${FS.money(order.subtotal)}</span></div>
          <div class="summary-line"><span class="muted">Delivery</span><span>${order.delivery ? FS.money(order.delivery) : 'Free'}</span></div>
          <div class="summary-total"><span>Total</span><span class="serif">${FS.money(order.total)}</span></div>
        </div>
      </section>`;
  }

  // Card with who gets the flowers, where and when.
  function deliveryCard(order) {
    const r = order.recipient;
    const message = order.note
      ? `<span class="serif">“${FS.esc(order.note)}”</span>`
      : '<span class="muted">No card message</span>';
    return `
      <section class="card" aria-labelledby="delivery-title">
        <div class="card-head"><h2 class="card-title" id="delivery-title">Delivery</h2></div>
        <dl class="kv">
          <dt>Receiver</dt><dd>${FS.esc(r.name)}</dd>
          <dt>Phone</dt><dd><a href="tel:+91${FS.esc(r.phone)}">${FS.esc(r.phone)}</a></dd>
          <dt>Address</dt><dd>${FS.esc(r.address)}</dd>
          <dt>Date</dt><dd>${FS.fmtDate(order.deliveryDate)}</dd>
          <dt>Time</dt><dd>${FS.esc(order.slot)}</dd>
          <dt>Payment</dt><dd>${FS.esc(order.payment)}</dd>
          <dt>Card message</dt><dd>${message}</dd>
        </dl>
      </section>`;
  }

  // Card with every status change, newest first.
  function historyCard(order) {
    return `
      <section class="card" aria-labelledby="history-title">
        <div class="card-head"><h2 class="card-title" id="history-title">Order history</h2></div>
        ${FS.timelineHTML(order)}
      </section>`;
  }

  // Customer: a cancel button while it is allowed, else a line that says why not.
  function customerActions(order) {
    if (!FS.canCancel(order)) return `<p class="muted mb-0">${WHY_NOT[order.status] || ''}</p>`;
    return `
      <p class="muted mb-0">Changed your mind? You can cancel until our florists start preparing it.</p>
      <button type="button" class="btn btn-soft-danger btn-block" data-action="cancel">${FS.icon('x', 18)} Cancel order</button>`;
  }

  // Florist or owner: a note box and one button for each next status.
  function staffActions(order) {
    const next = FS.nextStatuses(order);
    if (!next.length) {
      return `<p class="muted mb-0">This order ${order.status === 'Delivered' ? 'has been delivered' : 'was cancelled'}, so its status is final.</p>`;
    }
    const buttons = next.map(function (status) {
      const cancel = status === 'Cancelled';
      return `<button type="button" class="btn ${cancel ? 'btn-soft-danger' : 'btn-primary'} btn-block" data-status="${FS.esc(status)}">` +
        `${FS.icon(cancel ? 'x' : 'check', 18)} Mark as ${FS.esc(status)}</button>`;
    }).join('');
    return `
      <div class="field">
        <label for="status-note">Note for the history <span class="muted">(optional)</span></label>
        <textarea id="status-note" name="note" maxlength="200" placeholder="For example: The receiver asked for delivery after 5 pm."></textarea>
        <p class="hint">Saved with the status change. The customer sees it in the order history.</p>
      </div>
      ${buttons}`;
  }

  // Card with what this user can do with the order, plus Print receipt for everyone.
  function actionsCard(order) {
    return `
      <section class="card no-print" aria-labelledby="actions-title">
        <div class="card-head"><h2 class="card-title" id="actions-title">Actions</h2></div>
        <div class="stack">
          ${isCustomer ? customerActions(order) : staffActions(order)}
          <button type="button" class="btn btn-ghost btn-block" data-action="print">${FS.icon('receipt', 18)} Print receipt</button>
        </div>
      </section>`;
  }

  // Everything under the dark card: items and delivery on the left, history and actions on the right.
  function bodyHTML(order) {
    return `
      <div class="split">
        <div class="stack-lg">${itemsCard(order)}${deliveryCard(order)}</div>
        <div class="stack-lg">${historyCard(order)}${actionsCard(order)}</div>
      </div>`;
  }

  // Hero text when the order cannot be shown.
  function notFoundHead() {
    const label = Number.isInteger(id) && id > 0 ? 'Order #' + id : 'Order';
    return `
      ${crumbsHTML(FS.esc(label))}
      <h1>${FS.esc(label)}</h1>
      <p class="hero-sub">We could not open this order.</p>`;
  }

  // Message when the order does not exist or belongs to someone else.
  function notFoundBody() {
    const text = isCustomer
      ? 'It may belong to another account, or the link is old. All your own orders are on My orders.'
      : 'There is no order with this number. Please pick one from the orders list.';
    return `
      <div class="card empty">
        <span class="empty-icon">${FS.icon('receipt', 28)}</span>
        <h3>Order not found</h3>
        <p>${text}</p>
        <a class="btn btn-primary" href="${back.href}">${FS.icon('back', 18)} Back to ${back.label.toLowerCase()}</a>
      </div>`;
  }

  // Draws the page from the saved data. Runs at the start and on every fs:change.
  function render() {
    const order = FS.getOrder(id);
    hero.classList.toggle('hero-tall', !!order);
    hero.classList.toggle('hero-sm', !order);
    pull.hidden = !order;
    if (!order) {
      document.title = 'Order not found · Bloom & Petal';
      fill(head, notFoundHead());
      fill(body, notFoundBody());
      return;
    }
    document.title = 'Order #' + order.id + ' · Bloom & Petal';
    fill(head, headHTML(order));
    fill(pull, pullHTML(order));
    const typing = document.activeElement && document.activeElement.id === 'status-note';
    if (fill(body, bodyHTML(order))) {
      const note = document.getElementById('status-note');
      if (note) {
        note.value = draftNote;     // put back what the florist had typed
        if (typing) note.focus();
      }
    }
  }

  // Customer pressed "Cancel order": ask first, then cancel.
  function cancelByCustomer() {
    FS.confirm('Order #' + id + ' will be cancelled and the flowers go back to the shop. This cannot be undone.',
      { title: 'Cancel this order?', okText: 'Cancel order', cancelText: 'Keep order', danger: true })
      .then(function (yes) {
        if (!yes) return;
        const result = FS.setOrderStatus(id, 'Cancelled', 'Cancelled by customer');
        if (result.ok) FS.toast('Order #' + id + ' was cancelled.');
        else FS.toast(result.error, 'error');
      });
  }

  // Florist or owner pressed "Mark as ...". Cancelling asks first because it cannot be undone.
  function changeStatus(status) {
    const order = FS.getOrder(id);
    if (!order) return;
    if (status !== 'Cancelled') {
      saveStatus(status);
      return;
    }
    const first = order.customer.split(' ')[0];
    FS.confirm('Order #' + order.id + ' for ' + order.customer + ' will be cancelled and its flowers go back into stock. ' +
      first + ' will get a notification. This cannot be undone.',
      { title: 'Cancel this order?', okText: 'Cancel order', cancelText: 'Keep order', danger: true })
      .then(function (yes) { if (yes) saveStatus(status); });
  }

  // Saves the new status with the note, then says so. The page redraws itself through fs:change.
  function saveStatus(status) {
    const typed = draftNote;
    const note = typed.trim() || (status === 'Cancelled' ? 'Cancelled by the shop' : '');
    draftNote = '';                 // empty the note box for the next change
    const result = FS.setOrderStatus(id, status, note);
    if (!result.ok) {
      draftNote = typed;
      FS.toast(result.error, 'error');
      return;
    }
    FS.toast(status === 'Cancelled'
      ? 'Order #' + id + ' was cancelled. Its flowers are back in stock.'
      : 'Order #' + id + ' is now ' + status.toLowerCase() + '.');
  }

  // All buttons in the cards (one listener for the whole page body).
  body.addEventListener('click', function (e) {
    const button = e.target.closest('button');
    if (!button) return;
    if (button.dataset.action === 'print') window.print();
    else if (button.dataset.action === 'cancel') cancelByCustomer();
    else if (button.dataset.status) changeStatus(button.dataset.status);
  });

  // Remember the note while it is typed, so a redraw does not lose it.
  body.addEventListener('input', function (e) {
    if (e.target.id === 'status-note') draftNote = e.target.value;
  });

  window.addEventListener('fs:change', render);
  render();
});
