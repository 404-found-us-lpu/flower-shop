/* Made by: Raghav */
/* Bloom & Petal - js/pages/orders.js - shows the customer's orders in one table, with the total spent. */

FS.ready(() => {
  // Short helper: find an element by its id.
  const byId = (id) => document.getElementById(id);

  // Turns the flowers of one order into short text, e.g. "Rose Bouquet × 2, Single Lily".
  const itemsText = (items) => items
    .map(({ name, qty }) => (qty > 1 ? `${name} × ${qty}` : name))
    .join(', ');

  // Builds the HTML for one table row.
  // A delivery today or later gets a small "Coming up" chip (checked by date only).
  const rowHTML = ({ id, createdAt, deliveryDate, slot, items, total }) => `<tr>
      <td><a class="cell-main" href="order.html?id=${FS.esc(id)}">#${FS.esc(id)}</a></td>
      <td><time datetime="${FS.esc(createdAt)}">${FS.esc(FS.fmtDate(createdAt))}</time></td>
      <td>
        <time datetime="${FS.esc(deliveryDate)}">${FS.esc(FS.fmtDate(deliveryDate))}</time>
        ${deliveryDate >= FS.today() ? '<span class="chip chip-gold">Coming&nbsp;up</span>' : ''}
        <div class="cell-sub">${FS.esc(slot)}</div>
      </td>
      <td>${FS.esc(itemsText(items))}</td>
      <td class="right num strong">${FS.money(total)}</td>
    </tr>`;

  // Draws the page: the order count, the total spent, the table rows,
  // and the empty message when there are no orders.
  const render = () => {
    const orders = FS.getOrders();
    const spent = FS.money(orders.reduce((sum, { total }) => sum + total, 0));

    // Numbers at the top of the page and under the table
    byId('count').textContent = `${orders.length} ${orders.length === 1 ? 'order' : 'orders'}`;
    byId('spent-top').textContent = spent;
    byId('spent').textContent = spent;

    // Table rows
    byId('rows').innerHTML = orders.map(rowHTML).join('');

    // Show the table if there are orders, otherwise show the empty message
    byId('table-box').hidden = !orders.length;
    byId('empty').hidden = orders.length > 0;
  };

  // Draw once now, and again whenever the saved data changes.
  render();
  window.addEventListener('fs:change', render);
});
