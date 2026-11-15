/* Made by: Raghav */
/* Bloom & Petal - js/pages/cart.js - the cart page: change quantities, fill in the delivery details, place the order. */
FS.ready(function () {
  const sub = document.getElementById('cart-sub');
  const heroChips = document.getElementById('hero-chips');
  const layout = document.getElementById('layout');
  const countChip = document.getElementById('cart-chip');
  const list = document.getElementById('cart-list');
  const emptyBox = document.getElementById('cart-empty');
  const cartFoot = document.getElementById('cart-foot');
  const deliveryCard = document.getElementById('delivery-card');
  const form = document.getElementById('delivery-form');
  const toMe = document.getElementById('to-me');
  const nameInput = document.getElementById('d-name');
  const phoneInput = document.getElementById('d-phone');
  const addressInput = document.getElementById('d-address');
  const dateInput = document.getElementById('d-date');
  const noteInput = document.getElementById('d-note');
  const noteCount = document.getElementById('note-count');
  const summary = document.getElementById('summary');
  const summaryLines = document.getElementById('summary-lines');
  const freeBar = document.getElementById('free-bar');
  const freeText = document.getElementById('free-text');
  const placeButton = document.getElementById('place-btn');
  const payNote = document.getElementById('pay-note');
  const PAY_WORDS = { 'Cash on delivery': 'in cash', 'UPI': 'by UPI', 'Card': 'by card' };

  let lines = [];          // the cart rows on screen now: [{ flower, qty, lineTotal }]
  let lastOrder = null;    // the order just placed on this page, for the thank-you message

  // "1 item" or "3 items"
  function plural(n, word) {
    return n + ' ' + word + (n === 1 ? '' : 's');
  }

  // The cart row for a flower id (data-id values are text, so turn them into numbers).
  function findLine(id) {
    return lines.find(function (line) { return line.flower.id === Number(id); }) || null;
  }

  /* ---------------------------------------------------------------- Cart rows */

  // A badge when a flower is running out, or when the cart wants more than the shop has left.
  function stockHint(line) {
    const f = line.flower;
    if (f.stock > 0 && line.qty > f.stock) return `<span class="badge badge-out">Only ${f.stock} left</span>`;
    return f.stock <= FS.LOW_STOCK ? FS.stockBadge(f) : '';
  }

  // One cart row: photo, name, type and price each, the - 2 + stepper, line total and a remove button.
  // The row wraps on phones: the flower on top, the stepper and the total underneath.
  function lineHTML(line) {
    const f = line.flower;
    const name = FS.esc(f.name);
    return `
      <li class="row" data-id="${f.id}">
        <div class="cell-flower" style="flex: 2 1 240px">
          ${FS.flowerImg(f)}
          <div>
            <div class="cell-main">${name} ${stockHint(line)}</div>
            <div class="cell-sub">${FS.esc(f.category)} · ${FS.money(f.price)} each</div>
          </div>
        </div>
        <div class="row between" style="flex: 1 1 auto">
          <div class="qty">
            <button type="button" data-step="-1" aria-label="${line.qty > 1 ? 'One less' : 'Remove'} ${name}">${FS.icon('minus', 16)}</button>
            <input type="number" value="${line.qty}" min="1" inputmode="numeric" aria-label="How many ${name}">
            <button type="button" data-step="1" aria-label="One more ${name}">${FS.icon('plus', 16)}</button>
          </div>
          <div class="row">
            <span class="product-price num right" style="min-width: 72px">${FS.money(line.lineTotal)}</span>
            <button type="button" class="btn-icon danger" data-remove aria-label="Remove ${name}" title="Remove">${FS.icon('trash', 16)}</button>
          </div>
        </div>
      </li>`;
  }

  // Draws the rows again. A - or + button that had focus gets it back, so keyboard users keep their place.
  function renderLines() {
    const active = document.activeElement;
    const step = list.contains(active) ? active.dataset.step : undefined;
    const id = step ? active.closest('[data-id]').dataset.id : '';
    list.innerHTML = lines.map(lineHTML).join('');
    const again = step ? list.querySelector(`[data-id="${id}"] [data-step="${step}"]`) : null;
    if (again) again.focus();
  }

  // The empty cart: a thank-you right after an order, otherwise a way back to the flowers.
  function emptyHTML() {
    if (lastOrder) {
      return `
        <div class="empty">
          <span class="empty-icon">${FS.icon('check', 28)}</span>
          <h3>Order #${lastOrder.id} is placed</h3>
          <p>The shop will confirm it soon. You can follow each step on the order page.</p>
          <div class="row" style="justify-content: center">
            <a class="btn btn-primary" href="order.html?id=${lastOrder.id}">Track my order</a>
            <a class="btn btn-ghost" href="catalog.html">Keep shopping</a>
          </div>
        </div>`;
    }
    return `
      <div class="empty">
        <span class="empty-icon">${FS.icon('bag', 28)}</span>
        <h3>Your cart is empty</h3>
        <p>Add a bouquet, a single stem or a plant, and it will wait for you here.</p>
        <a class="btn btn-primary" href="catalog.html">Browse flowers ${FS.icon('arrow', 18)}</a>
      </div>`;
  }

  /* ---------------------------------------------------------------- Order summary */

  // Items, delivery, total and the bar that fills up toward free delivery.
  function renderSummary(count) {
    const t = FS.cartTotals();
    const percent = Math.min(100, Math.round(t.subtotal / t.freeFrom * 100));
    summaryLines.innerHTML = `
      <div class="summary-line"><span class="muted">Items (${count})</span><span>${FS.money(t.subtotal)}</span></div>
      <div class="summary-line"><span class="muted">Delivery</span><span>${t.delivery ? FS.money(t.delivery) : 'Free'}</span></div>
      <div class="summary-total"><span>Total</span><span class="serif">${FS.money(t.total)}</span></div>`;
    freeBar.firstElementChild.style.width = percent + '%';
    freeBar.setAttribute('aria-valuenow', percent);
    freeText.innerHTML = t.toFree > 0
      ? `Add <strong>${FS.money(t.toFree)}</strong> more for free delivery.`
      : `${FS.icon('check', 16)} You get free delivery.`;
  }

  // The small line under the button: nothing is charged now, the customer pays when the flowers arrive.
  function renderPayNote() {
    const picked = form.querySelector('input[name="payment"]:checked');
    const way = picked ? picked.value : FS.PAYMENTS[0];
    payNote.textContent = 'Nothing is charged now. You pay ' + (PAY_WORDS[way] || 'by ' + way) + ' when the flowers arrive.';
  }

  /* ---------------------------------------------------------------- The whole page */

  // Draws everything that depends on the cart. Runs at the start and on every fs:change.
  function render() {
    lines = FS.getCart();
    const count = FS.cartCount();
    const hasItems = lines.length > 0;
    if (hasItems) lastOrder = null;

    if (hasItems) sub.textContent = plural(count, 'item') + ' in your cart. Check them, then tell us where and when to deliver.';
    else if (lastOrder) sub.textContent = 'Thank you! Order #' + lastOrder.id + ' is with the shop now.';
    else sub.textContent = 'Nothing here yet. The flowers you add will wait for you here.';

    layout.classList.toggle('split', hasItems);      // one wide column when there is nothing to check out
    [countChip, list, cartFoot, deliveryCard, summary].forEach(function (el) { el.hidden = !hasItems; });
    emptyBox.hidden = hasItems;
    emptyBox.innerHTML = hasItems ? '' : emptyHTML();
    countChip.textContent = plural(count, 'item');
    renderLines();
    if (hasItems) renderSummary(count);
  }

  /* ---------------------------------------------------------------- Cart actions */

  // Takes a flower out of the cart.
  function removeLine(line) {
    FS.removeFromCart(line.flower.id);
    FS.toast(line.flower.name + ' was taken out of your cart.');
  }

  // A new quantity for a row. Below 1 takes the flower out; more than the stock shows the shop's message.
  function changeQty(line, qty) {
    if (qty < 1) { removeLine(line); return; }
    const result = FS.setCartQty(line.flower.id, qty);
    if (!result.ok) {
      FS.toast(result.error, 'error');
      render();                                      // puts the old number back in the box
    }
  }

  // One listener for every row: the - and + buttons and the remove button.
  list.addEventListener('click', function (e) {
    const button = e.target.closest('button');
    const line = button ? findLine(button.closest('[data-id]').dataset.id) : null;
    if (!line) return;
    if (button.hasAttribute('data-remove')) removeLine(line);
    else changeQty(line, line.qty + Number(button.dataset.step));
  });

  // A number typed into a quantity box (runs on Enter or when the box loses focus).
  list.addEventListener('change', function (e) {
    const row = e.target.closest('[data-id]');
    const line = row ? findLine(row.dataset.id) : null;
    if (!line) return;
    const qty = Math.floor(Number(e.target.value));
    if (!(qty >= 1)) { render(); return; }          // empty or 0: keep the old number (the bin button removes)
    changeQty(line, qty);
  });

  /* ---------------------------------------------------------------- Delivery form */

  // Radio pills for the delivery times and the ways to pay. The first one starts ticked.
  function pillsHTML(name, options) {
    return options.map(function (option, i) {
      return `<label><input type="radio" name="${name}" value="${FS.esc(option)}" required${i === 0 ? ' checked' : ''}><span>${FS.esc(option)}</span></label>`;
    }).join('');
  }

  // "Send it to me": my own name, number and address, or empty boxes for someone else.
  function fillReceiver(mine) {
    const me = FS.currentUser();
    nameInput.value = mine ? me.name : '';
    phoneInput.value = mine ? me.phone : '';
    addressInput.value = mine ? me.address || '' : '';
  }

  // The live "12/120" next to the card message.
  function updateNoteCount() {
    noteCount.textContent = noteInput.value.length + '/' + noteInput.maxLength;
  }

  // A fresh form: my own details, delivery tomorrow, the first time slot, cash on delivery.
  function resetForm() {
    form.reset();                                    // also ticks "Send it to me" and the first pills again
    FS.clearErrors(form);
    fillReceiver(true);
    dateInput.min = FS.today(0);
    dateInput.max = FS.today(60);
    dateInput.value = FS.today(1);
    updateNoteCount();
    renderPayNote();
  }

  toMe.addEventListener('change', function () {
    fillReceiver(toMe.checked);
    FS.clearErrors(form);
    if (!toMe.checked) nameInput.focus();
  });

  noteInput.addEventListener('input', updateNoteCount);

  form.addEventListener('change', function (e) {
    if (e.target.name === 'payment') renderPayNote();
  });

  // The thank-you dialog: order number, total, delivery day and time, and where to go next.
  function showSuccess(order) {
    const first = FS.currentUser().name.trim().split(/\s+/)[0];
    const dialog = FS.openModal({
      title: 'Thank you, ' + first,
      html: `
        <div class="empty" style="padding: 0 0 20px">
          <span class="avatar avatar-lg" aria-hidden="true" style="margin-bottom: 6px">${FS.icon('check', 30)}</span>
          <h3>Order #${order.id} placed</h3>
          <p>The shop will confirm it soon.</p>
        </div>
        <ul class="list">
          <li><span class="muted">Total</span><strong class="num">${FS.money(order.total)}</strong></li>
          <li><span class="muted">Delivery</span><span class="right">${FS.esc(FS.fmtDate(order.deliveryDate))}<br>${FS.esc(order.slot)}</span></li>
          <li><span class="muted">Payment</span><span>${FS.esc(order.payment)}</span></li>
        </ul>
        <div class="modal-actions">
          <a class="btn btn-primary btn-block" href="order.html?id=${order.id}">Track my order ${FS.icon('arrow', 18)}</a>
          <a class="btn btn-ghost btn-block" href="catalog.html">Keep shopping</a>
        </div>`
    });
    dialog.el.querySelector('a').focus();
  }

  // Place order. FS.placeOrder checks everything again. Field problems show under the fields;
  // cart problems (errors.cart, e.g. too few in stock) have no field, so FS.showErrors shows them as a toast.
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    placeButton.disabled = true;
    const result = FS.placeOrder(FS.formData(form));
    placeButton.disabled = false;
    if (!result.ok) {
      FS.showErrors(form, result.errors);
      if (result.errors.cart && Object.keys(result.errors).length === 1) list.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    lastOrder = result.order;
    render();                                        // the cart is empty now: the thank-you shows behind the dialog
    resetForm();
    FS.toast('Order #' + result.order.id + ' placed.');
    showSuccess(result.order);
  });

  /* ---------------------------------------------------------------- Start */
  document.getElementById('slot-options').innerHTML = pillsHTML('slot', FS.SLOTS);
  document.getElementById('pay-options').innerHTML = pillsHTML('payment', FS.PAYMENTS);
  heroChips.innerHTML =
    `<span class="chip chip-gold">${FS.icon('truck', 16)}Free delivery from ${FS.money(FS.FREE_DELIVERY_FROM)}</span>` +
    `<span class="chip">${FS.icon('shield', 16)}Pay when the flowers arrive</span>`;
  resetForm();
  render();
  window.addEventListener('fs:change', render);
});
