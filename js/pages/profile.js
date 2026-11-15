/* Made by: Yash */
/* Bloom & Petal - js/pages/profile.js - your profile: details in a <dl>, an edit form, a password form and a chart of your orders. */
FS.ready((user) => {
  const detailsForm = document.getElementById('details-form');
  const passwordForm = document.getElementById('password-form');

  // Puts the saved name, mobile number and address into the edit form.
  const fillForm = ({ name, phone, address }) => {
    const { elements } = detailsForm;
    elements.name.value = name;
    elements.phone.value = phone;
    elements.address.value = address || '';
  };

  // "Your orders": an inline SVG line chart of your last 8 order totals, oldest to newest.
  // <rect> is the background, <line> the two axes, <polyline> the line, <circle> the points and <text> the labels.
  const ordersHTML = (orders) => {
    if (!orders.length) {
      return `<div class="empty">
        <span class="empty-icon">${FS.icon('flower', 28)}</span>
        <h3>No orders yet</h3>
        <p>Your orders will show up here as a chart.</p>
        <a class="btn btn-primary" href="catalog.html">Browse flowers</a>
      </div>`;
    }
    const list = orders.slice(0, 8).reverse();                   // FS.getOrders() is newest first
    const max = Math.max(...list.map((o) => o.total));
    const spent = orders.reduce((sum, o) => sum + o.total, 0);
    const [W, H, top, base] = [480, 240, 40, 196];               // size of the drawing, highest and lowest point
    const x = (i) => list.length === 1 ? W / 2 : Math.round(72 + i * 368 / (list.length - 1));
    const y = (total) => Math.round(base - (total / max) * (base - top));
    const label = `Totals of your last ${list.length} orders, oldest to newest. Highest: ${FS.money(max)}.`;
    return `<div class="chart">
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}" font-size="12" fill="#5d6a61">
        <title>${label}</title>
        <rect width="${W}" height="${H}" rx="16" fill="#f5f1e8"/>
        <line x1="40" y1="20" x2="40" y2="${base}" stroke="#d2c4a9"/>
        <line x1="40" y1="${base}" x2="${W - 20}" y2="${base}" stroke="#d2c4a9"/>
        <polyline points="${list.map((o, i) => `${x(i)},${y(o.total)}`).join(' ')}" fill="none" stroke="#2d6a4b" stroke-width="3" stroke-linejoin="round"/>
        ${list.map(({ id, total }, i) => `<circle cx="${x(i)}" cy="${y(total)}" r="5" fill="#1b3327"/>
        <text x="${x(i)}" y="${y(total) - 12}" text-anchor="middle">${FS.money(total)}</text>
        <text x="${x(i)}" y="${base + 24}" text-anchor="middle">#${id}</text>`).join('')}
      </svg>
    </div>
    <p class="muted small mb-0">${orders.length} ${orders.length === 1 ? 'order' : 'orders'}, ${FS.money(spent)} spent in all.</p>`;
  };

  // Draws the name, the details list and the orders chart from the saved data.
  const render = () => {
    const me = FS.currentUser();
    if (!me) return;                                              // logged out (for example during a reset)
    const { name, email, phone, address, joined } = me;
    const rows = {
      Name: FS.esc(name),
      Email: FS.esc(email).replace('@', '<wbr>@'),                // a long email may break before the @
      Mobile: FS.esc(phone),
      Address: FS.esc(address) || 'Not added yet',
      'Member since': `<time datetime="${FS.esc(joined)}">${FS.fmtDate(joined)}</time>`
    };
    document.getElementById('p-avatar').textContent = FS.initials(name);
    document.getElementById('p-name').textContent = name;
    document.getElementById('p-details').innerHTML = Object.entries(rows).map(([label, value]) => `<dt>${label}</dt><dd>${value}</dd>`).join('');
    document.getElementById('p-orders').innerHTML = ordersHTML(FS.getOrders());
    // app.js draws the site header once, so keep its initials and name in step after a rename
    document.getElementById('fs-avatar').textContent = FS.initials(name);
    document.querySelector('#fs-menu strong').textContent = name;
  };

  // Saves name, mobile number and address (FS.updateProfile checks them).
  const saveDetails = (e) => {
    e.preventDefault();
    const r = FS.updateProfile(FS.formData(detailsForm));
    if (!r.ok) return FS.showErrors(detailsForm, r.errors);
    FS.clearErrors(detailsForm);
    fillForm(r.user);
    FS.toast('Your details are saved.');
  };

  // Changes the password: the present one, then the new one twice.
  const savePassword = (e) => {
    e.preventDefault();
    const { current, next, confirm } = FS.formData(passwordForm);
    const r = FS.changePassword(current, next, confirm);
    if (!r.ok) return FS.showErrors(passwordForm, r.errors);
    passwordForm.reset();
    FS.clearErrors(passwordForm);
    FS.toast('Password changed. Use the new one next time you sign in.');
  };

  detailsForm.addEventListener('submit', saveDetails);
  passwordForm.addEventListener('submit', savePassword);
  window.addEventListener('fs:change', render);                  // data changed here or in another tab
  fillForm(user);
  render();
});
