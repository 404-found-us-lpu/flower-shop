/* Made by: Yash, Raghav and Satyam */
/* ==========================================================================
   Bloom & Petal - Flower Shop Management System
   js/app.js - the code that every page shares.

    1. Settings                 7. Orders and the order workflow
    2. Data store               8. Notifications and report numbers
    3. Demo data                9. Header and footer
    4. Login and roles         10. Toasts, dialogs and form errors
    5. Flowers (stock)         11. Small helpers (money, dates, icons, HTML pieces)
    6. Cart                    12. Start-up: page guard and FS.ready

   All data is saved in this browser with localStorage. There is no server.
   ========================================================================== */
var FS = (function () {
  'use strict';

  /* ---------------------------------------------------------------- 1. Settings */
  const DB_KEY = 'bloompetal.db.v2';          // all shop data (shared by every tab)
  const SESSION_KEY = 'bloompetal.session';   // who is logged in (one per tab)
  const DELIVERY_FEE = 50;
  const FREE_DELIVERY_FROM = 999;
  const LOW_STOCK = 5;
  const CATEGORIES = ['Bouquets', 'Single stems', 'Plants', 'Gifts'];
  const STATUSES = ['Pending', 'Confirmed', 'Preparing', 'Out for delivery', 'Delivered'];
  const FLOW = {                              // which status can follow which
    'Pending': ['Confirmed', 'Cancelled'],
    'Confirmed': ['Preparing', 'Cancelled'],
    'Preparing': ['Out for delivery', 'Cancelled'],
    'Out for delivery': ['Delivered'],
    'Delivered': [],
    'Cancelled': []
  };
  const SLOTS = ['Morning (9 am - 12 pm)', 'Afternoon (12 pm - 4 pm)', 'Evening (4 pm - 8 pm)'];
  const PAYMENTS = ['Cash on delivery', 'UPI', 'Card'];
  const ROLE_HOME = { customer: 'home.html', florist: 'staff.html', owner: 'admin.html' };
  const ROLE_LABEL = { customer: 'Customer', florist: 'Florist', owner: 'Shop owner' };
  const NAV = {                               // [page id, label, file] for each role
    customer: [['home', 'Home', 'home.html'], ['catalog', 'Flowers', 'catalog.html'], ['orders', 'My orders', 'orders.html']],
    florist: [['staff', 'Dashboard', 'staff.html'], ['manage-orders', 'Orders', 'manage-orders.html'], ['stock', 'Stock', 'stock.html']],
    owner: [['admin', 'Dashboard', 'admin.html'], ['manage-orders', 'Orders', 'manage-orders.html'], ['stock', 'Stock', 'stock.html'],
            ['users', 'Users', 'users.html'], ['reports', 'Reports', 'reports.html']]
  };
  const DEMO = {                              // the three demo logins shown on the login page
    customer: { email: 'neha@example.com', password: 'neha123' },
    florist: { email: 'priya@bloompetal.in', password: 'florist123' },
    owner: { email: 'meera@bloompetal.in', password: 'owner123' }
  };

  /* ---------------------------------------------------------------- 2. Data store */
  let db = loadDb();

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

  // Another tab saved something: load it, so two tabs (customer and florist) stay in step.
  window.addEventListener('storage', function (e) {
    if (e.key !== DB_KEY || !e.newValue) return;
    try { db = JSON.parse(e.newValue); changed(); } catch (err) { /* ignore */ }
  });

  function resetDemo() { db = seedData(); return save(); }
  function nextId(kind) { const id = db.seq[kind]; db.seq[kind] = id + 1; return id; }
  function clone(value) { return value == null ? null : JSON.parse(JSON.stringify(value)); }
  function fail(errors) { return { ok: false, errors: errors, error: errors[Object.keys(errors)[0]] }; }

  /* ---------------------------------------------------------------- 3. Demo data */
  function seedData() {
    const now = Date.now();
    const hoursAgo = function (h) { return new Date(now - h * 3600000).toISOString(); };

    const users = [
      [1, 'Meera Kapoor', 'meera@bloompetal.in', '9810012001', 'owner123', 'owner', 'Bloom & Petal, 14 Mall Road, Jalandhar', 320],
      [2, 'Priya Sharma', 'priya@bloompetal.in', '9810012002', 'florist123', 'florist', '8 Lajpat Nagar, Jalandhar', 250],
      [3, 'Neha Sharma', 'neha@example.com', '9876543210', 'neha123', 'customer', 'House 42, Model Town, Jalandhar', 80],
      [4, 'Aman Verma', 'aman@example.com', '9876543211', 'aman123', 'customer', 'B-7 Green Avenue, Ludhiana', 62],
      [5, 'Simran Kaur', 'simran@example.com', '9876543212', 'simran123', 'customer', 'Flat 304, Silver Heights, Phagwara', 41],
      [6, 'Rohit Mehra', 'rohit@bloompetal.in', '9810012003', 'florist123', 'florist', '21 Urban Estate, Jalandhar', 120]
    ].map(function (u) {
      return { id: u[0], name: u[1], email: u[2], phone: u[3], pass: hashPassword(u[4]), role: u[5], address: u[6], joined: hoursAgo(u[7] * 24) };
    });

    const flowers = [
      [1, 'Red Rose Bouquet', 'Bouquets', 800, 20, 'Twelve fresh red roses, hand tied with eucalyptus.', 'red-rose-bouquet'],
      [2, 'White Lily Bunch', 'Bouquets', 650, 15, 'Six stems of white oriental lilies, ready for a vase.', 'white-lily-bunch'],
      [3, 'Sunflower Basket', 'Bouquets', 900, 8, 'Bright sunflowers arranged in a woven cane basket.', 'sunflower-basket'],
      [4, 'Pink Tulip Bunch', 'Bouquets', 750, 12, 'Ten soft pink tulips wrapped in kraft paper.', 'pink-tulips'],
      [5, 'Gerbera Mix', 'Bouquets', 550, 18, 'A cheerful mix of gerbera daisies in five colours.', 'gerbera-mix'],
      [6, 'Lavender Bundle', 'Bouquets', 450, 4, 'A fragrant bundle of lavender tied with twine.', 'lavender-bundle'],
      [7, 'Single Red Rose', 'Single stems', 100, 50, 'One long-stem red rose with a small note card.', 'single-red-rose'],
      [8, 'Single Sunflower', 'Single stems', 120, 30, 'One tall sunflower stem, wrapped and ribboned.', 'single-sunflower'],
      [9, 'Money Plant Pot', 'Plants', 400, 12, 'An easy indoor money plant in a ceramic pot.', 'money-plant-pot'],
      [10, 'Purple Orchid Pot', 'Plants', 1200, 6, 'A flowering moth orchid that blooms for weeks.', 'orchid-pot'],
      [11, 'Succulent Pot', 'Plants', 300, 3, 'A small succulent that needs water once a week.', 'succulent-pot'],
      [12, 'Birthday Combo', 'Gifts', 1300, 5, 'A mixed bouquet with a greeting card and candles.', 'birthday-combo']
    ].map(function (f) {
      return { id: f[0], name: f[1], category: f[2], price: f[3], stock: f[4], description: f[5], image: 'images/' + f[6] + '.jpg', active: true };
    });

    // [id, customer id, placed hours ago, [[flower id, qty]...], status, delivery day offset, slot, payment, card note, receiver]
    const orders = [
      [1001, 3, 290, [[1, 1], [7, 2]], 'Delivered', -11, 0, 1, 'Happy birthday, Maa!', 'Sunita Sharma'],
      [1002, 4, 240, [[12, 1]], 'Delivered', -9, 2, 2, 'Many happy returns.', 'Ritu Verma'],
      [1003, 5, 200, [[3, 1], [9, 1]], 'Delivered', -7, 1, 1, '', ''],
      [1004, 3, 150, [[2, 2]], 'Delivered', -5, 0, 0, 'Get well soon.', 'Anita Sharma'],
      [1005, 4, 120, [[9, 1]], 'Cancelled', -3, 1, 0, '', ''],
      [1006, 5, 75, [[10, 1]], 'Delivered', -2, 2, 1, 'Congratulations on the new home.', 'Harleen Kaur'],
      [1007, 3, 30, [[4, 1], [8, 3]], 'Out for delivery', 0, 1, 1, 'Thank you for everything.', 'Meena Sharma'],
      [1008, 4, 22, [[5, 2]], 'Preparing', 1, 0, 2, '', ''],
      [1009, 5, 6, [[1, 1]], 'Confirmed', 1, 2, 1, 'Happy anniversary.', 'Gurpreet Kaur'],
      [1010, 3, 2, [[11, 2], [7, 1]], 'Pending', 2, 0, 0, '', ''],
      [1011, 4, 1, [[6, 1]], 'Pending', 2, 1, 1, 'For your desk.', 'Kabir Verma']
    ].map(function (o) {
      const user = users.find(function (u) { return u.id === o[1]; });
      const items = o[3].map(function (line) {
        const f = flowers.find(function (x) { return x.id === line[0]; });
        return { flowerId: f.id, name: f.name, price: f.price, qty: line[1] };
      });
      const subtotal = items.reduce(function (sum, i) { return sum + i.price * i.qty; }, 0);
      const delivery = subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
      const path = o[4] === 'Cancelled' ? ['Pending', 'Cancelled'] : STATUSES.slice(0, STATUSES.indexOf(o[4]) + 1);
      const history = path.map(function (status, i) {
        const at = Math.min(now - o[2] * 3600000 + i * 80 * 60000, now - (path.length - i) * 4 * 60000);
        const customerDidIt = i === 0 || status === 'Cancelled';
        return { status: status, at: new Date(at).toISOString(), by: customerDidIt ? user.name : 'Priya Sharma',
                 note: i === 0 ? 'Order placed' : (status === 'Cancelled' ? 'Cancelled by the customer' : '') };
      });
      return {
        id: o[0], userId: user.id, customer: user.name, items: items,
        subtotal: subtotal, delivery: delivery, total: subtotal + delivery,
        recipient: { name: o[9] || user.name, phone: user.phone, address: user.address },
        deliveryDate: dayFromNow(o[5]), slot: SLOTS[o[6]], payment: PAYMENTS[o[7]], note: o[8],
        status: o[4], history: history, createdAt: history[0].at
      };
    });

    const notes = [
      [1, 3, 'Order #1007 is out for delivery.', 'order.html?id=1007', false, 3],
      [2, 3, 'Order #1010 was placed. The shop will confirm it soon.', 'order.html?id=1010', false, 2],
      [3, 3, 'Order #1004 was delivered. Thank you for shopping with us.', 'order.html?id=1004', true, 120],
      [4, 1, 'New order #1011 from Aman Verma.', 'order.html?id=1011', false, 1],
      [5, 1, 'Low stock: Succulent Pot has 3 left.', 'stock.html', false, 2],
      [6, 2, 'New order #1011 from Aman Verma.', 'order.html?id=1011', false, 1],
      [7, 2, 'New order #1010 from Neha Sharma.', 'order.html?id=1010', false, 2],
      [8, 6, 'New order #1011 from Aman Verma.', 'order.html?id=1011', false, 1],
      [9, 4, 'Order #1008 is being prepared.', 'order.html?id=1008', false, 20],
      [10, 5, 'Order #1009 was confirmed by the shop.', 'order.html?id=1009', false, 5]
    ].map(function (n) { return { id: n[0], userId: n[1], text: n[2], link: n[3], read: n[4], at: hoursAgo(n[5]) }; });

    return { users: users, flowers: flowers, orders: orders, carts: {}, notes: notes,
             seq: { user: 7, flower: 13, order: 1012, note: 11 } };
  }

  /* ---------------------------------------------------------------- 4. Login and roles */

  // A small one-way scramble so passwords are not stored as plain text.
  // It is NOT real security: a real shop checks passwords on a server.
  function hashPassword(text) {
    let h = 0x811c9dc5;
    const s = 'bloom&petal:' + text;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return ('0000000' + (h >>> 0).toString(16)).slice(-8);
  }

  function publicUser(u) { if (!u) return null; const copy = clone(u); delete copy.pass; return copy; }
  function rawUser() {
    const id = Number(sessionStorage.getItem(SESSION_KEY));
    return id ? (db.users.find(function (u) { return u.id === id; }) || null) : null;
  }
  function currentUser() { return publicUser(rawUser()); }
  function isStaff(u) { return !!u && (u.role === 'florist' || u.role === 'owner'); }
  function isEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || '').trim()); }
  function isPhone(s) { return /^[6-9][0-9]{9}$/.test(String(s || '').trim()); }

  function login(email, password) {
    const mail = String(email || '').trim().toLowerCase();
    const u = db.users.find(function (x) { return x.email === mail; });
    if (!u || u.pass !== hashPassword(String(password || ''))) return fail({ password: 'Wrong email or password.' });
    sessionStorage.setItem(SESSION_KEY, String(u.id));
    return { ok: true, user: publicUser(u), home: ROLE_HOME[u.role] };
  }

  function logout() { sessionStorage.removeItem(SESSION_KEY); location.href = 'index.html'; }

  function checkPerson(data, needPassword, ignoreId) {
    const errors = {};
    const name = String(data.name || '').trim();
    const mail = String(data.email || '').trim().toLowerCase();
    if (name.length < 2) errors.name = 'Please enter the full name.';
    if (!isEmail(mail)) errors.email = 'Please enter a correct email address.';
    else if (db.users.some(function (u) { return u.email === mail && u.id !== ignoreId; })) errors.email = 'This email is already registered.';
    if (!isPhone(data.phone)) errors.phone = 'Enter a 10 digit mobile number starting with 6, 7, 8 or 9.';
    if (needPassword && String(data.password || '').length < 6) errors.password = 'Use at least 6 characters.';
    return errors;
  }

  // New customer account. Returns { ok, user, home } or { ok:false, errors, error }.
  function register(data) {
    const errors = checkPerson(data, true);
    if (data.confirm !== undefined && data.confirm !== data.password && !errors.password) errors.confirm = 'The two passwords are not the same.';
    if (Object.keys(errors).length) return fail(errors);
    const u = { id: nextId('user'), name: data.name.trim(), email: data.email.trim().toLowerCase(), phone: data.phone.trim(),
                pass: hashPassword(data.password), role: 'customer', address: String(data.address || '').trim(), joined: new Date().toISOString() };
    db.users.push(u);
    addNote(u.id, 'Welcome to Bloom & Petal, ' + u.name.split(' ')[0] + '. Your account is ready.', 'catalog.html');
    addNote('owner', 'New customer registered: ' + u.name + '.', 'users.html');
    sessionStorage.setItem(SESSION_KEY, String(u.id));
    save();
    return { ok: true, user: publicUser(u), home: ROLE_HOME.customer };
  }

  function getUsers() {
    if (!isStaff(rawUser())) return [];
    return db.users.map(function (u) {
      const copy = publicUser(u);
      copy.orders = db.orders.filter(function (o) { return o.userId === u.id; }).length;
      return copy;
    });
  }

  // Owner only: add a user (no id) or change one (with id).
  function saveUser(data) {
    const me = rawUser();
    if (!me || me.role !== 'owner') return fail({ name: 'Only the shop owner can change users.' });
    const existing = data.id ? db.users.find(function (u) { return u.id === Number(data.id); }) : null;
    const errors = checkPerson(data, !existing, existing ? existing.id : 0);
    if (existing && data.password && String(data.password).length < 6) errors.password = 'Use at least 6 characters.';
    if (!ROLE_LABEL[data.role]) errors.role = 'Please choose a role.';
    else if (existing && existing.id === me.id && data.role !== 'owner') errors.role = 'You cannot change your own role.';
    if (Object.keys(errors).length) return fail(errors);
    const u = existing || { id: nextId('user'), joined: new Date().toISOString(), address: '' };
    const roleChanged = existing && existing.role !== data.role;
    u.name = data.name.trim(); u.email = data.email.trim().toLowerCase(); u.phone = data.phone.trim(); u.role = data.role;
    if (data.address !== undefined) u.address = String(data.address).trim();
    if (data.password) u.pass = hashPassword(data.password);
    if (!existing) { db.users.push(u); addNote(u.id, 'The shop owner created your account.', ROLE_HOME[u.role]); }
    if (roleChanged) addNote(u.id, 'Your role is now ' + ROLE_LABEL[u.role] + '.', ROLE_HOME[u.role]);
    save();
    return { ok: true, user: publicUser(u) };
  }

  function deleteUser(id) {
    const me = rawUser();
    const u = db.users.find(function (x) { return x.id === Number(id); });
    if (!me || me.role !== 'owner') return fail({ user: 'Only the shop owner can remove users.' });
    if (!u) return fail({ user: 'User not found.' });
    if (u.id === me.id) return fail({ user: 'You cannot remove your own account.' });
    if (db.orders.some(function (o) { return o.userId === u.id; })) return fail({ user: u.name + ' has orders, so the account cannot be removed.' });
    db.users = db.users.filter(function (x) { return x.id !== u.id; });
    db.notes = db.notes.filter(function (n) { return n.userId !== u.id; });
    delete db.carts[u.id];
    save();
    return { ok: true };
  }

  // The logged-in user changes their own details.
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

  /* ---------------------------------------------------------------- 5. Flowers (stock) */
  function byName(a, b) { return a.name.localeCompare(b.name); }
  function findFlower(id) { return db.flowers.find(function (f) { return f.id === Number(id); }) || null; }

  // Flowers on sale. Pass { all: true } to also get archived ones (stock page).
  function getFlowers(opts) {
    return clone(db.flowers.filter(function (f) { return (opts && opts.all) || f.active; }).sort(byName));
  }
  function getFlower(id) { return clone(findFlower(id)); }

  // Florist or owner: add a flower (no id) or change one (with id).
  function saveFlower(data) {
    if (!isStaff(rawUser())) return fail({ name: 'Only the shop team can change flowers.' });
    const existing = data.id ? findFlower(data.id) : null;
    const errors = {};
    const name = String(data.name || '').trim();
    const price = Number(data.price), stock = Number(data.stock);
    if (name.length < 2) errors.name = 'Please enter the flower name.';
    else if (db.flowers.some(function (f) { return f.name.toLowerCase() === name.toLowerCase() && (!existing || f.id !== existing.id); })) errors.name = 'A flower with this name already exists.';
    if (CATEGORIES.indexOf(data.category) === -1) errors.category = 'Please choose a type.';
    if (!Number.isInteger(price) || price < 1 || price > 100000) errors.price = 'Price must be a whole number from 1 to 1,00,000.';
    if (!Number.isInteger(stock) || stock < 0 || stock > 9999) errors.stock = 'Stock must be a whole number from 0 to 9,999.';
    if (Object.keys(errors).length) return fail(errors);
    const f = existing || { id: nextId('flower'), image: '', active: true };
    f.name = name; f.category = data.category; f.price = price; f.stock = stock;
    f.description = String(data.description || '').trim();
    if (data.image !== undefined) f.image = data.image;
    if (data.active !== undefined) f.active = !!data.active;
    if (!existing) db.flowers.push(f);
    if (!save()) return fail({ image: 'The photo is too large to save. Try a smaller one.' });
    return { ok: true, flower: clone(f) };
  }

  // Owner only. A flower that is part of an old order is archived (hidden), not erased.
  function deleteFlower(id) {
    const me = rawUser();
    const f = findFlower(id);
    if (!me || me.role !== 'owner') return fail({ flower: 'Only the shop owner can delete flowers.' });
    if (!f) return fail({ flower: 'Flower not found.' });
    const used = db.orders.some(function (o) { return o.items.some(function (i) { return i.flowerId === f.id; }); });
    if (used) f.active = false;
    else db.flowers = db.flowers.filter(function (x) { return x.id !== f.id; });
    save();
    return { ok: true, archived: used };
  }

  /* ---------------------------------------------------------------- 6. Cart (one per customer) */
  function cartRows() {
    const me = rawUser();
    if (!me) return [];
    if (!db.carts[me.id]) db.carts[me.id] = [];
    return db.carts[me.id];
  }

  // [{ flower, qty, lineTotal }] for the logged-in customer
  function getCart() {
    return cartRows().map(function (row) {
      const f = findFlower(row.flowerId);
      return f && f.active ? { flower: clone(f), qty: row.qty, lineTotal: f.price * row.qty } : null;
    }).filter(Boolean);
  }
  function cartCount() { return getCart().reduce(function (sum, l) { return sum + l.qty; }, 0); }
  function cartTotals() {
    const subtotal = getCart().reduce(function (sum, l) { return sum + l.lineTotal; }, 0);
    const delivery = subtotal === 0 || subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
    return { subtotal: subtotal, delivery: delivery, total: subtotal + delivery,
             freeFrom: FREE_DELIVERY_FROM, toFree: Math.max(FREE_DELIVERY_FROM - subtotal, 0) };
  }

  function addToCart(flowerId, qty) {
    const me = rawUser();
    const f = findFlower(flowerId);
    const add = Number(qty) || 1;
    if (!me || me.role !== 'customer') return fail({ cart: 'Please log in as a customer to order flowers.' });
    if (!f || !f.active) return fail({ cart: 'This flower is not on sale any more.' });
    if (f.stock < 1) return fail({ cart: f.name + ' is out of stock.' });
    const rows = cartRows();
    const row = rows.find(function (r) { return r.flowerId === f.id; });
    const want = (row ? row.qty : 0) + add;
    if (want > f.stock) return fail({ cart: 'Only ' + f.stock + ' of ' + f.name + ' in stock.' });
    if (row) row.qty = want; else rows.push({ flowerId: f.id, qty: want });
    save();
    return { ok: true, qty: want, count: cartCount() };
  }

  function setCartQty(flowerId, qty) {
    const f = findFlower(flowerId);
    const rows = cartRows();
    const row = rows.find(function (r) { return r.flowerId === Number(flowerId); });
    const want = Math.floor(Number(qty));
    if (!row || !f) return fail({ cart: 'This flower is not in your cart.' });
    if (!(want >= 1)) return removeFromCart(flowerId);
    if (want > f.stock) return fail({ cart: 'Only ' + f.stock + ' of ' + f.name + ' in stock.' });
    row.qty = want;
    save();
    return { ok: true, qty: want };
  }

  function removeFromCart(flowerId) {
    const me = rawUser();
    if (me) db.carts[me.id] = cartRows().filter(function (r) { return r.flowerId !== Number(flowerId); });
    save();
    return { ok: true };
  }
  function clearCart() { const me = rawUser(); if (me) { db.carts[me.id] = []; save(); } }

  /* ---------------------------------------------------------------- 7. Orders and the order workflow */
  function findOrder(id) { return db.orders.find(function (o) { return o.id === Number(id); }) || null; }
  function newestFirst(a, b) { return b.id - a.id; }

  // Shop team gets every order. A customer gets only their own.
  function getOrders() {
    const me = rawUser();
    if (!me) return [];
    return clone(db.orders.filter(function (o) { return isStaff(me) || o.userId === me.id; }).sort(newestFirst));
  }
  function getOrder(id) {
    const me = rawUser();
    const o = findOrder(id);
    return me && o && (isStaff(me) || o.userId === me.id) ? clone(o) : null;
  }

  // Turns the cart into an order. details = { name, phone, address, deliveryDate, slot, payment, note }
  function placeOrder(details) {
    const me = rawUser();
    const lines = getCart();
    const errors = {};
    if (!me || me.role !== 'customer') return fail({ cart: 'Please log in as a customer to place an order.' });
    if (!lines.length) return fail({ cart: 'Your cart is empty.' });
    lines.forEach(function (l) { if (l.qty > l.flower.stock) errors.cart = 'Only ' + l.flower.stock + ' of ' + l.flower.name + ' left. Please change the quantity.'; });
    if (String(details.name || '').trim().length < 2) errors.name = 'Please enter the receiver\'s name.';
    if (!isPhone(details.phone)) errors.phone = 'Enter a 10 digit mobile number starting with 6, 7, 8 or 9.';
    if (String(details.address || '').trim().length < 10) errors.address = 'Please write the full delivery address.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(details.deliveryDate || '')) errors.deliveryDate = 'Please choose a delivery date.';
    else if (details.deliveryDate < dayFromNow(0)) errors.deliveryDate = 'The delivery date cannot be in the past.';
    else if (details.deliveryDate > dayFromNow(60)) errors.deliveryDate = 'Please choose a date within the next 60 days.';
    if (SLOTS.indexOf(details.slot) === -1) errors.slot = 'Please choose a delivery time.';
    if (PAYMENTS.indexOf(details.payment) === -1) errors.payment = 'Please choose how you will pay.';
    if (Object.keys(errors).length) return fail(errors);

    const totals = cartTotals();
    const order = {
      id: nextId('order'), userId: me.id, customer: me.name,
      items: lines.map(function (l) { return { flowerId: l.flower.id, name: l.flower.name, price: l.flower.price, qty: l.qty }; }),
      subtotal: totals.subtotal, delivery: totals.delivery, total: totals.total,
      recipient: { name: details.name.trim(), phone: details.phone.trim(), address: details.address.trim() },
      deliveryDate: details.deliveryDate, slot: details.slot, payment: details.payment, note: String(details.note || '').trim(),
      status: 'Pending', createdAt: new Date().toISOString(), history: []
    };
    order.history.push({ status: 'Pending', at: order.createdAt, by: me.name, note: 'Order placed' });
    lines.forEach(function (l) {                      // take the flowers out of stock
      const f = findFlower(l.flower.id);
      f.stock -= l.qty;
      if (f.stock <= LOW_STOCK) addNote('staff', 'Low stock: ' + f.name + ' has ' + f.stock + ' left.', 'stock.html');
    });
    db.orders.push(order);
    db.carts[me.id] = [];
    addNote(me.id, 'Order #' + order.id + ' was placed. The shop will confirm it soon.', 'order.html?id=' + order.id);
    addNote('staff', 'New order #' + order.id + ' from ' + me.name + '.', 'order.html?id=' + order.id);
    save();
    return { ok: true, order: clone(order) };
  }

  // The statuses the logged-in user may move this order to.
  function nextStatuses(order) {
    const me = rawUser();
    if (!me || !order) return [];
    if (me.role === 'customer') {
      return order.userId === me.id && (order.status === 'Pending' || order.status === 'Confirmed') ? ['Cancelled'] : [];
    }
    return (FLOW[order.status] || []).slice();
  }
  function canCancel(order) { return nextStatuses(order).indexOf('Cancelled') !== -1; }

  function setOrderStatus(id, status, note) {
    const me = rawUser();
    const o = findOrder(id);
    if (!me || !o) return fail({ order: 'Order not found.' });
    if (me.role === 'customer' && o.userId !== me.id) return fail({ order: 'Order not found.' });
    if (nextStatuses(o).indexOf(status) === -1) return fail({ order: 'An order that is "' + o.status + '" cannot be moved to "' + status + '".' });
    if (status === 'Cancelled') {                     // put the flowers back in stock
      o.items.forEach(function (i) { const f = findFlower(i.flowerId); if (f) f.stock += i.qty; });
    }
    o.status = status;
    o.history.push({ status: status, at: new Date().toISOString(), by: me.name, note: String(note || '').trim() });
    const link = 'order.html?id=' + o.id;
    if (me.role === 'customer') addNote('staff', 'Order #' + o.id + ' was cancelled by ' + me.name + '.', link);
    else addNote(o.userId, 'Order #' + o.id + ' is now ' + status.toLowerCase() + '.', link);
    save();
    return { ok: true, order: clone(o) };
  }

  /* ---------------------------------------------------------------- 8. Notifications and report numbers */

  // target: a user id, or 'staff' (owner + florists), or a role name
  function addNote(target, text, link) {
    db.users.filter(function (u) {
      if (typeof target === 'number') return u.id === target;
      if (target === 'staff') return isStaff(u);
      return u.role === target;
    }).forEach(function (u) {
      db.notes.push({ id: nextId('note'), userId: u.id, text: text, link: link || '', read: false, at: new Date().toISOString() });
    });
    if (db.notes.length > 300) db.notes = db.notes.slice(-300);
  }
  function myNotifications() {
    const me = rawUser();
    if (!me) return [];
    return clone(db.notes.filter(function (n) { return n.userId === me.id; })
      .sort(function (a, b) { return (new Date(b.at) - new Date(a.at)) || (b.id - a.id); }));   // newest first
  }
  function unreadCount() { return myNotifications().filter(function (n) { return !n.read; }).length; }
  function markAllRead() {
    const me = rawUser();
    if (!me) return;
    db.notes.forEach(function (n) { if (n.userId === me.id) n.read = true; });
    save();
  }

  // Numbers for dashboards and reports (shop team only). opts = { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' }
  function stats(opts) {
    if (!isStaff(rawUser())) return null;
    const from = opts && opts.from, to = opts && opts.to;
    const all = db.orders.filter(function (o) { const d = localDay(o.createdAt); return (!from || d >= from) && (!to || d <= to); });
    const good = all.filter(function (o) { return o.status !== 'Cancelled'; });
    const revenue = good.reduce(function (sum, o) { return sum + o.total; }, 0);
    const byStatus = {}, cat = {}, top = {}, days = {}, people = {};
    STATUSES.concat('Cancelled').forEach(function (s) { byStatus[s] = 0; });
    CATEGORIES.forEach(function (c) { cat[c] = 0; });
    all.forEach(function (o) { byStatus[o.status] += 1; });
    good.forEach(function (o) {
      o.items.forEach(function (i) {
        const f = findFlower(i.flowerId);
        const c = f ? f.category : 'Other';
        cat[c] = (cat[c] || 0) + i.price * i.qty;
        if (!top[i.name]) top[i.name] = { name: i.name, qty: 0, revenue: 0 };
        top[i.name].qty += i.qty; top[i.name].revenue += i.price * i.qty;
      });
      const d = localDay(o.createdAt);
      if (!days[d]) days[d] = { date: d, revenue: 0, orders: 0 };
      days[d].revenue += o.total; days[d].orders += 1;
      if (!people[o.userId]) people[o.userId] = { name: o.customer, orders: 0, spent: 0 };
      people[o.userId].orders += 1; people[o.userId].spent += o.total;
    });
    const list = function (obj) { return Object.keys(obj).map(function (k) { return obj[k]; }); };
    return {
      orders: all.length, paidOrders: good.length, cancelled: byStatus.Cancelled, revenue: revenue,
      average: good.length ? Math.round(revenue / good.length) : 0,
      open: all.filter(function (o) { return o.status !== 'Delivered' && o.status !== 'Cancelled'; }).length,
      byStatus: byStatus,
      byCategory: Object.keys(cat).map(function (k) { return { label: k, value: cat[k] }; }).sort(function (a, b) { return b.value - a.value; }),
      topFlowers: list(top).sort(function (a, b) { return b.qty - a.qty || b.revenue - a.revenue; }),
      byDay: list(days).sort(function (a, b) { return a.date < b.date ? -1 : 1; }),
      topCustomers: list(people).sort(function (a, b) { return b.spent - a.spent; }),
      customers: db.users.filter(function (u) { return u.role === 'customer'; }).length,
      flowers: db.flowers.filter(function (f) { return f.active; }).length,
      lowStock: clone(db.flowers.filter(function (f) { return f.active && f.stock <= LOW_STOCK; }).sort(function (a, b) { return a.stock - b.stock; }))
    };
  }

  // Sales for each of the last n days, oldest first: [{ date, label, revenue, orders }]
  function dailySales(n) {
    const s = stats({ from: dayFromNow(-(n - 1)), to: dayFromNow(0) });
    const out = [];
    if (!s) return out;
    for (let i = n - 1; i >= 0; i--) {
      const date = dayFromNow(-i);
      const hit = s.byDay.find(function (d) { return d.date === date; });
      out.push({ date: date, label: fmtDate(date).replace(/ \d{4}$/, ''), revenue: hit ? hit.revenue : 0, orders: hit ? hit.orders : 0 });
    }
    return out;
  }

  /* ---------------------------------------------------------------- 9. Header and footer */
  const BRAND_MARK = '<span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="6.6" r="3.3"/><circle cx="17.2" cy="10.4" r="3.3"/><circle cx="15.2" cy="16.4" r="3.3"/><circle cx="8.8" cy="16.4" r="3.3"/><circle cx="6.8" cy="10.4" r="3.3"/><circle class="core" cx="12" cy="12" r="2.4"/></svg></span>';

  function renderHeader() {
    if (document.getElementById('fs-header')) return;
    const user = currentUser();
    const page = document.documentElement.dataset.page || '';
    let links = '', end = '', pops = '';
    if (user) {
      links = NAV[user.role].map(function (n) {
        return '<a href="' + n[2] + '"' + (n[0] === page ? ' class="active" aria-current="page"' : '') + '>' + n[1] + '</a>';
      }).join('');
      if (user.role === 'customer') {
        end += '<form class="nav-search" action="catalog.html" method="get" role="search">' + icon('search', 16) +
               '<input type="search" name="q" placeholder="Search flowers" aria-label="Search flowers"></form>' +
               '<a class="nav-icon" href="cart.html" aria-label="Cart">' + icon('bag') + '<span class="nav-count" id="fs-cart-count" hidden></span></a>';
      }
      end += '<button type="button" class="nav-icon" id="fs-bell" aria-label="Notifications" aria-expanded="false">' + icon('bell') + '<span class="nav-count" id="fs-bell-count" hidden></span></button>' +
             '<button type="button" class="nav-avatar" id="fs-avatar" aria-label="Account menu" aria-expanded="false">' + esc(initials(user.name)) + '</button>' +
             '<button type="button" class="nav-icon nav-burger" id="fs-burger" aria-label="Menu" aria-expanded="false">' + icon('menu') + '</button>';
      pops = '<div class="nav-pop" id="fs-notes" hidden></div>' +
             '<div class="nav-pop nav-menu" id="fs-menu" hidden><div class="nav-menu-head"><strong>' + esc(user.name) + '</strong><span>' + esc(user.email) + '</span>' + roleBadge(user.role) + '</div>' +
             '<a href="profile.html">' + icon('user', 18) + 'My profile</a>' +
             '<button type="button" data-act="reset">' + icon('refresh', 18) + 'Reset demo data</button>' +
             '<button type="button" data-act="logout">' + icon('logout', 18) + 'Log out</button></div>';
    } else {
      end = '<a class="btn btn-ghost btn-sm" href="login.html">Sign in</a><a class="btn btn-primary btn-sm" href="register.html">Create account</a>';
    }
    const header = document.createElement('header');
    header.className = 'nav-wrap';
    header.id = 'fs-header';
    header.innerHTML = '<nav class="nav" aria-label="Main"><a class="brand" href="' + (user ? ROLE_HOME[user.role] : 'index.html') + '">' + BRAND_MARK +
      '<span class="brand-name">Bloom &amp; Petal</span></a><div class="nav-links" id="fs-links">' + links + '</div><div class="nav-end">' + end + '</div>' + pops + '</nav>';
    document.body.prepend(header);
    if (!user) return;

    const nav = header.querySelector('.nav');
    const notes = document.getElementById('fs-notes'), menu = document.getElementById('fs-menu');
    const bell = document.getElementById('fs-bell'), avatar = document.getElementById('fs-avatar'), burger = document.getElementById('fs-burger');
    const closeAll = function () {
      notes.hidden = true; menu.hidden = true; nav.classList.remove('nav-open');
      [bell, avatar, burger].forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    };
    const toggle = function (button, show) { const wasOpen = button.getAttribute('aria-expanded') === 'true'; closeAll(); if (!wasOpen) { show(); button.setAttribute('aria-expanded', 'true'); } };
    bell.addEventListener('click', function (e) {
      e.stopPropagation();
      toggle(bell, function () { notes.innerHTML = notesHTML(); notes.hidden = false; if (unreadCount()) markAllRead(); });
    });
    avatar.addEventListener('click', function (e) { e.stopPropagation(); toggle(avatar, function () { menu.hidden = false; }); });
    burger.addEventListener('click', function (e) { e.stopPropagation(); toggle(burger, function () { nav.classList.add('nav-open'); }); });
    notes.addEventListener('click', function (e) { e.stopPropagation(); });
    menu.addEventListener('click', function (e) {
      e.stopPropagation();
      const act = e.target.closest('[data-act]');
      if (!act) return;
      if (act.dataset.act === 'logout') logout();
      if (act.dataset.act === 'reset') {
        closeAll();
        confirmBox('All orders, flowers and users go back to the demo data. You will be logged out.', { title: 'Reset demo data?', okText: 'Reset', danger: true })
          .then(function (yes) { if (yes) { resetDemo(); sessionStorage.removeItem(SESSION_KEY); location.href = 'index.html'; } });
      }
    });
    document.addEventListener('click', closeAll);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });
  }

  function notesHTML() {
    const list = myNotifications().slice(0, 8);
    if (!list.length) return '<div class="nav-pop-head"><strong>Notifications</strong></div><p class="nav-pop-empty">Nothing new yet.</p>';
    return '<div class="nav-pop-head"><strong>Notifications</strong><span>' + list.filter(function (n) { return !n.read; }).length + ' new</span></div><ul class="note-list">' +
      list.map(function (n) {
        return '<li' + (n.read ? '' : ' class="unread"') + '><a href="' + esc(n.link || '#') + '"><span>' + esc(n.text) + '</span><small>' + timeAgo(n.at) + '</small></a></li>';
      }).join('') + '</ul>';
  }

  // Keeps the cart number and the bell number in the header correct.
  function refreshHeader() {
    if (typeof document === 'undefined' || !document.getElementById) return;
    const cart = document.getElementById('fs-cart-count'), bell = document.getElementById('fs-bell-count');
    if (cart) { const n = cartCount(); cart.textContent = n; cart.hidden = n === 0; }
    if (bell) { const n = unreadCount(); bell.textContent = n; bell.hidden = n === 0; }
  }

  function renderFooter() {
    if (document.getElementById('fs-footer')) return;
    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.id = 'fs-footer';
    footer.innerHTML = '<div class="wrap footer-inner"><div class="footer-brand">' + BRAND_MARK + '<div><strong>Bloom &amp; Petal</strong>' +
      '<p>Flower Shop Management System</p></div></div><div class="footer-meta"><p>CSE326 Internet Programming project</p>' +
      '<p>Made by Yash, Raghav and Satyam, Section K4P26GH</p><p>Demo data is saved only in this browser.</p></div></div>';
    document.body.append(footer);
  }

  /* ---------------------------------------------------------------- 10. Toasts, dialogs and form errors */

  // Small message in the corner. type: 'success' (default), 'error' or 'info'
  function toast(message, type) {
    if (typeof document === 'undefined' || !document.body) return;
    let box = document.getElementById('fs-toasts');
    if (!box) { box = document.createElement('div'); box.id = 'fs-toasts'; box.className = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.append(box); }
    const kind = type || 'success';
    const item = document.createElement('div');
    item.className = 'toast toast-' + kind;
    item.innerHTML = icon(kind === 'error' ? 'alert' : kind === 'info' ? 'bell' : 'check', 18) + '<span>' + esc(message) + '</span>';
    box.append(item);
    setTimeout(function () { item.classList.add('toast-out'); setTimeout(function () { item.remove(); }, 300); }, 3400);
  }

  // Opens a dialog. opts = { title, html, wide }. Returns { el (the body element), close(result), closed (Promise) }
  function openModal(opts) {
    const back = document.createElement('div');
    back.className = 'modal-backdrop';
    back.innerHTML = '<div class="modal' + (opts.wide ? ' modal-wide' : '') + '" role="dialog" aria-modal="true" aria-label="' + esc(opts.title || 'Dialog') + '">' +
      '<div class="modal-head"><h2 class="modal-title">' + esc(opts.title || '') + '</h2><button type="button" class="btn-icon modal-x" aria-label="Close">' + icon('x', 18) + '</button></div>' +
      '<div class="modal-body">' + (opts.html || '') + '</div></div>';
    let done;
    const closed = new Promise(function (resolve) { done = resolve; });
    const onKey = function (e) { if (e.key === 'Escape') api.close(); };
    const api = {
      el: back.querySelector('.modal-body'),
      closed: closed,
      close: function (result) { if (!back.isConnected) return; back.remove(); document.removeEventListener('keydown', onKey); document.body.classList.remove('modal-open'); done(result); }
    };
    back.addEventListener('mousedown', function (e) { if (e.target === back) api.close(); });
    back.querySelector('.modal-x').addEventListener('click', function () { api.close(); });
    document.addEventListener('keydown', onKey);
    document.body.append(back);
    document.body.classList.add('modal-open');
    const first = api.el.querySelector('input, select, textarea, button');
    if (first) first.focus();
    return api;
  }

  // "Are you sure?" dialog. Resolves true (OK) or false. opts = { title, okText, cancelText, danger }
  function confirmBox(message, opts) {
    const o = opts || {};
    const m = openModal({ title: o.title || 'Please confirm', html: '<p>' + esc(message) + '</p><div class="modal-actions">' +
      '<button type="button" class="btn btn-ghost" data-ans="no">' + esc(o.cancelText || 'Cancel') + '</button>' +
      '<button type="button" class="btn ' + (o.danger ? 'btn-danger' : 'btn-primary') + '" data-ans="yes">' + esc(o.okText || 'Yes') + '</button></div>' });
    m.el.addEventListener('click', function (e) { const b = e.target.closest('[data-ans]'); if (b) m.close(b.dataset.ans === 'yes'); });
    return m.closed.then(function (answer) { return answer === true; });
  }

  // { fieldName: 'trimmed value' } for every input, select and textarea with a name
  function formData(form) {
    const out = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      if (el.type === 'checkbox') out[el.name] = el.checked;
      else if (el.type === 'radio') { if (el.checked) out[el.name] = el.value; }
      else out[el.name] = el.type === 'password' ? el.value : String(el.value).trim();
    });
    return out;
  }

  // Shows each message under its field (the field needs a wrapper with class "field"). Returns true when there were errors.
  function showErrors(form, errors) {
    clearErrors(form);
    let first = null, loose = [];
    Object.keys(errors || {}).forEach(function (name) {
      const input = form.querySelector('[name="' + name + '"]');
      const field = input ? input.closest('.field') : null;
      if (!field) { loose.push(errors[name]); return; }
      field.classList.add('invalid');
      let msg = field.querySelector('.error');
      if (!msg) { msg = document.createElement('p'); msg.className = 'error'; field.append(msg); }
      msg.textContent = errors[name];
      input.setAttribute('aria-invalid', 'true');
      if (!first) first = input;
    });
    if (first) first.focus();
    if (loose.length) toast(loose[0], 'error');
    return !!(first || loose.length);
  }
  function clearErrors(form) {
    form.querySelectorAll('.field.invalid').forEach(function (f) { f.classList.remove('invalid'); });
    form.querySelectorAll('.error').forEach(function (m) { m.textContent = ''; });
    form.querySelectorAll('[aria-invalid]').forEach(function (i) { i.removeAttribute('aria-invalid'); });
  }

  /* ---------------------------------------------------------------- 11. Small helpers */
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  function money(n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); }
  function initials(name) { return String(name || '?').trim().split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0).toUpperCase(); }).join(''); }
  function params() { return new URLSearchParams(location.search); }

  function toDate(value) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value);
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function localDay(value) { const d = toDate(value); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function dayFromNow(days) { const d = new Date(); d.setDate(d.getDate() + (days || 0)); return localDay(d); }
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtDate(value) { const d = toDate(value); return isNaN(d) ? '' : d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }
  function fmtTime(value) { const d = toDate(value); const h = d.getHours(); return (h % 12 || 12) + ':' + pad(d.getMinutes()) + (h < 12 ? ' am' : ' pm'); }
  function fmtDateTime(value) { const d = toDate(value); return isNaN(d) ? '' : d.getDate() + ' ' + MONTHS[d.getMonth()] + ', ' + fmtTime(value); }
  function timeAgo(value) {
    const mins = Math.round((Date.now() - toDate(value).getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + ' min ago';
    if (mins < 1440) return Math.round(mins / 60) + ' h ago';
    if (mins < 10080) return Math.round(mins / 1440) + ' d ago';
    return fmtDate(value);
  }

  const ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    'arrow-up': '<path d="M7 17 17 7M8 7h9v9"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    check: '<path d="m20 6-11 11-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    box: '<path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
    chart: '<path d="M12 20V10M18 20V4M6 20v-4"/>',
    truck: '<path d="M1 4h15v12H1zM16 9h4l3 3v4h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/>',
    refresh: '<path d="M1 4v6h6"/><path d="M3.5 15a9 9 0 1 0 2.1-9.4L1 10"/>',
    receipt: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
    pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    filter: '<path d="M22 3H2l8 9.5V19l4 2v-8.5z"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    flower: '<circle cx="12" cy="12" r="2.5"/><path d="M12 9.5a3.5 3.5 0 1 0-3-5.3M14.5 12a3.5 3.5 0 1 0 5.3-3M12 14.5a3.5 3.5 0 1 0 3 5.3M9.5 12a3.5 3.5 0 1 0-5.3 3M9 4.2a3.5 3.5 0 0 0-4.8 4.8M19.8 9a3.5 3.5 0 0 0-4.8-4.8M15 19.8a3.5 3.5 0 0 0 4.8-4.8M4.2 15A3.5 3.5 0 0 0 9 19.8"/>',
    gift: '<path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3 1.2-6.8-5-4.9 6.9-1z"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
  };
  // icon('bag') or icon('bag', 18). Names: see ICONS above.
  function icon(name, size) {
    const s = size || 20;
    return '<svg class="icon" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }

  const STATUS_CLASS = { 'Pending': 'pending', 'Confirmed': 'confirmed', 'Preparing': 'preparing', 'Out for delivery': 'delivery', 'Delivered': 'delivered', 'Cancelled': 'cancelled' };
  function badge(status) { return '<span class="badge badge-' + (STATUS_CLASS[status] || 'pending') + '">' + esc(status) + '</span>'; }
  function roleBadge(role) { return '<span class="badge badge-role-' + esc(role) + '">' + esc(ROLE_LABEL[role] || role) + '</span>'; }
  function stockBadge(f) {
    if (!f.active) return '<span class="badge badge-archived">Archived</span>';
    if (f.stock <= 0) return '<span class="badge badge-out">Out of stock</span>';
    if (f.stock <= LOW_STOCK) return '<span class="badge badge-low">Only ' + f.stock + ' left</span>';
    return '<span class="badge badge-ok">' + f.stock + ' in stock</span>';
  }

  // <img> for a flower, with a soft placeholder when there is no photo. cls = extra class names
  function flowerImg(f, cls) {
    const c = cls || '';
    if (!f || !f.image) return '<span class="ph ' + c + '" role="img" aria-label="' + esc(f ? f.name : 'Flower') + '">' + icon('flower', 30) + '</span>';
    return '<img class="' + c + '" src="' + esc(f.image) + '" alt="' + esc(f.name) + '" loading="lazy" onerror="FS.imgError(this)">';
  }
  function imgError(img) {
    const span = document.createElement('span');
    span.className = 'ph ' + img.className;
    span.innerHTML = icon('flower', 30);
    img.replaceWith(span);
  }

  // Five dots that show how far an order is.
  function trackerHTML(order) {
    if (order.status === 'Cancelled') return '<div class="tracker-cancelled">' + icon('x', 18) + '<span>This order was cancelled.</span></div>';
    const at = STATUSES.indexOf(order.status);
    return '<ol class="tracker">' + STATUSES.map(function (s, i) {
      return '<li class="' + (i < at ? 'done' : i === at ? 'now' : '') + '"><span class="tracker-dot">' + (i < at ? icon('check', 14) : (i + 1)) + '</span><span class="tracker-label">' + s + '</span></li>';
    }).join('') + '</ol>';
  }
  // The dated history of an order, newest first.
  function timelineHTML(order) {
    return '<ol class="timeline">' + order.history.slice().reverse().map(function (h, i) {
      return '<li class="' + (i === 0 ? 'now' : 'done') + '"><span class="timeline-dot"></span><div class="timeline-body"><strong>' + esc(h.status) + '</strong>' +
        '<span class="muted">' + fmtDateTime(h.at) + ' by ' + esc(h.by) + '</span>' + (h.note ? '<p>' + esc(h.note) + '</p>' : '') + '</div></li>';
    }).join('') + '</ol>';
  }

  // Horizontal bars. rows = [{ label, value, display }]  (display = text shown at the end, default the value)
  function barsHTML(rows) {
    const max = Math.max.apply(null, rows.map(function (r) { return r.value; }).concat(1));
    if (!rows.length) return '<p class="muted">Nothing to show yet.</p>';
    return '<div class="bars">' + rows.map(function (r) {
      const w = r.value > 0 ? Math.max(Math.round(r.value / max * 100), 3) : 0;
      return '<div class="bar-row"><span class="bar-label">' + esc(r.label) + '</span><div class="bar-track"><div class="bar-fill" style="width:' + w + '%"></div></div>' +
        '<span class="bar-value">' + esc(r.display != null ? r.display : r.value) + '</span></div>';
    }).join('') + '</div>';
  }
  // Upright columns. rows = [{ label, value, title }]
  function colsHTML(rows) {
    const max = Math.max.apply(null, rows.map(function (r) { return r.value; }).concat(1));
    return '<div class="cols">' + rows.map(function (r) {
      const h = r.value > 0 ? Math.max(Math.round(r.value / max * 100), 4) : 0;
      return '<div class="col" title="' + esc(r.title || (r.label + ': ' + r.value)) + '"><div class="col-space"><div class="col-bar" style="height:' + h + '%"></div></div><span class="col-label">' + esc(r.label) + '</span></div>';
    }).join('') + '</div>';
  }

  // Reads a photo the user picked and makes it small enough to save. Resolves a data URL.
  function readImage(file, maxSide) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type)) return reject(new Error('Please choose a picture file.'));
      const reader = new FileReader();
      reader.onerror = function () { reject(new Error('The picture could not be read.')); };
      reader.onload = function () {
        const img = new Image();
        img.onerror = function () { reject(new Error('The picture could not be read.')); };
        img.onload = function () {
          const scale = Math.min(1, (maxSide || 640) / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* ---------------------------------------------------------------- 12. Start-up: page guard and FS.ready */
  let blocked = false;

  // <html data-roles="..."> says who may open the page:
  //   public = anyone, guest = only logged-out visitors, or a list such as "florist,owner"
  function guard() {
    const need = (document.documentElement.dataset.roles || 'public').split(',').map(function (s) { return s.trim(); });
    const user = rawUser();
    if (need.indexOf('guest') !== -1) { if (user) leave(ROLE_HOME[user.role]); return; }
    if (need.indexOf('public') !== -1) return;
    if (!user) return leave('login.html?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search));
    if (need.indexOf(user.role) === -1) leave(ROLE_HOME[user.role]);
  }
  function leave(url) { blocked = true; document.documentElement.style.visibility = 'hidden'; location.replace(url); }
  function whenDom(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }

  // Page scripts put their code inside FS.ready(function (user) { ... }).
  // It runs after the page guard passed and the header exists.
  function ready(fn) { if (!blocked) whenDom(function () { fn(currentUser()); }); }

  if (typeof document !== 'undefined' && document.documentElement) {
    guard();
    // <html data-bare> (login and register pages) gets no header and footer.
    if (!blocked && !document.documentElement.hasAttribute('data-bare')) whenDom(function () { renderHeader(); renderFooter(); refreshHeader(); });
  }

  return {
    // settings
    CATEGORIES: CATEGORIES, STATUSES: STATUSES, SLOTS: SLOTS, PAYMENTS: PAYMENTS, ROLE_HOME: ROLE_HOME, ROLE_LABEL: ROLE_LABEL,
    DEMO: DEMO, LOW_STOCK: LOW_STOCK, DELIVERY_FEE: DELIVERY_FEE, FREE_DELIVERY_FROM: FREE_DELIVERY_FROM,
    // start-up and data
    ready: ready, resetDemo: resetDemo,
    // login and users
    currentUser: currentUser, login: login, logout: logout, register: register, getUsers: getUsers, saveUser: saveUser, deleteUser: deleteUser,
    updateProfile: updateProfile, changePassword: changePassword, isEmail: isEmail, isPhone: isPhone,
    // flowers
    getFlowers: getFlowers, getFlower: getFlower, saveFlower: saveFlower, deleteFlower: deleteFlower,
    // cart
    getCart: getCart, cartCount: cartCount, cartTotals: cartTotals, addToCart: addToCart, setCartQty: setCartQty, removeFromCart: removeFromCart, clearCart: clearCart,
    // orders
    getOrders: getOrders, getOrder: getOrder, placeOrder: placeOrder, nextStatuses: nextStatuses, canCancel: canCancel, setOrderStatus: setOrderStatus,
    // notifications and numbers
    myNotifications: myNotifications, unreadCount: unreadCount, markAllRead: markAllRead, stats: stats, dailySales: dailySales,
    // page pieces
    toast: toast, openModal: openModal, confirm: confirmBox, formData: formData, showErrors: showErrors, clearErrors: clearErrors,
    esc: esc, money: money, initials: initials, params: params, today: dayFromNow, fmtDate: fmtDate, fmtTime: fmtTime, fmtDateTime: fmtDateTime, timeAgo: timeAgo,
    icon: icon, badge: badge, roleBadge: roleBadge, stockBadge: stockBadge, flowerImg: flowerImg, imgError: imgError,
    trackerHTML: trackerHTML, timelineHTML: timelineHTML, barsHTML: barsHTML, colsHTML: colsHTML, readImage: readImage
  };
})();
