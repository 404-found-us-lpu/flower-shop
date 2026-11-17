/* Made by: Satyam */
/* Bloom & Petal - js/pages/order.js - one of your orders: flowers, delivery details and a Print button. */
FS.ready(() => {
  // Short name for document.getElementById.
  const byId = (id) => document.getElementById(id);

  // Short forms shown with <abbr>; the title gives the full name.
  const PAY = {
    'Cash on delivery': '<abbr title="Cash on delivery">COD</abbr>',
    UPI: '<abbr title="Unified Payments Interface">UPI</abbr>',
  };

  // One table row: photo and name, quantity, price each and the amount.
  const itemRow = ({ flowerId, name, price, qty }) => `
    <tr>
      <td><div class="cell-flower">${FS.flowerImg(FS.getFlower(flowerId) || { name })}<span class="cell-main">${FS.esc(name)}</span></div></td>
      <td class="right num">${FS.esc(qty)}</td>
      <td class="right num">${FS.money(price)}</td>
      <td class="right num strong">${FS.money(price * qty)}</td>
    </tr>`;

  // The <tfoot>: subtotal, delivery (crossed out when it was free) and total.
  const totalsHTML = ({ subtotal, delivery, total }) => `
    <tr><th scope="row" colspan="3">Subtotal</th><td class="right num">${FS.money(subtotal)}</td></tr>
    <tr><th scope="row" colspan="3">Delivery</th>
      <td class="right num">${delivery ? FS.money(delivery) : `<del>${FS.money(FS.DELIVERY_FEE)}</del> <ins>Free</ins>`}</td></tr>
    <tr><th scope="row" colspan="3">Total</th><td class="right num strong">${FS.money(total)}</td></tr>`;

  // When and where it goes: delivery day and slot, the receiver in an <address>, payment and the card note.
  const deliveryHTML = ({ deliveryDate, slot, recipient: { name, phone, address }, payment, note }) => `
    <dl>
      <dt>Delivery day</dt>
      <dd><time datetime="${FS.esc(deliveryDate)}">${FS.fmtDate(deliveryDate)}</time>, ${FS.esc(slot)}</dd>
      <dt>Receiver</dt>
      <dd><address>${FS.esc(name)}<br><a href="tel:+91${FS.esc(phone)}">${FS.esc(phone)}</a><br>${FS.esc(address)}</address></dd>
      <dt>Payment</dt>
      <dd>${PAY[payment] || FS.esc(payment)}</dd>
      <dt>Card note</dt>
      <dd>${note ? `<blockquote>${FS.esc(note)}</blockquote>` : 'No card note'}</dd>
    </dl>`;

  // Fills the page from the order in ?id=, or shows "not found". Runs at the start and on every fs:change.
  const render = () => {
    const order = FS.getOrder(FS.params().get('id'));
    byId('order-found').hidden = !order;
    byId('order-missing').hidden = !!order;
    if (!order) {
      byId('order-title').textContent = 'Order not found';
      byId('order-sub').textContent = '';
      return;
    }
    const { id, createdAt, items } = order;
    document.title = `Order #${id} · Bloom & Petal`;
    byId('order-title').textContent = `Order #${id}`;
    byId('order-sub').innerHTML =
      `Placed <time datetime="${FS.esc(createdAt)}">${FS.fmtDate(createdAt)} at ${FS.fmtTime(createdAt)}</time>`;
    byId('order-items').innerHTML = items.map(itemRow).join('');
    byId('order-totals').innerHTML = totalsHTML(order);
    byId('order-delivery').innerHTML = deliveryHTML(order);
  };

  // Print: the browser prints this page (style.css hides the menu, footer and buttons).
  byId('print').addEventListener('click', () => window.print());
  render();
  window.addEventListener('fs:change', render);
});
