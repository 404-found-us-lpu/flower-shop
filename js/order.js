/* Made by: Satyam */
/* js/order.js - the cart and the checkout on order.html.
   Unit 5 topics: Fetch API + JSON (getFlowers), higher-order functions (map, filter, find, reduce),
   dynamic content (the cart table), event handling (change, click, submit), form validation with
   regular expressions, dates, Web Storage (saveOrder) and audio events (the chime). */

// The 45 flowers, filled in once flowers.json has loaded.
let flowers = [];

// The page parts this script changes.
const cartTable = document.getElementById('cart-table');
const cartRows = document.getElementById('cart-rows');
const cartTotals = document.getElementById('cart-totals');
const cartEmpty = document.getElementById('cart-empty');
const checkout = document.getElementById('checkout');
const signinFirst = document.getElementById('signin-first');
const form = document.getElementById('order-form');
const dateInput = document.getElementById('o-date');
const chime = document.getElementById('chime');

// The cart as full lines: [{ id, name, price, qty }]. Flowers that no longer exist are left out.
function cartLines() {
  return getCart()
    .map((item) => {
      const flower = flowers.find((f) => f.id === item.id);
      return flower ? { id: flower.id, name: flower.name, price: flower.price, qty: item.qty } : null;
    })
    .filter((line) => line !== null);
}

// Subtotal, delivery and total for a list of cart lines.
function totalsFor(lines) {
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  const delivery = deliveryFor(subtotal);
  return { subtotal, delivery, total: subtotal + delivery };
}

// Draw the cart table (or the empty message), then show the right checkout part.
function showCart() {
  const lines = cartLines();
  const isEmpty = lines.length === 0;

  cartEmpty.hidden = !isEmpty;
  cartTable.hidden = isEmpty;
  checkout.hidden = isEmpty;
  if (isEmpty) return;

  // One row per flower: name, price, a quantity box, the amount and a Remove button
  cartRows.innerHTML = lines.map((line) => `
    <tr>
      <th scope="row">${safe(line.name)}</th>
      <td>${rupees(line.price)}</td>
      <td><input type="number" class="cart-qty" min="1" max="10" value="${line.qty}" data-id="${line.id}" aria-label="How many ${safe(line.name)}"></td>
      <td>${rupees(line.price * line.qty)}</td>
      <td><button type="button" class="btn btn-light" data-remove="${line.id}" aria-label="Remove ${safe(line.name)}">Remove</button></td>
    </tr>`).join('');

  // Footer rows: subtotal, delivery and the total to pay
  const { subtotal, delivery, total } = totalsFor(lines);
  cartTotals.innerHTML = `
    <tr><th scope="row" colspan="3">Subtotal</th><td colspan="2">${rupees(subtotal)}</td></tr>
    <tr><th scope="row" colspan="3">Delivery</th><td colspan="2">${delivery === 0 ? 'Free' : rupees(delivery)}</td></tr>
    <tr><th scope="row" colspan="3">Total</th><td colspan="2"><strong>${rupees(total)}</strong></td></tr>`;

  // Signed in: the checkout form. Not signed in: the sign-in link instead.
  const signedIn = currentUser() !== null;
  form.hidden = !signedIn;
  signinFirst.hidden = signedIn;
}

// A new quantity typed in the table: keep it between 1 and 10, save it, draw the cart again.
cartRows.addEventListener('change', (event) => {
  const input = event.target;
  if (!input.dataset.id) return;
  const qty = Math.min(10, Math.max(1, parseInt(input.value, 10) || 1));
  setQty(Number(input.dataset.id), qty);
  showCart();
});

// A Remove button: quantity 0 takes the flower out of the cart.
cartRows.addEventListener('click', (event) => {
  const id = event.target.dataset.remove;
  if (!id) return;
  setQty(Number(id), 0);
  showCart();
});

// The next order number: one more than the biggest saved one, starting at 1001.
function nextOrderId() {
  return load(KEYS.orders, []).reduce((biggest, order) => Math.max(biggest, order.id), 1000) + 1;
}

// Open the thank-you page.
function goToThanks() {
  location.href = 'thanks.html';
}

// Place the order: check the fields again, save the order, play the chime, open thanks.html.
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const fields = form.elements;
  const name = fields.name.value.trim();
  const phone = fields.phone.value.trim();
  const address = fields.address.value.trim();
  const date = fields.date.value;
  const lines = cartLines();

  // The same checks as the HTML attributes, done again in JavaScript
  if (!currentUser()) return showMessage('order-msg', 'Please sign in first.', true);
  if (lines.length === 0) return showMessage('order-msg', 'Your cart is empty.', true);
  if (name.length < 2) return showMessage('order-msg', "Please type the receiver's name.", true);
  if (!PHONE_RULE.test(phone)) return showMessage('order-msg', 'The mobile number needs 10 digits, starting with 6, 7, 8 or 9.', true);
  if (address.length < 10) return showMessage('order-msg', 'Please type the full delivery address.', true);
  // "YYYY-MM-DD" text sorts like a date, so < and > compare the days
  if (date < dateFromToday(0) || date > dateFromToday(60)) return showMessage('order-msg', 'Pick a delivery date from today to 60 days from now.', true);

  const id = nextOrderId();
  const { subtotal, delivery, total } = totalsFor(lines);
  saveOrder({
    id,
    email: currentUser().email,
    items: lines,
    subtotal,
    delivery,
    total,
    receiver: name,
    phone,
    address,
    date,
    slot: fields.slot.value,
    payment: fields.payment.value,
    note: fields.note.value.trim(),
    placedAt: new Date().toISOString(),
  });

  // Stop a second click from placing the order twice
  form.querySelector('[type="submit"]').disabled = true;
  showMessage('order-msg', `Order #${id} is placed!`);

  // Audio events: open thanks.html when the chime ends, or right away if it cannot play
  chime.addEventListener('ended', goToThanks);
  chime.play().catch(goToThanks);
});

// Delivery date: from today to 60 days ahead, tomorrow picked to start with.
dateInput.min = dateFromToday(0);
dateInput.max = dateFromToday(60);
dateInput.value = dateFromToday(1);

// Load the flowers (Fetch API), then draw the cart.
getFlowers()
  .then((list) => {
    flowers = list;
    showMessage('cart-msg', '');
    showCart();
  })
  .catch(() => {
    showMessage('cart-msg', 'Sorry, the flower list could not load. Open this page through Live Server or the live site.', true);
  });
