/* Made by: Yash, Raghav and Satyam */
/* ==========================================================================
   Bloom & Petal - online flower shop
   js/app.js - the shared code that every page uses (saved as the object FS).

   Sections in this file:
     1. Settings                 6. Orders
     2. Data store               7. Header jobs
     3. Demo data                8. Toasts and form errors
     4. Login                    9. Small helpers (money, dates, icons)
     5. Flowers and cart        10. Start-up: page guard and FS.ready

   All data is saved in this browser with localStorage. There is no server.
   ========================================================================== */

const FS = (() => {
  'use strict';

  /* ------------------------------------------------------------ 1. Settings */

  const DB_KEY = 'bloompetal.db.v5'; // all shop data (shared by every tab)
  const SESSION_KEY = 'bloompetal.session'; // who is logged in (one per tab)

  const DELIVERY_FEE = 50;
  const FREE_DELIVERY_FROM = 999;
  const LOW_STOCK = 5;

  const CATEGORIES = ['Bouquets', 'Indian favourites', 'Single stems', 'Plants', 'Gifts'];
  const SLOTS = ['Morning (9 am - 12 pm)', 'Afternoon (12 pm - 4 pm)', 'Evening (4 pm - 8 pm)'];
  const PAYMENTS = ['Cash on delivery', 'UPI', 'Card'];

  // The demo login shown on the login page.
  const DEMO = { email: 'neha@example.com', password: 'neha123' };

  /* ------------------------------------------------------------ 2. Data store */
  // (db itself is loaded in section 10, after every helper below exists.)

  // Reads the saved shop data from localStorage (null when there is none or it is broken).
  function loadDb() {
    try {
      return JSON.parse(localStorage.getItem(DB_KEY));
    } catch (err) {
      return null;
    }
  }

  // Saves all shop data (with a warning if the browser storage is full), then tells the page.
  function save() {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (err) {
      toast('Browser storage is full, so the last change was not saved.', 'error');
    }
    changed();
  }

  // Tells the page that data changed.
  // Pages listen with: window.addEventListener('fs:change', ...)
  function changed() {
    refreshHeader();
    fillStock();
    window.dispatchEvent(new CustomEvent('fs:change'));
  }

  // Another tab saved something: load it, so every open tab stays in step.
  window.addEventListener('storage', (e) => {
    if (e.key !== DB_KEY || !e.newValue) return;
    db = JSON.parse(e.newValue);
    changed();
  });

  // Puts every flower, order and account back to the demo data.
  const resetDemo = () => {
    db = seedData();
    save();
  };

  // A deep copy, so pages cannot change the saved data by mistake.
  const clone = (value) => JSON.parse(JSON.stringify(value));

  // The "failed" answer: { ok: false, errors, error } where error is the first message.
  const fail = (errors) => ({ ok: false, errors, error: Object.values(errors)[0] });

  /* ------------------------------------------------------------ 3. Demo data */

  // Builds the starting data: 3 customers, 45 flowers and 7 past orders.
  function seedData() {
    const now = Date.now();
    const hoursAgo = (h) => new Date(now - h * 3600000).toISOString();

    // [id, name, email, phone, password, address, joined days ago]
    const users = [
      [1, 'Neha Sharma', 'neha@example.com', '9876543210', 'neha123', 'House 42, Model Town, Jalandhar', 80],
      [2, 'Aman Verma', 'aman@example.com', '9876543211', 'aman123', 'B-7 Green Avenue, Ludhiana', 62],
      [3, 'Simran Kaur', 'simran@example.com', '9876543212', 'simran123', 'Flat 304, Silver Heights, Phagwara', 41],
    ].map(([id, name, email, phone, password, address, days]) => ({
      id,
      name,
      email,
      phone,
      pass: hashPassword(password),
      address,
      joined: hoursAgo(days * 24),
    }));

    // [id, name, type, price, stock, botanical name, description, photo]
    const flowers = [
      [1, 'Red Rose Bouquet', 'Bouquets', 349, 20, 'Rosa', 'Twelve fresh red roses, hand tied with eucalyptus.', 'red-rose-bouquet'],
      [2, 'White Lily Bunch', 'Bouquets', 299, 15, 'Lilium', 'Six stems of white oriental lilies, ready for a vase.', 'white-lily-bunch'],
      [3, 'Sunflower Basket', 'Bouquets', 399, 8, 'Helianthus annuus', 'Bright sunflowers arranged in a woven cane basket.', 'sunflower-basket'],
      [4, 'Pink Tulip Bunch', 'Bouquets', 349, 12, 'Tulipa', 'Ten soft pink tulips wrapped in kraft paper.', 'pink-tulips'],
      [5, 'Gerbera Mix', 'Bouquets', 249, 18, 'Gerbera jamesonii', 'A cheerful mix of gerbera daisies in five colours.', 'gerbera-mix'],
      [6, 'Lavender Bundle', 'Bouquets', 199, 4, 'Lavandula', 'A fragrant bundle of lavender tied with twine.', 'lavender-bundle'],
      [7, 'Single Red Rose', 'Single stems', 29, 50, 'Rosa', 'One long-stem red rose with a small note card.', 'single-red-rose'],
      [8, 'Single Sunflower', 'Single stems', 39, 30, 'Helianthus annuus', 'One tall sunflower stem, wrapped and ribboned.', 'single-sunflower'],
      [9, 'Money Plant Pot', 'Plants', 149, 12, 'Epipremnum aureum', 'An easy indoor money plant in a ceramic pot.', 'money-plant-pot'],
      [10, 'Purple Orchid Pot', 'Plants', 499, 6, 'Phalaenopsis', 'A flowering moth orchid that blooms for weeks.', 'orchid-pot'],
      [11, 'Succulent Pot', 'Plants', 99, 3, 'Echeveria', 'A small succulent that needs water once a week.', 'succulent-pot'],
      [12, 'Birthday Combo', 'Gifts', 599, 5, '', 'A mixed bouquet with a greeting card and candles.', 'birthday-combo'],
      [13, 'Mogra Pot', 'Indian favourites', 149, 14, 'Jasminum sambac', 'Sweet-smelling white mogra that flowers all summer.', 'mogra-pot'],
      [14, 'Marigold (Genda)', 'Indian favourites', 49, 40, 'Tagetes erecta', 'Bright orange genda flowers for pooja, weddings and festivals.', 'marigold'],
      [15, 'Aprajita Pot', 'Indian favourites', 129, 10, 'Clitoria ternatea', 'A climbing creeper with deep blue butterfly-pea flowers.', 'aprajita-pot'],
      [16, 'Bleeding Heart Vine Pot', 'Indian favourites', 199, 7, 'Clerodendrum thomsoniae', 'White flowers with bright red hearts, for a sunny balcony.', 'bleeding-heart-pot'],
      [17, 'Guldaudi (Chrysanthemum)', 'Indian favourites', 179, 9, 'Chrysanthemum', 'Big, colourful winter blooms that last for weeks.', 'guldaudi'],
      [18, 'Madhumalti Pot', 'Indian favourites', 199, 6, 'Combretum indicum', 'A creeper with clusters that turn from white to pink to red.', 'madhumalti-pot'],
      [19, 'Yellow Rose Bouquet', 'Bouquets', 329, 16, 'Rosa', 'Twelve sunny yellow roses for friendship and new starts.', 'yellow-rose-bouquet'],
      [20, 'Carnation Bunch', 'Bouquets', 199, 22, 'Dianthus caryophyllus', 'Ruffled carnations that stay fresh for up to two weeks.', 'carnation-bunch'],
      [21, 'Daisy Bunch', 'Bouquets', 149, 25, 'Leucanthemum vulgare', 'A happy bunch of white daisies with yellow centres.', 'daisy-bunch'],
      [22, 'Hydrangea Bunch', 'Bouquets', 399, 6, 'Hydrangea macrophylla', 'Big, soft balls of blue and pink hydrangea.', 'hydrangea-bunch'],
      [23, 'Peony Bouquet', 'Bouquets', 499, 4, 'Paeonia lactiflora', 'Lush pink peonies, the queen of wedding flowers.', 'peony-bouquet'],
      [24, 'Purple Iris Bunch', 'Bouquets', 249, 10, 'Iris germanica', 'Tall purple irises with a touch of yellow.', 'iris-bunch'],
      [25, 'Calla Lily Bunch', 'Bouquets', 449, 8, 'Zantedeschia aethiopica', 'Elegant white calla lilies on long stems.', 'calla-lily-bunch'],
      [26, 'Alstroemeria Bunch', 'Bouquets', 199, 20, 'Alstroemeria', 'Striped, long-lasting blooms in mixed colours.', 'alstroemeria-bunch'],
      [27, 'Rajnigandha (Tuberose)', 'Indian favourites', 99, 30, 'Polianthes tuberosa', 'Sweet-smelling white stems for weddings and pooja.', 'rajnigandha'],
      [28, 'Champa (Frangipani) Pot', 'Indian favourites', 249, 8, 'Plumeria rubra', 'A temple tree with waxy, fragrant flowers.', 'champa-pot'],
      [29, 'Gudhal (Hibiscus) Pot', 'Indian favourites', 129, 15, 'Hibiscus rosa-sinensis', 'Bright red hibiscus, a favourite flower for pooja.', 'gudhal-pot'],
      [30, 'Kamal (Lotus)', 'Indian favourites', 79, 12, 'Nelumbo nucifera', 'Pink lotus flowers, the national flower of India.', 'kamal-lotus'],
      [31, 'Raat Ki Rani Pot', 'Indian favourites', 149, 9, 'Cestrum nocturnum', 'Tiny flowers that fill the night air with scent.', 'raat-ki-rani-pot'],
      [32, 'Parijat Pot', 'Indian favourites', 169, 7, 'Nyctanthes arbor-tristis', 'Night jasmine with white petals and orange stems.', 'parijat-pot'],
      [33, 'Sadabahar Pot', 'Indian favourites', 79, 20, 'Catharanthus roseus', 'The always-in-bloom periwinkle, easy for beginners.', 'sadabahar-pot'],
      [34, 'Bougainvillea Pot', 'Indian favourites', 199, 10, 'Bougainvillea glabra', 'Paper-thin magenta flowers for a sunny wall or gate.', 'bougainvillea-pot'],
      [35, 'Rangan (Ixora) Pot', 'Indian favourites', 149, 11, 'Ixora coccinea', 'Round red flower clusters that butterflies love.', 'rangan-pot'],
      [36, 'Single Gerbera', 'Single stems', 25, 40, 'Gerbera jamesonii', 'One bright gerbera daisy, wrapped with a ribbon.', 'single-gerbera'],
      [37, 'Single White Lily', 'Single stems', 49, 25, 'Lilium longiflorum', 'One tall white lily stem with buds still to open.', 'single-white-lily'],
      [38, 'Single Orchid Stem', 'Single stems', 129, 12, 'Cymbidium', 'A long orchid spray that lasts up to a month in a vase.', 'single-orchid-stem'],
      [39, 'Peace Lily Pot', 'Plants', 249, 10, 'Spathiphyllum wallisii', 'White flowers and glossy leaves, happy in shade.', 'peace-lily-pot'],
      [40, 'Anthurium Pot', 'Plants', 349, 8, 'Anthurium andraeanum', 'Shiny red heart-shaped flowers that last for months.', 'anthurium-pot'],
      [41, 'Rose Plant Pot', 'Plants', 199, 14, 'Rosa', 'A rose bush in a pot for your balcony.', 'rose-plant-pot'],
      [42, 'Snake Plant Pot', 'Plants', 229, 12, 'Dracaena trifasciata', 'A tough indoor plant that needs very little water.', 'snake-plant-pot'],
      [43, 'Mixed Flower Basket', 'Gifts', 699, 5, '', 'A cane basket of seasonal flowers, ready to gift.', 'flower-basket'],
      [44, 'Rose Varmala', 'Gifts', 549, 4, 'Rosa', 'A rose garland for weddings and welcomes.', 'rose-varmala'],
      [45, 'Flower Gift Box', 'Gifts', 649, 6, '', 'Roses and fillers arranged in a keepsake box.', 'flower-gift-box'],
    ].map(([id, name, category, price, stock, botanical, description, photo]) => ({
      id,
      name,
      category,
      price,
      stock,
      botanical,
      description,
      image: `images/${photo}.jpg`,
    }));

    // [id, customer id, placed hours ago, [[flower id, qty]...], delivery day offset, slot, payment, card note, receiver]
    // slot and payment are positions in the SLOTS and PAYMENTS lists above.
    const orders = [
      [1001, 1, 290, [[1, 1], [7, 2]], -11, 0, 1, 'Happy birthday, Maa!', 'Sunita Sharma'],
      [1002, 2, 240, [[12, 1]], -9, 2, 2, 'Many happy returns.', 'Ritu Verma'],
      [1003, 3, 200, [[3, 1], [9, 1]], -7, 1, 1, '', ''],
      [1004, 1, 150, [[2, 2]], -5, 0, 0, 'Get well soon.', 'Anita Sharma'],
      [1005, 1, 26, [[14, 3], [13, 1]], 1, 0, 1, 'For the Diwali pooja.', ''],
      [1006, 2, 5, [[15, 1]], 2, 1, 0, '', ''],
      [1007, 1, 2, [[11, 2], [7, 1]], 2, 0, 0, '', ''],
    ].map(([id, userId, placed, lines, day, slot, pay, note, receiver]) => {
      const user = users.find((u) => u.id === userId);

      const items = lines.map(([flowerId, qty]) => {
        const { name, price } = flowers.find((f) => f.id === flowerId);
        return { flowerId, name, price, qty };
      });

      const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
      const delivery = subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;

      return {
        id,
        userId,
        customer: user.name,
        items,
        subtotal,
        delivery,
        total: subtotal + delivery,
        recipient: { name: receiver || user.name, phone: user.phone, address: user.address },
        deliveryDate: dayFromNow(day),
        slot: SLOTS[slot],
        payment: PAYMENTS[pay],
        note,
        createdAt: hoursAgo(placed),
      };
    });

    return { users, flowers, orders, carts: {}, seq: { user: 4, order: 1008 } };
  }

  /* ------------------------------------------------------------ 4. Login */

  // A small one-way scramble so passwords are not stored as plain text.
  // It is NOT real security: a real shop checks passwords on a server.
  function hashPassword(text) {
    let h = 0x811c9dc5;
    const s = 'bloom&petal:' + text;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16).padStart(8, '0');
  }

  // A copy of the user without the password.
  const publicUser = (u) => {
    if (!u) return null;
    const { pass, ...rest } = u;
    return rest;
  };

  // The real saved user who is logged in in this tab (or null).
  function rawUser() {
    const id = Number(sessionStorage.getItem(SESSION_KEY));
    return db.users.find((u) => u.id === id) || null;
  }

  // The logged-in user for pages to use (a copy, without the password).
  const currentUser = () => publicUser(rawUser());

  // Simple checks for an email address and a 10 digit Indian mobile number.
  // (FS.formData has already trimmed the values.)
  const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
  const isPhone = (s) => /^[6-9][0-9]{9}$/.test(s);

  // Logs in with email and password. Returns { ok, user } or { ok:false, errors, error }.
  function login(email, password) {
    const u = db.users.find((x) => x.email === email.trim().toLowerCase());

    if (!u || u.pass !== hashPassword(password)) {
      return fail({ password: 'Wrong email or password.' });
    }

    sessionStorage.setItem(SESSION_KEY, String(u.id));
    return { ok: true, user: publicUser(u) };
  }

  // Logs out and goes back to the welcome page.
  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    location.href = 'index.html';
  }

  // Makes a new account and logs it in. Returns { ok, user } or { ok:false, errors, error }.
  function register(data) {
    const errors = {};
    const mail = data.email.toLowerCase();

    if (data.name.length < 2) errors.name = 'Please enter the full name.';

    if (!isEmail(mail)) errors.email = 'Please enter a correct email address.';
    else if (db.users.some((u) => u.email === mail)) errors.email = 'This email is already registered.';

    if (!isPhone(data.phone)) errors.phone = 'Enter a 10 digit mobile number starting with 6, 7, 8 or 9.';

    if (data.password.length < 6) errors.password = 'Use at least 6 characters.';
    else if (data.confirm !== data.password) errors.confirm = 'The two passwords are not the same.';

    if (Object.keys(errors).length) return fail(errors);

    const u = {
      id: db.seq.user++,
      name: data.name,
      email: mail,
      phone: data.phone,
      pass: hashPassword(data.password),
      address: data.address,
      joined: new Date().toISOString(),
    };
    db.users.push(u);
    sessionStorage.setItem(SESSION_KEY, String(u.id));
    save();
    return { ok: true, user: publicUser(u) };
  }

  // The logged-in customer changes their own name, phone and address.
  function updateProfile(data) {
    const me = rawUser();
    if (!me) return fail({ name: 'Please log in again.' });

    const errors = {};
    if (data.name.length < 2) errors.name = 'Please enter your full name.';
    if (!isPhone(data.phone)) errors.phone = 'Enter a 10 digit mobile number starting with 6, 7, 8 or 9.';
    if (Object.keys(errors).length) return fail(errors);

    me.name = data.name;
    me.phone = data.phone;
    me.address = data.address;
    save();
    return { ok: true, user: publicUser(me) };
  }

  // Changes the password after checking the present one.
  function changePassword(current, next, confirm) {
    const me = rawUser();
    if (!me) return fail({ current: 'Please log in again.' });

    if (me.pass !== hashPassword(current)) return fail({ current: 'Your present password is wrong.' });
    if (next.length < 6) return fail({ next: 'Use at least 6 characters.' });
    if (confirm !== next) return fail({ confirm: 'The two passwords are not the same.' });

    me.pass = hashPassword(next);
    save();
    return { ok: true };
  }

  /* ------------------------------------------------------------ 5. Flowers and cart */

  // The saved flower with this id (or null).
  const findFlower = (id) => db.flowers.find((f) => f.id === Number(id)) || null;

  // All flowers, A-Z (copies).
  const getFlowers = () => clone(db.flowers).sort((a, b) => a.name.localeCompare(b.name));

  // One flower (a copy), or null.
  const getFlower = (id) => clone(findFlower(id));

  // The logged-in customer's saved cart rows: [{ flowerId, qty }]
  function cartRows() {
    const me = rawUser();
    if (!me) return [];
    db.carts[me.id] = db.carts[me.id] || [];
    return db.carts[me.id];
  }

  // The cart for pages: [{ flower, qty, lineTotal }]
  function getCart() {
    return cartRows().map(({ flowerId, qty }) => {
      const f = findFlower(flowerId);
      return { flower: clone(f), qty, lineTotal: f.price * qty };
    });
  }

  // How many flowers are in the cart in total.
  const cartCount = () => getCart().reduce((sum, line) => sum + line.qty, 0);

  // Money for the cart: subtotal, delivery fee, total, and how much more is needed for free delivery.
  function cartTotals() {
    const subtotal = getCart().reduce((sum, line) => sum + line.lineTotal, 0);
    const delivery = subtotal === 0 || subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
    return {
      subtotal,
      delivery,
      total: subtotal + delivery,
      freeFrom: FREE_DELIVERY_FROM,
      toFree: Math.max(FREE_DELIVERY_FROM - subtotal, 0),
    };
  }

  // Adds one of a flower to the cart (never more than the stock).
  function addToCart(flowerId) {
    const f = findFlower(flowerId);
    if (!rawUser()) return fail({ cart: 'Please log in to order flowers.' });
    if (f.stock < 1) return fail({ cart: `${f.name} is out of stock.` });

    const rows = cartRows();
    const row = rows.find((r) => r.flowerId === f.id);
    const want = (row ? row.qty : 0) + 1;
    if (want > f.stock) return fail({ cart: `Only ${f.stock} of ${f.name} in stock.` });

    if (row) row.qty = want;
    else rows.push({ flowerId: f.id, qty: want });
    save();
    return { ok: true };
  }

  // Sets the quantity of a cart row. 0 or less (or not a number) removes the row.
  function setCartQty(flowerId, qty) {
    const f = findFlower(flowerId);
    const rows = cartRows();
    const row = rows.find((r) => r.flowerId === Number(flowerId));
    const want = Math.floor(qty);

    if (!row) return fail({ cart: 'This flower is not in your cart.' });
    if (want > f.stock) return fail({ cart: `Only ${f.stock} of ${f.name} in stock.` });

    if (want >= 1) row.qty = want;
    else rows.splice(rows.indexOf(row), 1);
    save();
    return { ok: true };
  }

  /* ------------------------------------------------------------ 6. Orders */

  // The logged-in customer's orders, newest first.
  function getOrders() {
    const me = rawUser();
    if (!me) return [];
    return clone(db.orders.filter((o) => o.userId === me.id)).sort((a, b) => b.id - a.id);
  }

  // One of the logged-in customer's orders (or null).
  const getOrder = (id) => getOrders().find((o) => o.id === Number(id)) || null;

  // Turns the cart into an order.
  // details = { name, phone, address, deliveryDate, slot, payment, note }
  function placeOrder(details) {
    const me = rawUser();
    const lines = getCart();
    const errors = {};

    if (!me) return fail({ cart: 'Please log in to place an order.' });
    if (!lines.length) return fail({ cart: 'Your cart is empty.' });

    // Check every field first, then show all the problems together.
    lines.forEach(({ qty, flower }) => {
      if (qty > flower.stock) errors.cart = `Only ${flower.stock} of ${flower.name} left. Please change the quantity.`;
    });

    if (details.name.length < 2) errors.name = "Please enter the receiver's name.";
    if (!isPhone(details.phone)) errors.phone = 'Enter a 10 digit mobile number starting with 6, 7, 8 or 9.';
    if (details.address.length < 10) errors.address = 'Please write the full delivery address.';

    // A date box gives "" or "YYYY-MM-DD", so plain text comparison works.
    if (!details.deliveryDate) {
      errors.deliveryDate = 'Please choose a delivery date.';
    } else if (details.deliveryDate < dayFromNow(0)) {
      errors.deliveryDate = 'The delivery date cannot be in the past.';
    } else if (details.deliveryDate > dayFromNow(60)) {
      errors.deliveryDate = 'Please choose a date within the next 60 days.';
    }

    if (!SLOTS.includes(details.slot)) errors.slot = 'Please choose a delivery time.';
    if (!PAYMENTS.includes(details.payment)) errors.payment = 'Please choose how you will pay.';

    if (Object.keys(errors).length) return fail(errors);

    // Everything is fine: build the order.
    const { subtotal, delivery, total } = cartTotals();
    const order = {
      id: db.seq.order++,
      userId: me.id,
      customer: me.name,
      items: lines.map(({ flower, qty }) => ({ flowerId: flower.id, name: flower.name, price: flower.price, qty })),
      subtotal,
      delivery,
      total,
      recipient: { name: details.name, phone: details.phone, address: details.address },
      deliveryDate: details.deliveryDate,
      slot: details.slot,
      payment: details.payment,
      note: details.note,
      createdAt: new Date().toISOString(),
    };

    // Take the flowers out of stock, save the order and empty the cart.
    lines.forEach(({ flower, qty }) => {
      findFlower(flower.id).stock -= qty;
    });
    db.orders.push(order);
    db.carts[me.id] = [];
    save();
    return { ok: true, order: clone(order) };
  }

  /* ------------------------------------------------------------ 7. Header jobs */
  // (The header itself is plain HTML in each page.)

  // Shows how many flowers are in the cart on the bag icon.
  function refreshHeader() {
    const badge = document.getElementById('cart-count');
    if (badge) {
      const n = cartCount();
      badge.textContent = n;
      badge.hidden = n === 0;
    }
  }

  // Plain-HTML flower tiles carry <span data-stock="13"></span>.
  // This writes the stock badge (like "14 in stock") into each one.
  function fillStock() {
    document.querySelectorAll('[data-stock]').forEach((el) => {
      const f = findFlower(el.dataset.stock);
      if (f) el.innerHTML = stockBadge(f);
    });
  }

  // The account menu buttons: Log out, and Reset demo data.
  // Reset asks first with the browser's own confirm box.
  document.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;

    if (act === 'logout') logout();

    if (act === 'reset' && confirm('Put every flower, order and account back to the demo data? You will be logged out.')) {
      resetDemo();
      logout();
    }
  });

  /* ------------------------------------------------------------ 8. Toasts and form errors */

  // Shows a small message in the corner. type: 'success' (default) or 'error'
  function toast(message, type = 'success') {
    if (!document.body) return; // a failed save during start-up, before the page exists

    // Make the toast box the first time it is needed.
    let box = document.querySelector('.toasts');
    if (!box) {
      box = document.createElement('div');
      box.className = 'toasts';
      box.setAttribute('aria-live', 'polite');
      document.body.append(box);
    }

    const item = document.createElement('div');
    item.className = `toast toast-${type}`;
    item.innerHTML = `${icon(type === 'error' ? 'alert' : 'check', 18)}<span>${esc(message)}</span>`;
    box.append(item);

    // Fade out after 3.4 seconds, then remove it.
    setTimeout(() => {
      item.classList.add('toast-out');
      setTimeout(() => item.remove(), 300);
    }, 3400);
  }

  // Reads a form into { fieldName: 'trimmed value' } with the browser's FormData
  // (only the ticked radio button of a group is in it). Passwords are not trimmed.
  function formData(form) {
    const out = {};
    for (const [name, value] of new FormData(form)) {
      out[name] = form.elements[name].type === 'password' ? value : value.trim();
    }
    return out;
  }

  // Shows each message under its field (the field needs a wrapper with class "field").
  // A message with no matching field is shown as a toast. Returns true when there were errors.
  function showErrors(form, errors = {}) {
    clearErrors(form);
    let first = null;
    const loose = [];

    Object.entries(errors).forEach(([name, message]) => {
      const input = form.querySelector(`[name="${name}"]`);
      const field = input?.closest('.field');
      if (!field) {
        loose.push(message);
        return;
      }

      field.classList.add('invalid');
      let msg = field.querySelector('.error');
      if (!msg) {
        msg = document.createElement('p');
        msg.className = 'error';
        field.append(msg);
      }
      msg.textContent = message;
      input.setAttribute('aria-invalid', 'true');
      first = first || input;
    });

    if (first) first.focus();
    if (loose.length) toast(loose[0], 'error');
    return !!(first || loose.length);
  }

  // Removes all error messages and red borders from a form.
  function clearErrors(form) {
    form.querySelectorAll('.field.invalid').forEach((f) => f.classList.remove('invalid'));
    form.querySelectorAll('.error').forEach((m) => {
      m.textContent = '';
    });
    form.querySelectorAll('[aria-invalid]').forEach((i) => i.removeAttribute('aria-invalid'));
  }

  /* ------------------------------------------------------------ 9. Small helpers */

  // Makes text safe to put inside innerHTML (so typed text cannot become HTML).
  const SAFE_CHARS = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => SAFE_CHARS[ch]);

  // 1250 -> "₹1,250"
  const money = (n) => '₹' + n.toLocaleString('en-IN');

  // "Neha Sharma" -> "NS"
  const initials = (name) => name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

  // The ?key=value part of the page address.
  const params = () => new URLSearchParams(location.search);

  // Turns "2026-11-17" (or any date text) into a Date. "YYYY-MM-DD" is read as a local day.
  function toDate(value) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    return m ? new Date(m[1], m[2] - 1, m[3]) : new Date(value);
  }

  // 7 -> "07"
  const pad = (n) => String(n).padStart(2, '0');

  // The day that is `days` days from today, as "YYYY-MM-DD" in local time (0 = today).
  function dayFromNow(days = 0) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // "17 Nov 2026"
  const fmtDate = (value) => {
    const d = toDate(value);
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  };

  // "4:05 pm"
  const fmtTime = (value) => {
    const d = toDate(value);
    const h = d.getHours();
    return `${h % 12 || 12}:${pad(d.getMinutes())} ${h < 12 ? 'am' : 'pm'}`;
  };

  // "Good morning" before 12, "Good afternoon" before 5 pm, then "Good evening".
  function greeting(hour = new Date().getHours()) {
    if (hour < 12) return 'Good morning';
    else if (hour < 17) return 'Good afternoon';
    else return 'Good evening';
  }

  // The drawing (SVG path) for each icon.
  const ICONS = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    check: '<path d="m20 6-11 11-5-5"/>',
    trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/>',
    flower:
      '<circle cx="12" cy="12" r="2.5"/><path d="M12 9.5a3.5 3.5 0 1 0-3-5.3M14.5 12a3.5 3.5 0 1 0 5.3-3M12 14.5a3.5 3.5 0 1 0 3 5.3M9.5 12a3.5 3.5 0 1 0-5.3 3M9 4.2a3.5 3.5 0 0 0-4.8 4.8M19.8 9a3.5 3.5 0 0 0-4.8-4.8M15 19.8a3.5 3.5 0 0 0 4.8-4.8M4.2 15A3.5 3.5 0 0 0 9 19.8"/>',
  };

  // The <svg> HTML for an icon: icon('plus') or icon('plus', 16). Names: see ICONS above.
  const icon = (name, size = 20) =>
    `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

  // How many are left: "23 in stock", "Only 3 left" or "Out of stock".
  function stockBadge({ stock }) {
    if (stock <= 0) return '<span class="badge badge-out">Out of stock</span>';
    if (stock <= LOW_STOCK) return `<span class="badge badge-low">Only ${stock} left</span>`;
    return `<span class="badge badge-ok">${stock} in stock</span>`;
  }

  // <img> for a flower. If the photo fails to load, imgError below swaps in a placeholder.
  const flowerImg = (f) => `<img src="${esc(f.image)}" alt="${esc(f.name)}" loading="lazy" onerror="FS.imgError(this)">`;

  // A photo failed to load: swap it for the placeholder.
  function imgError(img) {
    const span = document.createElement('span');
    span.className = 'ph ' + img.className;
    span.innerHTML = icon('flower', 30);
    img.replaceWith(span);
  }

  /* ------------------------------------------------------------ 10. Start-up: page guard and FS.ready */

  let db = loadDb(); // all shop data: users, flowers, orders, carts
  if (!db) resetDemo(); // first visit (or broken data): start with the demo data
  let blocked = false; // true when the page guard is sending the visitor away

  // Hides the page and goes to another one.
  function leave(url) {
    blocked = true;
    document.documentElement.style.visibility = 'hidden';
    location.replace(url);
  }

  // Runs fn once the page's HTML has loaded.
  function whenDom(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  // Page scripts put their code inside FS.ready(function (user) { ... }).
  // It runs after the page guard passed and the header exists.
  function ready(fn) {
    if (!blocked) whenDom(() => fn(currentUser()));
  }

  // The page guard. <html data-roles="..."> says who may open the page:
  //   public = anyone, guest = only logged-out visitors, customer = only logged-in customers
  const need = document.documentElement.dataset.roles;
  const user = rawUser();
  if (need === 'guest' && user) leave('home.html');
  if (need === 'customer' && !user) leave('login.html?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search));

  // Once the HTML has loaded, fill in the cart count and the stock badges.
  whenDom(changed);

  // Everything the pages can use as FS.something
  return {
    // settings and shop details
    CATEGORIES,
    DEMO,
    DELIVERY_FEE,

    // start-up and data
    ready,

    // login
    currentUser,
    login,
    register,
    updateProfile,
    changePassword,
    isEmail,
    isPhone,

    // flowers and cart
    getFlowers,
    getFlower,
    getCart,
    cartCount,
    cartTotals,
    addToCart,
    setCartQty,

    // orders
    getOrders,
    getOrder,
    placeOrder,

    // page pieces
    toast,
    formData,
    showErrors,
    clearErrors,
    esc,
    money,
    initials,
    params,
    today: dayFromNow,
    fmtDate,
    fmtTime,
    greeting,
    icon,
    stockBadge,
    flowerImg,
    imgError,
  };
})();
