/* Made by: Satyam */
/* js/cart.js - the cart and the checkout on cart.html.
   Unit 5 topics: Fetch API + JSON (getFlowers), higher-order functions (map, filter, find, reduce),
   dynamic content (the cart table), event handling (click, submit) with event delegation,
   form validation with regular expressions, dates, Web Storage and audio events (the chime). */

// The 45 flowers, filled in once flowers.json has loaded.
let flowers = [];

// The page parts this script changes.
const cartTable = document.getElementById('cart-table');
const cartRows = document.getElementById('cart-rows');
const cartTotals = document.getElementById('cart-totals');
const cartEmpty = document.getElementById('cart-empty');
const checkout = document.getElementById('checkout');
const form = document.getElementById('order-form');
const dateInput = document.getElementById('o-date');
const chime = document.getElementById('chime');

// The cart as full lines: [{ id, name, image, price, qty }].
function cartLines() {
  return getCart()
    .map((item) => {
      const flower = flowers.find((f) => f.id === item.id);
      return flower ? { ...flower, qty: item.qty } : null;
    })
    .filter((line) => line !== null);
}

// Subtotal, delivery and total for a list of cart lines.
function totalsFor(lines) {
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  const delivery = deliveryFor(subtotal);
  return { subtotal, delivery, total: subtotal + delivery };
}

// Draw the cart table (or the empty message), then show the checkout when someone is signed in.
function showCart() {
  const lines = cartLines();
  const isEmpty = lines.length === 0;

  cartEmpty.hidden = !isEmpty;
  cartTable.hidden = isEmpty;
  checkout.hidden = isEmpty || currentUser() === null;
  if (isEmpty) return;

  // One row per flower: number, photo and name, price, "- qty +" and the amount
  cartRows.innerHTML = lines.map((line, index) => `
    <tr>
      <td>${index + 1}.</td>
      <th scope="row"><img src="${line.image}" alt="" width="60" height="40"> ${safe(line.name)}</th>
      <td>${rupees(line.price)}</td>
      <td>${stepperHTML(line.id, line.name)}</td>
      <td>${rupees(line.price * line.qty)}</td>
    </tr>`).join('');

  // Footer rows: subtotal, delivery and the total to pay
  const { subtotal, delivery, total } = totalsFor(lines);
  cartTotals.innerHTML = `
    <tr><th scope="row" colspan="4">Subtotal</th><td>${rupees(subtotal)}</td></tr>
    <tr><th scope="row" colspan="4">Delivery</th><td>${delivery === 0 ? 'Free' : rupees(delivery)}</td></tr>
    <tr><th scope="row" colspan="4">Total</th><td><strong>${rupees(total)}</strong></td></tr>`;
}

// - and + in the table: change the quantity and draw the cart again (0 takes the flower out).
cartRows.addEventListener('click', (event) => {
  const button = event.target.closest('[data-step]');
  if (!button) return;
  stepQty(Number(button.dataset.id), Number(button.dataset.step));
  showCart();
});

// Place the order: check the fields again, empty the cart, say "Your order is placed" and play the chime.
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const fields = form.elements;
  const name = fields.name.value.trim();
  const phone = fields.phone.value.trim();
  const address = fields.address.value.trim();
  const date = fields.date.value;

  // The same checks as the HTML attributes, done again in JavaScript
  if (!currentUser()) return showMessage('order-msg', 'Please sign in first.', true);
  if (cartLines().length === 0) return showMessage('order-msg', 'Your cart is empty.', true);
  if (name.length < 2) return showMessage('order-msg', "Please type the receiver's name.", true);
  if (!PHONE_RULE.test(phone)) return showMessage('order-msg', 'The mobile number needs 10 digits, starting with 6, 7, 8 or 9.', true);
  if (address.length < 10) return showMessage('order-msg', 'Please type the full delivery address.', true);
  // "YYYY-MM-DD" text sorts like a date, so < and > compare the days
  if (date < dateFromToday(0) || date > dateFromToday(60)) return showMessage('order-msg', 'Pick a delivery date from today to 60 days from now.', true);

  emptyCart();
  cartTable.closest('section').hidden = true; // the whole "Flowers in your cart" part
  checkout.hidden = true;
  document.getElementById('order-done').hidden = false;
  chime.play().catch(() => {}); // audio: some browsers block sound; the message shows either way
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
