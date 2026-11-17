/* Made by: Yash */
/* js/index.js - the home page.
   Unit 5 topics: DOM selection and changes (the greeting) and event handling (Add to cart). */

// Greet the signed-in customer by first name in the green hero band.
const me = currentUser();
if (me) {
  document.getElementById('hero-tag').textContent = `Hello, ${me.name.split(' ')[0]}`;
}

// "Add to cart" buttons under Indian favourites (one listener for all of them: event delegation).
document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-add]');
  if (!button) return;
  addToCart(Number(button.dataset.add));
  showMessage('add-msg', `${button.getAttribute('aria-label').replace('Add ', '').replace(' to cart', '')} added to your cart.`);
});
