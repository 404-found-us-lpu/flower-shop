/* Made by: Raghav */
/* Bloom & Petal - js/pages/orders.js - the customer's orders in one table, with the total spent. */
FS.ready(() => {
  const byId = (id) => document.getElementById(id);

  // "Rose Bouquet × 2, Single Lily": the flowers of one order as short text.
  const itemsText = (items) => items.map(({ name, qty }) => (qty > 1 ? `${name} × ${qty}` : name)).join(', ');

  // One table row. A delivery today or later gets a small "Coming up" chip (worked out from the date only).
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

  // Draws the header numbers, the table rows and the total (or the empty message when there are no orders).
  const render = () => {
    const orders = FS.getOrders();
    const spent = orders.reduce((sum, { total }) => sum + total, 0);
    byId('summary').innerHTML = `<span class="chip chip-gold">${FS.icon('receipt', 16)}${orders.length} ${orders.length === 1 ? 'order' : 'orders'}</span>
      <span class="chip">${FS.icon('bag', 16)}${FS.money(spent)} spent</span>`;
    byId('rows').innerHTML = orders.map(rowHTML).join('');
    byId('spent').textContent = FS.money(spent);
    byId('table-box').hidden = !orders.length;
    byId('empty').hidden = orders.length > 0;
  };

  render();
  window.addEventListener('fs:change', render);
});
