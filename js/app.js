/* Made by: Yash, Raghav and Satyam */
/* ==========================================================================
   Bloom & Petal - online flower shop
   js/app.js - the code that every page shares.

    1. Settings and shop details      6. Orders
    2. Data store                     7. Header and footer
    3. Demo data                      8. Toasts, dialogs and form errors
    4. Login                          9. Small helpers (money, dates, icons)
    5. Flowers and cart              10. Start-up: page guard and FS.ready

   All data is saved in this browser with localStorage. There is no server.
   ========================================================================== */
const FS = (() => {
  'use strict';

  /* ---------------------------------------------------------------- 1. Settings and shop details */
  const DB_KEY = 'bloompetal.db.v3';          // all shop data (shared by every tab)
  const SESSION_KEY = 'bloompetal.session';   // who is logged in (one per tab)
  const DELIVERY_FEE = 50;
  const FREE_DELIVERY_FROM = 999;
  const LOW_STOCK = 5;
  const CATEGORIES = ['Bouquets', 'Indian favourites', 'Single stems', 'Plants', 'Gifts'];
  const SLOTS = ['Morning (9 am - 12 pm)', 'Afternoon (12 pm - 4 pm)', 'Evening (4 pm - 8 pm)'];
  const PAYMENTS = ['Cash on delivery', 'UPI', 'Card'];
  const DEMO = { email: 'neha@example.com', password: 'neha123' };   // the demo login on the login page
  const SHOP = {
    owners: ['Yash', 'Satyam', 'Raghav'],
    phone: '+91 98765 01234',
    email: 'hello@bloompetal.in',
    address: ['Shop 12, Model Town Market', 'Jalandhar, Punjab 144003'],
    hours: 'Open every day, 9 am to 8 pm'
  };
  const NAV = {                               // [page id, label, file]
    guest: [['index', 'Home', 'index.html'], ['contact', 'Contact', 'contact.html']],
    customer: [['home', 'Home', 'home.html'], ['catalog', 'Flowers', 'catalog.html'], ['orders', 'My orders', 'orders.html'], ['contact', 'Contact', 'contact.html']]
  };

  /* ---------------------------------------------------------------- 2. Data store */
  // (db itself is loaded in section 10, after every helper below exists.)

  function loadDb() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) return JSON.parse(raw);
    } catch (err) { /* unreadable data: start again from the demo data */ }
    const fresh = seedData();
    try { localStorage.setItem(DB_KEY, JSON.stringify(fresh)); } catch (err) { /* private mode */ }
    return fresh;
  }

  function save() {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (err) {
      toast('Browser storage is full, so the last change was not saved.', 'error');
      return false;
    }
    changed();
    return true;
  }

  // Tell the page that data changed. Pages listen with: window.addEventListener('fs:change', ...)
  function changed() {
    refreshHeader();
    window.dispatchEvent(new CustomEvent('fs:change'));
  }

  // Another tab saved something: load it, so every open tab stays in step.
  window.addEventListener('storage', (e) => {
    if (e.key !== DB_KEY || !e.newValue) return;
    try { db = JSON.parse(e.newValue); changed(); } catch (err) { /* ignore */ }
  });

  const resetDemo = () => { db = seedData(); return save(); };
  const nextId = (kind) => db.seq[kind]++;
  const clone = (value) => (value == null ? null : JSON.parse(JSON.stringify(value)));
  const fail = (errors) => ({ ok: false, errors, error: Object.values(errors)[0] });

  /* ---------------------------------------------------------------- 3. Demo data */
  function seedData() {
    const now = Date.now();
    const hoursAgo = (h) => new Date(now - h * 3600000).toISOString();

    const users = [
      [1, 'Neha Sharma', 'neha@example.com', '9876543210', 'neha123', 'House 42, Model Town, Jalandhar', 80],
      [2, 'Aman Verma', 'aman@example.com', '9876543211', 'aman123', 'B-7 Green Avenue, Ludhiana', 62],
      [3, 'Simran Kaur', 'simran@example.com', '9876543212', 'simran123', 'Flat 304, Silver Heights, Phagwara', 41]
    ].map(([id, name, email, phone, password, address, days]) =>
      ({ id, name, email, phone, pass: hashPassword(password), address, joined: hoursAgo(days * 24) }));

    // [id, name, type, price, stock, botanical name, description, photo]
    const flowers = [
      [1, 'Red Rose Bouquet', 'Bouquets', 800, 20, 'Rosa', 'Twelve fresh red roses, hand tied with eucalyptus.', 'red-rose-bouquet'],
      [2, 'White Lily Bunch', 'Bouquets', 650, 15, 'Lilium', 'Six stems of white oriental lilies, ready for a vase.', 'white-lily-bunch'],
      [3, 'Sunflower Basket', 'Bouquets', 900, 8, 'Helianthus annuus', 'Bright sunflowers arranged in a woven cane basket.', 'sunflower-basket'],
      [4, 'Pink Tulip Bunch', 'Bouquets', 750, 12, 'Tulipa', 'Ten soft pink tulips wrapped in kraft paper.', 'pink-tulips'],
      [5, 'Gerbera Mix', 'Bouquets', 550, 18, 'Gerbera jamesonii', 'A cheerful mix of gerbera daisies in five colours.', 'gerbera-mix'],
      [6, 'Lavender Bundle', 'Bouquets', 450, 4, 'Lavandula', 'A fragrant bundle of lavender tied with twine.', 'lavender-bundle'],
      [7, 'Single Red Rose', 'Single stems', 100, 50, 'Rosa', 'One long-stem red rose with a small note card.', 'single-red-rose'],
      [8, 'Single Sunflower', 'Single stems', 120, 30, 'Helianthus annuus', 'One tall sunflower stem, wrapped and ribboned.', 'single-sunflower'],
      [9, 'Money Plant Pot', 'Plants', 400, 12, 'Epipremnum aureum', 'An easy indoor money plant in a ceramic pot.', 'money-plant-pot'],
      [10, 'Purple Orchid Pot', 'Plants', 1200, 6, 'Phalaenopsis', 'A flowering moth orchid that blooms for weeks.', 'orchid-pot'],
      [11, 'Succulent Pot', 'Plants', 300, 3, 'Echeveria', 'A small succulent that needs water once a week.', 'succulent-pot'],
      [12, 'Birthday Combo', 'Gifts', 1300, 5, '', 'A mixed bouquet with a greeting card and candles.', 'birthday-combo'],
      [13, 'Mogra Pot', 'Indian favourites', 350, 14, 'Jasminum sambac', 'Sweet-smelling white mogra that flowers all summer.', 'mogra-pot'],
      [14, 'Marigold (Genda)', 'Indian favourites', 250, 40, 'Tagetes erecta', 'Bright orange genda flowers for pooja, weddings and festivals.', 'marigold'],
      [15, 'Aprajita Pot', 'Indian favourites', 300, 10, 'Clitoria ternatea', 'A climbing creeper with deep blue butterfly-pea flowers.', 'aprajita-pot'],
      [16, 'Bleeding Heart Vine Pot', 'Indian favourites', 550, 7, 'Clerodendrum thomsoniae', 'White flowers with bright red hearts, for a sunny balcony.', 'bleeding-heart-pot'],
      [17, 'Guldaudi (Chrysanthemum)', 'Indian favourites', 450, 9, 'Chrysanthemum', 'Big, colourful winter blooms that last for weeks.', 'guldaudi'],
      [18, 'Madhumalti Pot', 'Indian favourites', 500, 6, 'Combretum indicum', 'A creeper with clusters that turn from white to pink to red.', 'madhumalti-pot']
    ].map(([id, name, category, price, stock, botanical, description, photo]) =>
      ({ id, name, category, price, stock, botanical, description, image: `images/${photo}.jpg` }));

    // [id, customer id, placed hours ago, [[flower id, qty]...], delivery day offset, slot, payment, card note, receiver]
    const orders = [
      [1001, 1, 290, [[1, 1], [7, 2]], -11, 0, 1, 'Happy birthday, Maa!', 'Sunita Sharma'],
      [1002, 2, 240, [[12, 1]], -9, 2, 2, 'Many happy returns.', 'Ritu Verma'],
      [1003, 3, 200, [[3, 1], [9, 1]], -7, 1, 1, '', ''],
      [1004, 1, 150, [[2, 2]], -5, 0, 0, 'Get well soon.', 'Anita Sharma'],
      [1005, 1, 26, [[14, 3], [13, 1]], 1, 0, 1, 'For the Diwali pooja.', ''],
      [1006, 2, 5, [[15, 1]], 2, 1, 0, '', ''],
      [1007, 1, 2, [[11, 2], [7, 1]], 2, 0, 0, '', '']
    ].map(([id, userId, placed, lines, day, slot, pay, note, receiver]) => {
      const user = users.find((u) => u.id === userId);
      const items = lines.map(([flowerId, qty]) => {
        const { name, price } = flowers.find((f) => f.id === flowerId);
        return { flowerId, name, price, qty };
      });
      const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
      const delivery = subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
      return {
        id, userId, customer: user.name, items, subtotal, delivery, total: subtotal + delivery,
        recipient: { name: receiver || user.name, phone: user.phone, address: user.address },
        deliveryDate: dayFromNow(day), slot: SLOTS[slot], payment: PAYMENTS[pay], note, createdAt: hoursAgo(placed)
      };
    });

    return { users, flowers, orders, carts: {}, seq: { user: 4, order: 1008 } };
  }

  /* ---------------------------------------------------------------- 4. Login */

  // A small one-way scramble so passwords are not stored as plain text.
  // It is NOT real security: a real shop checks passwords on a server.
  function hashPassword(text) {
    let h = 0x811c9dc5;
    const s = 'bloom&petal:' + text;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return (h >>> 0).toString(16).padStart(8, '0');
  }

  // A copy of the user without the password.
  const publicUser = (u) => { if (!u) return null; const { pass, ...rest } = u; return clone(rest); };
  function rawUser() {
    const id = Number(sessionStorage.getItem(SESSION_KEY));
    return db.users.find((u) => u.id === id) || null;
  }
  const currentUser = () => publicUser(rawUser());
  const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || '').trim());
  const isPhone = (s) => /^[6-9][0-9]{9}$/.test(String(s || '').trim());

  function login(email, password) {
    const mail = String(email || '').trim().toLowerCase();
    const u = db.users.find((x) => x.email === mail);
    if (!u || u.pass !== hashPassword(String(password || ''))) return fail({ password: 'Wrong email or password.' });
    sessionStorage.setItem(SESSION_KEY, String(u.id));
    return { ok: true, user: publicUser(u) };
  }

  function logout() { sessionStorage.removeItem(SESSION_KEY); location.href = 'index.html'; }

  // New account. Returns { ok, user } or { ok:false, errors, error }.
  function register(data) {
    const errors = {};
    const name = String(data.name || '').trim();
    const mail = String(data.email || '').trim().toLowerCase();
    if (name.length < 2) errors.name = 'Please enter the full name.';
    if (!isEmail(mail)) errors.email = 'Please enter a correct email address.';
    else if (db.users.some((u) => u.email === mail)) errors.email = 'This email is already registered.';
    if (!isPhone(data.phone)) errors.phone = 'Enter a 10 digit mobile number starting with 6, 7, 8 or 9.';
    if (String(data.password || '').length < 6) errors.password = 'Use at least 6 characters.';
    else if (data.confirm !== undefined && data.confirm !== data.password) errors.confirm = 'The two passwords are not the same.';
    if (Object.keys(errors).length) return fail(errors);
    const u = { id: nextId('user'), name, email: mail, phone: data.phone.trim(), pass: hashPassword(data.password),
                address: String(data.address || '').trim(), joined: new Date().toISOString() };
    db.users.push(u);
    sessionStorage.setItem(SESSION_KEY, String(u.id));
    save();
    return { ok: true, user: publicUser(u) };
  }

  // The logged-in customer changes their own details.
  function updateProfile(data) {
    const me = rawUser();
    if (!me) return fail({ name: 'Please log in again.' });
    const errors = {};
    if (String(data.name || '').trim().length < 2) errors.name = 'Please enter your full name.';
    if (!isPhone(data.phone)) errors.phone = 'Enter a 10 digit mobile number starting with 6, 7, 8 or 9.';
    if (Object.keys(errors).length) return fail(errors);
    me.name = data.name.trim(); me.phone = data.phone.trim(); me.address = String(data.address || '').trim();
    save();
    return { ok: true, user: publicUser(me) };
  }

  function changePassword(current, next, confirm) {
    const me = rawUser();
    if (!me) return fail({ current: 'Please log in again.' });
    if (me.pass !== hashPassword(String(current || ''))) return fail({ current: 'Your present password is wrong.' });
    if (String(next || '').length < 6) return fail({ next: 'Use at least 6 characters.' });
    if (confirm !== undefined && confirm !== next) return fail({ confirm: 'The two passwords are not the same.' });
    me.pass = hashPassword(next);
    save();
    return { ok: true };
  }

  /* ---------------------------------------------------------------- 5. Flowers and cart */
  const findFlower = (id) => db.flowers.find((f) => f.id === Number(id)) || null;

  // All flowers, A-Z.
  const getFlowers = () => clone(db.flowers).sort((a, b) => a.name.localeCompare(b.name));
  const getFlower = (id) => clone(findFlower(id));

  // The logged-in customer's cart rows: [{ flowerId, qty }]
  function cartRows() {
    const me = rawUser();
    if (!me) return [];
    db.carts[me.id] = db.carts[me.id] || [];
    return db.carts[me.id];
  }

  // [{ flower, qty, lineTotal }] for the logged-in customer
  function getCart() {
    return cartRows().map(({ flowerId, qty }) => {
      const f = findFlower(flowerId);
      return f ? { flower: clone(f), qty, lineTotal: f.price * qty } : null;
    }).filter(Boolean);
  }
  const cartCount = () => getCart().reduce((sum, l) => sum + l.qty, 0);
  function cartTotals() {
    const subtotal = getCart().reduce((sum, l) => sum + l.lineTotal, 0);
    const delivery = subtotal === 0 || subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
    return { subtotal, delivery, total: subtotal + delivery, freeFrom: FREE_DELIVERY_FROM, toFree: Math.max(FREE_DELIVERY_FROM - subtotal, 0) };
  }

  function addToCart(flowerId, qty = 1) {
    const f = findFlower(flowerId);
    if (!rawUser()) return fail({ cart: 'Please log in to order flowers.' });
    if (!f) return fail({ cart: 'This flower is not on sale any more.' });
    if (f.stock < 1) return fail({ cart: `${f.name} is out of stock.` });
    const rows = cartRows();
    const row = rows.find((r) => r.flowerId === f.id);
    const want = (row ? row.qty : 0) + (Number(qty) || 1);
    if (want > f.stock) return fail({ cart: `Only ${f.stock} of ${f.name} in stock.` });
    if (row) row.qty = want; else rows.push({ flowerId: f.id, qty: want });
    save();
    return { ok: true, qty: want, count: cartCount() };
  }

  function setCartQty(flowerId, qty) {
    const f = findFlower(flowerId);
    const row = cartRows().find((r) => r.flowerId === Number(flowerId));
    const want = Math.floor(Number(qty));
    if (!row || !f) return fail({ cart: 'This flower is not in your cart.' });
    if (!(want >= 1)) return removeFromCart(flowerId);
    if (want > f.stock) return fail({ cart: `Only ${f.stock} of ${f.name} in stock.` });
    row.qty = want;
    save();
    return { ok: true, qty: want };
  }

  function removeFromCart(flowerId) {
    const me = rawUser();
    if (me) db.carts[me.id] = cartRows().filter((r) => r.flowerId !== Number(flowerId));
    save();
    return { ok: true };
  }

  /* ---------------------------------------------------------------- 6. Orders */

  // The logged-in customer's orders, newest first.
  function getOrders() {
    const me = rawUser();
    return me ? clone(db.orders.filter((o) => o.userId === me.id)).sort((a, b) => b.id - a.id) : [];
  }
  const getOrder = (id) => getOrders().find((o) => o.id === Number(id)) || null;

  // Turns the cart into an order. details = { name, phone, address, deliveryDate, slot, payment, note }
  function placeOrder(details) {
    const me = rawUser();
    const lines = getCart();
    const errors = {};
    if (!me) return fail({ cart: 'Please log in to place an order.' });
    if (!lines.length) return fail({ cart: 'Your cart is empty.' });
    lines.forEach(({ qty, flower }) => { if (qty > flower.stock) errors.cart = `Only ${flower.stock} of ${flower.name} left. Please change the quantity.`; });
    if (String(details.name || '').trim().length < 2) errors.name = 'Please enter the receiver\'s name.';
    if (!isPhone(details.phone)) errors.phone = 'Enter a 10 digit mobile number starting with 6, 7, 8 or 9.';
    if (String(details.address || '').trim().length < 10) errors.address = 'Please write the full delivery address.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(details.deliveryDate || '')) errors.deliveryDate = 'Please choose a delivery date.';
    else if (details.deliveryDate < dayFromNow(0)) errors.deliveryDate = 'The delivery date cannot be in the past.';
    else if (details.deliveryDate > dayFromNow(60)) errors.deliveryDate = 'Please choose a date within the next 60 days.';
    if (!SLOTS.includes(details.slot)) errors.slot = 'Please choose a delivery time.';
    if (!PAYMENTS.includes(details.payment)) errors.payment = 'Please choose how you will pay.';
    if (Object.keys(errors).length) return fail(errors);

    const { subtotal, delivery, total } = cartTotals();
    const order = {
      id: nextId('order'), userId: me.id, customer: me.name,
      items: lines.map(({ flower, qty }) => ({ flowerId: flower.id, name: flower.name, price: flower.price, qty })),
      subtotal, delivery, total,
      recipient: { name: details.name.trim(), phone: details.phone.trim(), address: details.address.trim() },
      deliveryDate: details.deliveryDate, slot: details.slot, payment: details.payment,
      note: String(details.note || '').trim(), createdAt: new Date().toISOString()
    };
    lines.forEach(({ flower, qty }) => { findFlower(flower.id).stock -= qty; });   // take the flowers out of stock
    db.orders.push(order);
    db.carts[me.id] = [];
    save();
    return { ok: true, order: clone(order) };
  }

  /* ---------------------------------------------------------------- 7. Header and footer */
  // The shop's flower logo: five <ellipse> petals turned around a <circle> centre.
  const BRAND_MARK = '<span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24">' +
    [0, 72, 144, 216, 288].map((deg) => `<ellipse cx="12" cy="6.4" rx="3.2" ry="4.4" transform="rotate(${deg} 12 12)"/>`).join('') +
    '<circle class="core" cx="12" cy="12" r="2.4"/></svg></span>';

  function renderHeader() {
    const user = currentUser();
    const page = document.documentElement.dataset.page;
    const links = NAV[user ? 'customer' : 'guest'].map(([id, label, file]) =>
      `<a href="${file}"${id === page ? ' class="active" aria-current="page"' : ''}>${label}</a>`).join('');
    let end;
    if (user) {
      end = '<form class="nav-search" action="catalog.html" method="get" role="search">' + icon('search', 16) +
            '<input type="search" name="q" placeholder="Search flowers" aria-label="Search flowers"></form>' +
            '<a class="nav-icon" href="cart.html" aria-label="Cart">' + icon('bag') + '<span class="nav-count" id="fs-cart-count" hidden></span></a>' +
            `<button type="button" class="nav-avatar" id="fs-avatar" aria-label="Account menu" aria-expanded="false">${esc(initials(user.name))}</button>` +
            '<button type="button" class="nav-icon nav-burger" id="fs-burger" aria-label="Menu" aria-expanded="false">' + icon('menu') + '</button>' +
            `<menu class="nav-pop nav-menu" id="fs-menu" hidden><li class="nav-menu-head"><strong>${esc(user.name)}</strong><span>${esc(user.email)}</span></li>` +
            `<li><a href="profile.html">${icon('user', 18)}My profile</a></li>` +
            `<li><button type="button" data-act="reset">${icon('refresh', 18)}Reset demo data</button></li>` +
            `<li><button type="button" data-act="logout">${icon('logout', 18)}Log out</button></li></menu>`;
    } else {
      end = '<a class="btn btn-ghost btn-sm" href="login.html">Sign in</a><a class="btn btn-primary btn-sm" href="register.html">Create account</a>';
    }
    const header = document.createElement('header');
    header.className = 'nav-wrap';
    header.innerHTML = `<nav class="nav" aria-label="Main"><a class="brand" href="${user ? 'home.html' : 'index.html'}">${BRAND_MARK}` +
      `<span class="brand-name">Bloom &amp; Petal</span></a><div class="nav-links" id="fs-links">${links}</div><div class="nav-end">${end}</div></nav>`;
    document.body.prepend(header);
    if (!user) return;

    const nav = header.querySelector('.nav');
    const menu = document.getElementById('fs-menu');
    const avatar = document.getElementById('fs-avatar'), burger = document.getElementById('fs-burger');
    const closeAll = () => {
      menu.hidden = true; nav.classList.remove('nav-open');
      [avatar, burger].forEach((b) => b.setAttribute('aria-expanded', 'false'));
    };
    const toggle = (button, show) => { const wasOpen = button.getAttribute('aria-expanded') === 'true'; closeAll(); if (!wasOpen) { show(); button.setAttribute('aria-expanded', 'true'); } };
    avatar.addEventListener('click', (e) => { e.stopPropagation(); toggle(avatar, () => { menu.hidden = false; }); });
    burger.addEventListener('click', (e) => { e.stopPropagation(); toggle(burger, () => nav.classList.add('nav-open')); });
    menu.addEventListener('click', (e) => {
      e.stopPropagation();
      const act = e.target.closest('[data-act]');
      if (!act) return;
      if (act.dataset.act === 'logout') logout();
      if (act.dataset.act === 'reset') {
        closeAll();
        confirmBox('All orders, flowers and accounts go back to the demo data. You will be logged out.', { title: 'Reset demo data?', okText: 'Reset', danger: true })
          .then((yes) => { if (yes) { resetDemo(); logout(); } });
      }
    });
    document.addEventListener('click', closeAll);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });
  }

  // Keeps the cart number in the header correct.
  function refreshHeader() {
    const cart = document.getElementById('fs-cart-count');
    if (cart) { const n = cartCount(); cart.textContent = n; cart.hidden = n === 0; }
  }

  // The footer: shop address and contact details in an <address>, and the three owners.
  function renderFooter() {
    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML = `<div class="wrap footer-inner"><div class="footer-brand">${BRAND_MARK}<div><strong>Bloom &amp; Petal</strong>` +
      '<p>Fresh flowers, delivered across Jalandhar.</p></div></div>' +
      `<div><h4>Visit or call</h4><address>${SHOP.address.join('<br>')}<br>` +
      `<a href="tel:${SHOP.phone.replaceAll(' ', '')}">${SHOP.phone}</a><br><a href="mailto:${SHOP.email}">${SHOP.email}</a></address></div>` +
      `<div><h4>Owners</h4><p>${SHOP.owners.join(', ')}</p><p><small>${SHOP.hours}</small></p></div></div>` +
      '<p class="wrap footer-note"><small>&copy; 2026 Bloom &amp; Petal. CSE326 project by Yash, Satyam and Raghav, Section K4P26GH. Demo data is saved only in this browser.</small></p>';
    document.body.append(footer);
  }

  /* ---------------------------------------------------------------- 8. Toasts, dialogs and form errors */

  // Small message in the corner. type: 'success' (default), 'error' or 'info'
  function toast(message, type = 'success') {
    if (!document.body) return;
    let box = document.getElementById('fs-toasts');
    if (!box) { box = document.createElement('div'); box.id = 'fs-toasts'; box.className = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.append(box); }
    let symbol;
    switch (type) {
      case 'error': symbol = 'alert'; break;
      case 'info': symbol = 'clock'; break;
      default: symbol = 'check';
    }
    const item = document.createElement('div');
    item.className = `toast toast-${type}`;
    item.innerHTML = `${icon(symbol, 18)}<span>${esc(message)}</span>`;
    box.append(item);
    setTimeout(() => { item.classList.add('toast-out'); setTimeout(() => item.remove(), 300); }, 3400);
  }

  // Opens a dialog. opts = { title, html, wide }. Returns { el (the body element), close(result), closed (Promise) }
  function openModal({ title = '', html = '', wide = false }) {
    const back = document.createElement('div');
    back.className = 'modal-backdrop';
    back.innerHTML = `<div class="modal${wide ? ' modal-wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title || 'Dialog')}">` +
      `<div class="modal-head"><h2 class="modal-title">${esc(title)}</h2><button type="button" class="btn-icon modal-x" aria-label="Close">${icon('x', 18)}</button></div>` +
      `<div class="modal-body">${html}</div></div>`;
    let done;
    const closed = new Promise((resolve) => { done = resolve; });
    const onKey = (e) => { if (e.key === 'Escape') api.close(); };
    const api = {
      el: back.querySelector('.modal-body'),
      closed,
      close(result) { if (!back.isConnected) return; back.remove(); document.removeEventListener('keydown', onKey); document.body.classList.remove('modal-open'); done(result); }
    };
    back.addEventListener('mousedown', (e) => { if (e.target === back) api.close(); });
    back.querySelector('.modal-x').addEventListener('click', () => api.close());
    document.addEventListener('keydown', onKey);
    document.body.append(back);
    document.body.classList.add('modal-open');
    const first = api.el.querySelector('input, select, textarea, button');
    if (first) first.focus();
    return api;
  }

  // "Are you sure?" dialog. Resolves true (OK) or false. opts = { title, okText, cancelText, danger }
  function confirmBox(message, { title = 'Please confirm', okText = 'Yes', cancelText = 'Cancel', danger = false } = {}) {
    const m = openModal({ title, html: `<p>${esc(message)}</p><div class="modal-actions">` +
      `<button type="button" class="btn btn-ghost" data-ans="no">${esc(cancelText)}</button>` +
      `<button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-ans="yes">${esc(okText)}</button></div>` });
    m.el.addEventListener('click', (e) => { const b = e.target.closest('[data-ans]'); if (b) m.close(b.dataset.ans === 'yes'); });
    return m.closed.then((answer) => answer === true);
  }

  // { fieldName: 'trimmed value' } for every input, select and textarea with a name
  function formData(form) {
    const out = {};
    for (const el of form.elements) {
      if (!el.name) continue;
      if (el.type === 'checkbox') out[el.name] = el.checked;
      else if (el.type === 'radio') { if (el.checked) out[el.name] = el.value; }
      else out[el.name] = el.type === 'password' ? el.value : el.value.trim();
    }
    return out;
  }

  // Shows each message under its field (the field needs a wrapper with class "field"). Returns true when there were errors.
  function showErrors(form, errors = {}) {
    clearErrors(form);
    let first = null;
    const loose = [];
    Object.entries(errors).forEach(([name, message]) => {
      const input = form.querySelector(`[name="${name}"]`);
      const field = input ? input.closest('.field') : null;
      if (!field) { loose.push(message); return; }
      field.classList.add('invalid');
      let msg = field.querySelector('.error');
      if (!msg) { msg = document.createElement('p'); msg.className = 'error'; field.append(msg); }
      msg.textContent = message;
      input.setAttribute('aria-invalid', 'true');
      first = first || input;
    });
    if (first) first.focus();
    if (loose.length) toast(loose[0], 'error');
    return !!(first || loose.length);
  }
  function clearErrors(form) {
    form.querySelectorAll('.field.invalid').forEach((f) => f.classList.remove('invalid'));
    form.querySelectorAll('.error').forEach((m) => { m.textContent = ''; });
    form.querySelectorAll('[aria-invalid]').forEach((i) => i.removeAttribute('aria-invalid'));
  }

  /* ---------------------------------------------------------------- 9. Small helpers */
  const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (ch) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
  const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
  const initials = (name) => String(name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  const params = () => new URLSearchParams(location.search);

  function toDate(value) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value);
  }
  const pad = (n) => String(n).padStart(2, '0');
  const localDay = (value) => { const d = toDate(value); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  function dayFromNow(days = 0) { const d = new Date(); d.setDate(d.getDate() + days); return localDay(d); }
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fmtDate = (value) => { const d = toDate(value); return isNaN(d) ? '' : `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
  const fmtTime = (value) => { const d = toDate(value); const h = d.getHours(); return `${h % 12 || 12}:${pad(d.getMinutes())} ${h < 12 ? 'am' : 'pm'}`; };

  // "Good morning" before 12, "Good afternoon" before 5 pm, then "Good evening".
  function greeting(hour = new Date().getHours()) {
    if (hour < 12) return 'Good morning';
    else if (hour < 17) return 'Good afternoon';
    else return 'Good evening';
  }

  const ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
    bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    check: '<path d="m20 6-11 11-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    box: '<path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
    truck: '<path d="M1 4h15v12H1zM16 9h4l3 3v4h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/>',
    refresh: '<path d="M1 4v6h6"/><path d="M3.5 15a9 9 0 1 0 2.1-9.4L1 10"/>',
    receipt: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    flower: '<circle cx="12" cy="12" r="2.5"/><path d="M12 9.5a3.5 3.5 0 1 0-3-5.3M14.5 12a3.5 3.5 0 1 0 5.3-3M12 14.5a3.5 3.5 0 1 0 3 5.3M9.5 12a3.5 3.5 0 1 0-5.3 3M9 4.2a3.5 3.5 0 0 0-4.8 4.8M19.8 9a3.5 3.5 0 0 0-4.8-4.8M15 19.8a3.5 3.5 0 0 0 4.8-4.8M4.2 15A3.5 3.5 0 0 0 9 19.8"/>',
    gift: '<path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
  };
  // icon('bag') or icon('bag', 18). Names: see ICONS above.
  const icon = (name, size = 20) => `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  // How many are left: "23 in stock", "Only 3 left" or "Out of stock".
  function stockBadge({ stock }) {
    if (stock <= 0) return '<span class="badge badge-out">Out of stock</span>';
    if (stock <= LOW_STOCK) return `<span class="badge badge-low">Only ${stock} left</span>`;
    return `<span class="badge badge-ok">${stock} in stock</span>`;
  }

  // <img> for a flower, with a soft placeholder when there is no photo. cls = extra class names
  function flowerImg(f, cls = '') {
    if (!f || !f.image) return `<span class="ph ${cls}" role="img" aria-label="${esc(f ? f.name : 'Flower')}">${icon('flower', 30)}</span>`;
    return `<img class="${cls}" src="${esc(f.image)}" alt="${esc(f.name)}" loading="lazy" onerror="FS.imgError(this)">`;
  }
  function imgError(img) {
    const span = document.createElement('span');
    span.className = 'ph ' + img.className;
    span.innerHTML = icon('flower', 30);
    img.replaceWith(span);
  }

  /* ---------------------------------------------------------------- 10. Start-up: page guard and FS.ready */
  let db = loadDb();          // all shop data: users, flowers, orders, carts
  let blocked = false;

  // <html data-roles="..."> says who may open the page:
  //   public = anyone, guest = only logged-out visitors, customer = only logged-in customers
  function guard() {
    const need = document.documentElement.dataset.roles || 'public';
    const user = rawUser();
    if (need === 'guest' && user) leave('home.html');
    else if (need === 'customer' && !user) leave('login.html?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search));
  }
  function leave(url) { blocked = true; document.documentElement.style.visibility = 'hidden'; location.replace(url); }
  function whenDom(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }

  // Page scripts put their code inside FS.ready(function (user) { ... }).
  // It runs after the page guard passed and the header exists.
  function ready(fn) { if (!blocked) whenDom(() => fn(currentUser())); }

  guard();
  // <html data-bare> (login and register pages) gets no header and footer.
  if (!blocked && !document.documentElement.hasAttribute('data-bare')) whenDom(() => { renderHeader(); renderFooter(); refreshHeader(); });

  return {
    // settings and shop details
    CATEGORIES, DEMO, SHOP, DELIVERY_FEE, FREE_DELIVERY_FROM,
    // start-up and data
    ready, resetDemo,
    // login
    currentUser, login, register, updateProfile, changePassword, isEmail, isPhone,
    // flowers and cart
    getFlowers, getFlower, getCart, cartCount, cartTotals, addToCart, setCartQty,
    // orders
    getOrders, getOrder, placeOrder,
    // page pieces
    toast, openModal, confirm: confirmBox, formData, showErrors, clearErrors,
    esc, money, initials, params, today: dayFromNow, fmtDate, fmtTime, greeting,
    icon, stockBadge, flowerImg, imgError
  };
})();
