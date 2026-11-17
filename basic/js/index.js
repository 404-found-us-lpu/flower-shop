/* Made by: Yash */
/* basic/js/index.js - the home page.
   Unit 5 topics: DOM selection and changes (the greeting), video events (play, ended),
   Web Storage (sessionStorage counts how often the tour was watched in this visit). */

// Greet the signed-in customer by first name in the green hero band.
const me = currentUser();
if (me) {
  document.getElementById('hero-tag').textContent = `Hello, ${me.name.split(' ')[0]}`;
}

const video = document.getElementById('tour-video');

// The video starts again: clear the old thank-you message.
video.addEventListener('play', () => {
  showMessage('tour-msg', '');
});

// The video reached the end: count it in sessionStorage (forgotten when the tab closes) and say thanks.
video.addEventListener('ended', () => {
  const views = Number(sessionStorage.getItem('bp.tourViews') || 0) + 1;
  sessionStorage.setItem('bp.tourViews', views);

  const times = views === 1 ? 'once' : `${views} times`;
  document.getElementById('tour-msg').innerHTML =
    `Thanks for watching (${times} this visit) — <a href="flowers.html">see all 45 flowers &rarr;</a>`;
});

// "Add to cart" buttons under Indian favourites (one listener for all of them: event delegation).
document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-add]');
  if (!button) return;
  addToCart(Number(button.dataset.add));
  showMessage('add-msg', `${button.getAttribute('aria-label').replace('Add ', '').replace(' to cart', '')} added to your cart.`);
});
