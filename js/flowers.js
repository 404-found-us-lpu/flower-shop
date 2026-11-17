/* Made by: Raghav */
/* js/flowers.js - the flowers page.
   Unit 5 topics: Fetch API + JSON (getFlowers), loops and higher-order functions (filter, map, forEach, find),
   template literals, DOM selection and changes, event handling (click, input) with event delegation,
   a case-insensitive search with toLowerCase().includes(), and the Drag and Drop API. */

const list = document.getElementById('flower-list');
const count = document.getElementById('count');
const search = document.getElementById('search');
const types = document.getElementById('types');
const dropZone = document.getElementById('drop-zone');

let flowers = [];   // all 45 flowers, filled in once flowers.json has loaded
let chosenType = ''; // '' means every group

// The green "14 in stock" pill, or the red "Only 4 left" pill at 5 or fewer.
const stockLabel = (stock) =>
  stock <= 5 ? `<span class="stock low">Only ${stock} left</span>` : `<span class="stock">${stock} in stock</span>`;

// One flower card as HTML, the same tags as the old static cards.
const flowerCard = (flower) => `
  <article class="flower" draggable="true" data-id="${flower.id}">
    <img src="${flower.image}" alt="${flower.name}" width="900" height="600" loading="lazy">
    <div>
      <h3>${flower.name}</h3>
      ${flower.hindi ? `<p class="hindi" lang="hi">${flower.hindi}</p>` : ''}
      ${flower.botanical ? `<p><i lang="la">${flower.botanical}</i></p>` : ''}
      <p>${flower.description}</p>
      <p><span class="price">${rupees(flower.price)}</span> ${stockLabel(flower.stock)}</p>
      <button type="button" class="btn" data-id="${flower.id}" aria-label="Add ${flower.name} to cart">Add to cart</button>
    </div>
  </article>`;

// Does this flower match the search words? Checks the English, Hindi and botanical names.
const matchesSearch = (flower, words) =>
  [flower.name, flower.hindi, flower.botanical].some((name) => name.toLowerCase().includes(words));

// Draws the cards for the chosen group and search words, and the "N flowers" line.
function showFlowers() {
  const words = search.value.trim().toLowerCase();
  const shown = flowers.filter((flower) => (chosenType === '' || flower.type === chosenType) && matchesSearch(flower, words));

  list.innerHTML = shown.map(flowerCard).join('');
  if (shown.length === 0) count.textContent = 'No flowers match';
  else count.textContent = `${shown.length} ${shown.length === 1 ? 'flower' : 'flowers'}`;
}

// Puts one flower in the cart and says so in the drop zone.
function addFlower(id) {
  const flower = flowers.find((item) => item.id === id);
  if (!flower) return; // something that is not one of our cards was dropped
  addToCart(id);
  showMessage('cart-msg', `${flower.name} added to your cart (${cartCount()} in cart).`);
}

// ---------------------------------------------------------------- Load the flowers (Fetch API + JSON)
getFlowers()
  .then((data) => {
    flowers = data;
    showFlowers();
  })
  .catch(() => {
    showMessage('count', 'Sorry, the flowers could not be loaded. Please open this page on the live site or with Live Server.', true);
  });

// ---------------------------------------------------------------- Events
// Group buttons: one listener on the group (event delegation), then mark the pressed button.
types.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  chosenType = button.dataset.type;

  types.querySelectorAll('button').forEach((b) => {
    const isChosen = b === button;
    b.classList.toggle('btn-light', !isChosen);
    b.setAttribute('aria-pressed', isChosen);
  });
  showFlowers();
});

// Search box: filter again on every key press.
search.addEventListener('input', showFlowers);

// "Add to cart" buttons: one listener on the card list catches clicks on every card (event delegation).
list.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-id]');
  if (button) addFlower(Number(button.dataset.id));
});

// ---------------------------------------------------------------- Drag and Drop API
// Start dragging a card: remember which flower it is.
list.addEventListener('dragstart', (event) => {
  const card = event.target.closest('.flower');
  if (card) event.dataTransfer.setData('text/plain', card.dataset.id);
});

// A card is over the drop zone: preventDefault() allows the drop, and the zone lights up.
dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropZone.classList.add('over');
});

// The card left the drop zone without being dropped.
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('over'));

// The card was dropped: add that flower to the cart.
dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropZone.classList.remove('over');
  addFlower(Number(event.dataTransfer.getData('text/plain')));
});
