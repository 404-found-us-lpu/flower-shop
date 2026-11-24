/* Bloom & Petal */
/* js/index.js - the shop page: the numbered list of flowers with - and + buttons.
   Unit 5 topics: Fetch API + JSON (getFlowers), map and template literals to build the list,
   DOM changes, event handling with event delegation (one listener for every - and + button). */

const list = document.getElementById('flower-list');


// One row: serial number, photo, name, price, and the "- 0 +" control.
function flowerRow(flower, index) {
  return `
    <li>
      <span class="serial">${index + 1}.</span>
      <img src="${flower.image}" alt="" width="96" height="64" loading="lazy">
      <span class="name">${safe(flower.name)} <span class="price">${rupees(flower.price)}</span></span>
      ${stepperHTML(flower.id, flower.name)}
    </li>`;
}

// - and + buttons: change the quantity in the cart and show the new number between the buttons.
list.addEventListener('click', (event) => {
  const button = event.target.closest('[data-step]');
  if (!button) return;
  const qty = stepQty(Number(button.dataset.id), Number(button.dataset.step));
  button.parentElement.querySelector('output').textContent = qty;
});

// Load the flowers from flowers.json and draw the list.
getFlowers()
  .then((flowers) => {
    list.innerHTML = flowers.map(flowerRow).join('');
    showMessage('list-msg', '');
  })
  .catch(() => {
    showMessage('list-msg', 'Sorry, the flowers could not load. Open the site through Live Server or the live address.', true);
  });
