/* Made by: Yash, Satyam and Raghav */
/* basic/js/shop.js - the code every page of the simple version shares.
   Unit 5 topics: Web Storage (localStorage), JSON, the Fetch API, regular expressions, dates,
   DOM selection and changes, and event handling. Each page has its own small script as well. */

// ---------------------------------------------------------------- Saved data (Web Storage API)
// localStorage keeps data after the browser is closed. It only stores text, so lists are saved as JSON.
const KEYS = { users: 'bp.users', me: 'bp.me', cart: 'bp.cart', orders: 'bp.orders' };

// Read a saved value, or give back `fallback` when nothing is saved yet.
function load(key, fallback) {
  const text = localStorage.getItem(key);
  return text ? JSON.parse(text) : fallback;
}

// Save a value as JSON text.
function store(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---------------------------------------------------------------- Accounts
// The demo customer is always there. Demo only: a real shop keeps passwords on a server, never in the browser.
const DEMO_USER = { name: 'Neha Sharma', email: 'neha@example.com', password: 'neha123' };

// Every account: the demo customer plus the ones made on register.html.
function getUsers() {
  return [DEMO_USER, ...load(KEYS.users, [])];
}

// The signed-in customer, or null.
function currentUser() {
  return getUsers().find((user) => user.email === localStorage.getItem(KEYS.me)) || null;
}

// Sign in. Gives back the customer, or null when the email or password is wrong.
function signIn(email, password) {
  const user = getUsers().find((u) => u.email === email.trim().toLowerCase() && u.password === password);
  if (user) localStorage.setItem(KEYS.me, user.email);
  return user || null;
}

// Make a new account and sign in. Gives back an error message, or '' when it worked.
function register(name, email, password) {
  email = email.trim().toLowerCase();
  if (getUsers().some((u) => u.email === email)) return 'This email already has an account.';
  store(KEYS.users, [...load(KEYS.users, []), { name: name.trim(), email, password }]);
  localStorage.setItem(KEYS.me, email);
  return '';
}

// Sign out and go back to the home page.
function signOut() {
  localStorage.removeItem(KEYS.me);
  location.href = 'index.html';
}

// ---------------------------------------------------------------- Flowers (Fetch API + JSON)
// Loads the 45 flowers from flowers.json. fetch() needs a web server (Live Server or the live site).
function getFlowers() {
  return fetch('flowers.json').then((response) => response.json());
}

// ---------------------------------------------------------------- Cart and orders
// The cart is a list like [{ id: 13, qty: 2 }].
function getCart() {
  return load(KEYS.cart, []);
}

// Add one of a flower to the cart (or one more if it is already there).
function addToCart(id) {
  const cart = getCart();
  const line = cart.find((item) => item.id === id);
  if (line) line.qty += 1;
  else cart.push({ id, qty: 1 });
  store(KEYS.cart, cart);
  updateHeader();
}

// Change how many of a flower are in the cart. 0 removes it.
function setQty(id, qty) {
  const cart = getCart().map((item) => (item.id === id ? { id, qty } : item)).filter((item) => item.qty > 0);
  store(KEYS.cart, cart);
  updateHeader();
}

// How many flowers are in the cart in total.
function cartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

// Delivery is Rs 50, free when the flowers cost Rs 999 or more.
function deliveryFor(subtotal) {
  return subtotal === 0 || subtotal >= 999 ? 0 : 50;
}

// Save a placed order for the signed-in customer and empty the cart.
function saveOrder(order) {
  store(KEYS.orders, [...load(KEYS.orders, []), order]);
  store(KEYS.cart, []);
  updateHeader();
}

// This customer's orders, newest first.
function getOrders() {
  const me = currentUser();
  return load(KEYS.orders, []).filter((order) => me && order.email === me.email).reverse();
}

// ---------------------------------------------------------------- Small helpers
// Regular expressions for the form checks.
const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RULE = /^[6-9][0-9]{9}$/;

// Makes typed text safe to put inside innerHTML: <b> shows as text instead of becoming a tag.
function safe(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// 1450 -> "Rs 1,450" (Indian digit grouping).
function rupees(amount) {
  return 'Rs ' + amount.toLocaleString('en-IN');
}

// Today's date (plus some days) as "YYYY-MM-DD", the format <input type="date"> uses.
function dateFromToday(days = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

// Writes a message into a page's message box, e.g. showMessage('form-msg', 'Saved!').
function showMessage(id, text, isError = false) {
  const box = document.getElementById(id);
  box.textContent = text;
  box.classList.toggle('error', isError);
}

// ---------------------------------------------------------------- The header on every page (DOM)
// Shows the cart count, and "Hi, Neha" + Sign out instead of Sign in when someone is signed in.
function updateHeader() {
  const count = document.getElementById('cart-count');
  if (count) count.textContent = cartCount();

  const account = document.getElementById('account-link');
  const me = currentUser();
  if (account && me) {
    account.textContent = `Hi, ${me.name.split(' ')[0]} · Sign out`;
    account.href = '#';
  }
}

// Clicking "Sign out" in the header.
document.addEventListener('click', (event) => {
  if (event.target.id === 'account-link' && currentUser()) {
    event.preventDefault();
    signOut();
  }
});

document.addEventListener('DOMContentLoaded', updateHeader);
