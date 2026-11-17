/* Made by: Satyam */
/* basic/js/orders.js - the "My orders" table on orders.html.
   Unit 5 topics: Web Storage (getOrders reads localStorage), higher-order functions (map, reduce),
   dates (toLocaleDateString), dynamic content (the table rows) and safe() for typed text. */

// The three time slots, as the customer saw them on the order form.
const SLOTS = { morning: 'Morning (9 am - 12 pm)', afternoon: 'Afternoon (12 pm - 4 pm)', evening: 'Evening (4 pm - 8 pm)' };

// A date as "17 Nov 2026".
function niceDate(date) {
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// One table row for one order.
function orderRow(order) {
  // "T00:00" reads the delivery day as local time, so it does not slip to the day before
  const deliveryDay = new Date(`${order.date}T00:00`);
  const items = order.items.map((item) => `${safe(item.name)} &times; ${item.qty}`).join('<br>');

  return `
    <tr>
      <th scope="row">#${order.id}</th>
      <td><time datetime="${order.placedAt}">${niceDate(new Date(order.placedAt))}</time></td>
      <td><time datetime="${order.date}">${niceDate(deliveryDay)}</time><br>${SLOTS[order.slot] || ''}</td>
      <td>${items}</td>
      <td>${rupees(order.total)}</td>
    </tr>`;
}

// Show the sign-in message, the empty message or the table.
function showOrders() {
  if (!currentUser()) {
    document.getElementById('orders-signin').hidden = false;
    return;
  }

  const orders = getOrders();
  if (orders.length === 0) {
    document.getElementById('orders-empty').hidden = false;
    return;
  }

  document.getElementById('orders-rows').innerHTML = orders.map(orderRow).join('');

  // Footer: everything spent, added up with reduce
  const spent = orders.reduce((sum, order) => sum + order.total, 0);
  document.getElementById('orders-total').innerHTML = `
    <tr><th scope="row" colspan="4">Total spent on ${orders.length} order${orders.length === 1 ? '' : 's'}</th><td>${rupees(spent)}</td></tr>`;

  document.getElementById('orders-table').hidden = false;
}

showOrders();
