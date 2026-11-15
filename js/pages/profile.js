/* Made by: Yash */
/* Bloom & Petal - js/pages/profile.js - your own profile: details, password, activity and the demo data reset. */
FS.ready(function (user) {
  const detailsForm = document.getElementById('details-form');
  const passwordForm = document.getElementById('password-form');
  const activity = document.getElementById('activity');
  const activityLink = document.getElementById('activity-link');

  // Put the saved details into the form
  function fillDetails(u) {
    document.getElementById('d-name').value = u.name;
    document.getElementById('d-email').value = u.email;
    document.getElementById('d-phone').value = u.phone;
    document.getElementById('d-address').value = u.address || '';
  }

  // The green band: initials, name, email, role and the day they joined
  function renderHero(u) {
    document.getElementById('p-avatar').textContent = FS.initials(u.name);
    document.getElementById('p-name').textContent = u.name;
    document.getElementById('p-email').textContent = u.email;
    document.getElementById('p-chips').innerHTML =
      `<span class="chip chip-gold">${FS.icon('shield', 16)}${FS.esc(FS.ROLE_LABEL[u.role])}</span>` +
      `<span class="chip">${FS.icon('calendar', 16)}Member since ${FS.esc(FS.fmtDate(u.joined))}</span>`;
    // app.js draws the header once, so keep its initials and name in step after a rename
    const headerAvatar = document.getElementById('fs-avatar');
    const menuName = document.querySelector('#fs-menu .nav-menu-head strong');
    if (headerAvatar) headerAvatar.textContent = FS.initials(u.name);
    if (menuName) menuName.textContent = u.name;
  }

  // One number tile
  function statHTML(icon, label, value, note) {
    return `<div class="stat">
      <span class="stat-label">${FS.icon(icon, 16)}${label}</span>
      <span class="stat-value">${FS.esc(value)}</span>
      <span class="stat-note">${FS.esc(note)}</span>
    </div>`;
  }

  // A link row to one order: title, small text, then badge (and total) on the right
  function orderLinkHTML(order, title, sub, total) {
    return `<a class="mini-order row between" href="order.html?id=${order.id}">
      <div>
        <div class="cell-main">${FS.esc(title)}</div>
        <div class="cell-sub">${FS.esc(sub)}</div>
      </div>
      <div class="row">${FS.badge(order.status)}${total ? '<strong class="num">' + FS.esc(FS.money(order.total)) + '</strong>' : ''}${FS.icon('arrow', 18)}</div>
    </a>`;
  }

  // Customer: how many orders, how much was spent (cancelled orders not counted) and the last order
  function customerHTML(orders) {
    if (!orders.length) {
      return `<div class="empty">
        <span class="empty-icon">${FS.icon('flower', 28)}</span>
        <h3>No orders yet</h3>
        <p>Your orders and what you have spent will show up here.</p>
        <a class="btn btn-primary" href="catalog.html">Browse flowers</a>
      </div>`;
    }
    const kept = orders.filter(function (o) { return o.status !== 'Cancelled'; });
    const spent = kept.reduce(function (sum, o) { return sum + o.total; }, 0);
    const open = kept.filter(function (o) { return o.status !== 'Delivered'; }).length;
    const last = orders[0];                               // FS.getOrders() is newest first
    const items = last.items.reduce(function (n, i) { return n + i.qty; }, 0);
    return `<div class="stack">
      <div class="grid-2">
        ${statHTML('receipt', 'Orders placed', orders.length, open ? open + ' in progress' : 'None in progress')}
        ${statHTML('bag', 'Total spent', FS.money(spent), 'Cancelled orders not counted')}
      </div>
      ${orderLinkHTML(last, 'Last order #' + last.id, items + (items === 1 ? ' item' : ' items') + ' · placed ' + FS.fmtDate(last.createdAt), true)}
    </div>`;
  }

  // Shop team: orders this person moved along (history entries saved with their name)
  // ponytail: history keeps the name, not the id, so after a rename the count starts again from 0
  function staffHTML(orders, name) {
    let handled = 0, updates = 0, latest = null;
    orders.forEach(function (o) {
      const mine = o.history.filter(function (h) { return h.by === name; });
      if (mine.length) handled += 1;
      updates += mine.length;
      mine.forEach(function (h) { if (!latest || h.at > latest.at) latest = { at: h.at, status: h.status, order: o }; });
    });
    const last = latest
      ? orderLinkHTML(latest.order, 'Last update #' + latest.order.id, 'Moved to ' + latest.status + ' · ' + FS.timeAgo(latest.at), false)
      : '<p class="muted mb-0">When you confirm, prepare or deliver an order, it is counted here.</p>';
    return `<div class="stack">
      <div class="grid-2">
        ${statHTML('box', 'Orders handled', handled, 'Orders you moved to a new step')}
        ${statHTML('check', 'Status updates', updates, latest ? 'Last one ' + FS.timeAgo(latest.at) : 'None yet')}
      </div>
      ${last}
    </div>`;
  }

  // Draw everything that comes from the saved data
  function render() {
    const me = FS.currentUser();
    if (!me) return;                                      // logged out (for example during a reset)
    renderHero(me);
    const staff = me.role !== 'customer';
    activityLink.href = staff ? FS.ROLE_HOME[me.role] : 'orders.html';
    activityLink.querySelector('span').textContent = staff ? 'Go to dashboard' : 'All orders';
    activity.innerHTML = staff ? staffHTML(FS.getOrders(), me.name) : customerHTML(FS.getOrders());
  }

  // Save name, mobile number and address
  detailsForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const r = FS.updateProfile(FS.formData(detailsForm));
    if (!r.ok) { FS.showErrors(detailsForm, r.errors); return; }
    FS.clearErrors(detailsForm);
    fillDetails(r.user);
    FS.toast('Your details are saved.');
  });

  // Change the password: the present one, then the new one twice
  passwordForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const data = FS.formData(passwordForm);
    const r = FS.changePassword(data.current, data.next, data.confirm);
    if (!r.ok) { FS.showErrors(passwordForm, r.errors); return; }
    passwordForm.reset();
    FS.clearErrors(passwordForm);
    FS.toast('Password changed. Use the new one next time you log in.');
  });

  // Put the demo data back, then log out (that also clears this tab's login)
  document.getElementById('reset-demo').addEventListener('click', function () {
    FS.confirm('All orders, flowers and users go back to the demo data. You will be logged out.',
      { title: 'Reset demo data?', okText: 'Reset', danger: true })
      .then(function (yes) { if (yes && FS.resetDemo()) FS.logout(); });
  });

  window.addEventListener('fs:change', render);
  fillDetails(user);
  render();
});
