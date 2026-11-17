/* Made by: Satyam */
/* Bloom & Petal - js/pages/cart.js - the cart page: change quantities, fill in the delivery details, place the order. */

FS.ready((user) => {
  // ---------- Page elements ----------

  // Short name for document.getElementById.
  const byId = (id) => document.getElementById(id);

  const list = byId('cart-list');
  const form = byId('checkout');

  // ---------- One cart line ----------

  // Builds the HTML for one cart line: photo, name, stock, the - qty + buttons, line total and remove.
  // Every button carries the quantity it sets (remove sets 0, which takes the flower out).
  const lineHTML = ({ flower: f, qty, lineTotal }) => {
    const botanical = f.botanical ? `<i>${FS.esc(f.botanical)}</i> · ` : '';
    const atMax = qty >= f.stock ? ' disabled' : '';

    return `
      <li class="row">
        <div class="cell-flower">
          ${FS.flowerImg(f)}
          <div>
            <div class="cell-main">${FS.esc(f.name)}</div>
            <div class="cell-sub">${botanical}${FS.money(f.price)} each</div>
            ${FS.stockBadge(f)}
          </div>
        </div>
        <div class="qty">
          <button type="button" data-id="${f.id}" data-qty="${qty - 1}"
            aria-label="One less ${FS.esc(f.name)}">${FS.icon('minus', 16)}</button>
          <input type="number" data-id="${f.id}" value="${qty}" min="1" max="${f.stock}"
            aria-label="How many ${FS.esc(f.name)}">
          <button type="button" data-id="${f.id}" data-qty="${qty + 1}"
            aria-label="One more ${FS.esc(f.name)}"${atMax}>${FS.icon('plus', 16)}</button>
        </div>
        <strong class="num">${FS.money(lineTotal)}</strong>
        <button type="button" class="btn-icon danger" data-id="${f.id}" data-qty="0"
          aria-label="Remove ${FS.esc(f.name)}">${FS.icon('trash', 16)}</button>
      </li>`;
  };

  // ---------- Draw the page ----------

  // Draws the lines, the summary and the free-delivery bar.
  // Runs once at the start and again on every fs:change.
  const render = () => {
    const lines = FS.getCart();
    const count = FS.cartCount();
    const { subtotal, delivery, total, freeFrom, toFree } = FS.cartTotals();

    // Remember which button had keyboard focus, so we can put it back after redrawing.
    const focusedIndex = [...list.querySelectorAll('button')].indexOf(document.activeElement);

    // Show the full cart, or the "empty" message (after an order the thank-you shows instead).
    byId('cart-full').hidden = lines.length === 0;
    byId('cart-empty').hidden = lines.length > 0 || !byId('cart-done').hidden;

    byId('cart-sub').textContent = lines.length
      ? `${count} ${count === 1 ? 'flower' : 'flowers'} in your cart. Check them, then tell us who gets them and when.`
      : 'Nothing here yet. The flowers you add will wait for you here.';

    list.innerHTML = lines.map(lineHTML).join('');

    // Order summary: flowers, delivery (struck out when free) and total.
    const fee = delivery
      ? FS.money(delivery)
      : `<del>${FS.money(FS.DELIVERY_FEE)}</del> <ins>Free</ins>`;

    byId('summary').innerHTML = `
      <div class="summary-line">
        <span class="muted">Flowers (${count})</span>
        <span>${FS.money(subtotal)}</span>
      </div>
      <div class="summary-line">
        <span class="muted">Delivery</span>
        <span>${fee}</span>
      </div>
      <div class="summary-total">
        <span>Total</span>
        <span class="serif">${FS.money(total)}</span>
      </div>`;

    // Free-delivery progress bar and its message.
    byId('free-fill').style.width = `${Math.min(100, (subtotal / freeFrom) * 100)}%`;
    byId('free-text').textContent = toFree > 0
      ? `Add ${FS.money(toFree)} more for free delivery.`
      : 'Delivery is free on this order.';

    // Keyboard users keep their place.
    const buttonToFocus = list.querySelectorAll('button')[focusedIndex];
    if (buttonToFocus) buttonToFocus.focus();
  };

  // ---------- Helpers ----------

  // Saves a new quantity (0 removes the flower).
  // If it is more than the stock, shows why and puts the old number back.
  const setQty = (id, qty) => {
    const { ok, error } = FS.setCartQty(id, qty);

    if (!ok) {
      FS.toast(error, 'error');
      render();
    }
  };

  // Fresh form: the logged-in customer as the receiver, delivery tomorrow
  // (any day from today to 60 days ahead can be picked).
  const resetForm = () => {
    form.reset();

    ['name', 'phone', 'address'].forEach((key) => {
      form.elements[key].value = user[key];
    });

    Object.assign(form.elements.deliveryDate, {
      min: FS.today(0),
      max: FS.today(60),
      value: FS.today(1),
    });
  };

  // ---------- Events ----------

  // The -, + and remove buttons of every line (one listener for the whole list).
  list.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (button) setQty(button.dataset.id, button.dataset.qty);
  });

  // A number typed in a quantity box.
  // An empty box or 0 puts the old number back (the bin button is for removing).
  list.addEventListener('change', (e) => {
    const { value, dataset } = e.target;

    if (value >= 1) setQty(dataset.id, value);
    else render();
  });

  // Place order: FS.placeOrder checks everything again.
  // Field problems show under the fields, cart problems as a toast (showErrors returns true if there were any).
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const { errors, order } = FS.placeOrder(FS.formData(form));
    if (FS.showErrors(form, errors)) return;

    // Play a chime. If there is no sound file or sound is blocked, the order is placed anyway.
    byId('chime').play().catch(() => {});

    resetForm();

    // Show the thank-you section (plain HTML in cart.html) with the new order's number and link; render() then hides the empty-cart box.
    byId('done-id').textContent = `#${order.id}`;
    byId('done-link').href = `order.html?id=${order.id}`;
    byId('cart-done').hidden = false;
    render();
    byId('cart-done').focus();
  });

  // ---------- Start ----------

  resetForm();
  render();
  window.addEventListener('fs:change', render);
});
