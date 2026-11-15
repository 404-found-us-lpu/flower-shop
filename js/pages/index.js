/* Made by: Yash */
/* Bloom & Petal - js/pages/index.js - the public front page: flowers today, Indian favourites, flowers in season and star ratings. */
FS.ready((user) => {
  const HINDI = { 13: 'मोगरा', 14: 'गेंदा', 15: 'अपराजिता', 17: 'गुलदाउदी', 18: 'मधुमालती' };   // by flower id
  const STAR = '10,0 12.4,6.8 19.5,6.9 13.8,11.2 15.9,18.1 10,14 4.1,18.1 6.2,11.2 0.5,6.9 7.6,6.8';   // corners of one star

  // A rating as an inline SVG: five <polygon> stars side by side, the ones above the rating faded.
  const starsSVG = (rating) => `<svg class="stars" width="116" height="20" viewBox="0 0 116 20" fill="#a8843d" role="img" aria-label="${rating} out of 5 stars">` +
    [0, 1, 2, 3, 4].map((i) => `<polygon points="${STAR}" transform="translate(${i * 24})"${i < rating ? '' : ' opacity=".25"'}/>`).join('') + '</svg>';

  // One number box in the "Flowers today" card.
  const statHTML = (iconName, label, value, note) => `<div class="stat stat-dark">
    <span class="stat-label">${FS.icon(iconName, 16)}${label}</span>
    <span class="stat-value">${FS.esc(value)}</span>
    <span class="stat-note">${FS.esc(note)}</span>
  </div>`;

  // "Flowers today": how many flowers, the cheapest one, free delivery and the total in stock.
  const todayHTML = (flowers) => {
    const lowest = Math.min(...flowers.map((f) => f.price));
    const cheapest = flowers.find((f) => f.price === lowest);
    const units = flowers.reduce((sum, f) => sum + f.stock, 0);
    return `<div>
        <p class="hero-eyebrow">Flowers today</p>
        <div class="big-number">${flowers.length}<small>on sale</small></div>
      </div>
      ${statHTML('receipt', 'Cheapest', FS.money(lowest), cheapest.name)}
      ${statHTML('truck', 'Free delivery from', FS.money(FS.FREE_DELIVERY_FROM), `${FS.money(FS.DELIVERY_FEE)} delivery below that`)}
      ${statHTML('box', 'Total in stock', units.toLocaleString('en-IN'), 'ready to send today')}`;
  };

  // The two pills on a photo: how many are left (top right) and the price (bottom left).
  const pillsHTML = (f) => `<span class="stock-pill">${FS.stockBadge(f)}</span>
    <span class="price-pill">${f.price.toLocaleString('en-IN')} <small>INR</small></span>`;

  // One Indian favourite: photo with pills, name, Hindi name, botanical name and description.
  const indianHTML = (f) => `<article class="product">
    <a class="product-media" href="catalog.html?q=${encodeURIComponent(f.name)}">${FS.flowerImg(f)}${pillsHTML(f)}</a>
    <div class="product-body">
      <h3 class="product-name">${FS.esc(f.name)}${HINDI[f.id] ? ` <span class="hindi" lang="hi">${HINDI[f.id]}</span>` : ''}</h3>
      <p class="muted small mb-0"><i lang="la">${FS.esc(f.botanical)}</i></p>
      <p class="product-desc">${FS.esc(f.description)}</p>
    </div>
  </article>`;

  // One "In season" photo tile: picture, name and the two pills.
  const tileHTML = (f) => `<a class="tile" href="catalog.html?q=${encodeURIComponent(f.name)}">
    ${FS.flowerImg(f)}<span class="tile-name">${FS.esc(f.name)}</span>${pillsHTML(f)}
  </a>`;

  // Signed-in customers get one "Shop now" button, and the last card speaks about their orders.
  const showCustomerButtons = () => {
    const placed = FS.getOrders().length;
    document.querySelectorAll('[data-actions]').forEach((box) => {
      box.innerHTML = `<a class="btn btn-gold btn-lg" href="catalog.html">Shop now${FS.icon('arrow', 18)}</a>`;
    });
    document.getElementById('cta-title').textContent = placed ? 'Plan your next order' : 'Start your first order';
    document.getElementById('cta-text').textContent = placed
      ? `You have placed ${placed} ${placed === 1 ? 'order' : 'orders'} with us. Thank you!`
      : 'Pick your flowers, choose a delivery day and time, and leave the rest to us.';
  };

  // Draws every part that depends on the flowers: the numbers, the Indian favourites and the 8 flowers we have most of.
  const render = () => {
    const flowers = FS.getFlowers();
    const isIndian = (f) => f.category === 'Indian favourites';
    const season = flowers.filter((f) => !isIndian(f) && f.stock > 0).sort((a, b) => b.stock - a.stock).slice(0, 8);
    document.getElementById('today').innerHTML = todayHTML(flowers);
    document.getElementById('indian').innerHTML = flowers.filter(isIndian).map(indianHTML).join('');
    document.getElementById('season').innerHTML = season.map(tileHTML).join('') || '<p class="muted">Everything is sold out right now. Please check back soon.</p>';
  };

  // Icons: data-icon="name" puts that icon before the text, and every .link-arrow gets an arrow after it.
  document.querySelectorAll('[data-icon]').forEach((el) => el.insertAdjacentHTML('afterbegin', FS.icon(el.dataset.icon, 16)));
  document.querySelectorAll('.link-arrow').forEach((a) => a.insertAdjacentHTML('beforeend', FS.icon('arrow', 16)));
  document.querySelectorAll('.quote').forEach((q) => q.insertAdjacentHTML('afterbegin', starsSVG(Number(q.dataset.rating))));
  if (user) showCustomerButtons();
  render();
  window.addEventListener('fs:change', render);     // stock changed here or in another tab
});
