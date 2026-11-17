/* Made by: Satyam */
/* basic/js/contact.js - the contact page: "how far is the shop" and the message form.
   Unit 5 topics: Geolocation API with success and error callbacks, Math (the haversine formula),
   event handling (click, submit), form validation with regular expressions (EMAIL_RULE, PHONE_RULE). */

// Where the shop is: Model Town Market, Jalandhar.
const SHOP = { lat: 31.315, lon: 75.58 };

// Straight-line distance in km between two places on Earth (the haversine formula).
function kmBetween(lat1, lon1, lat2, lon2) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a)); // 6371 km is the Earth's radius
}

// Success callback: the browser found the customer.
function showDistance(position) {
  const km = kmBetween(position.coords.latitude, position.coords.longitude, SHOP.lat, SHOP.lon);
  const text = km < 1 ? 'You are less than 1 km from the shop.' : `The shop is about ${Math.round(km)} km away.`;
  showMessage('distance-msg', text);
}

// Error callback: the customer said no, or the location could not be found.
function showLocationError(error) {
  const text = error.code === error.PERMISSION_DENIED
    ? 'You did not allow location access, so we cannot work out the distance.'
    : 'Sorry, your location could not be found. Please try again.';
  showMessage('distance-msg', text, true);
}

// The "How far is our shop from me?" button.
document.getElementById('distance-btn').addEventListener('click', () => {
  if (!navigator.geolocation) {
    showMessage('distance-msg', 'This browser cannot share your location.', true);
    return;
  }
  showMessage('distance-msg', 'Finding you...');
  navigator.geolocation.getCurrentPosition(showDistance, showLocationError, { timeout: 15000 });
});

// The message form: check it again in JavaScript, thank the customer, clear the form. Nothing is sent.
const contactForm = document.getElementById('contact-form');

contactForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const fields = contactForm.elements;
  const name = fields.name.value.trim();

  if (name.length < 2) return showMessage('contact-msg', 'Please type your name.', true);
  if (!EMAIL_RULE.test(fields.email.value.trim())) return showMessage('contact-msg', 'Please type an email like you@example.com.', true);
  if (!PHONE_RULE.test(fields.phone.value.trim())) return showMessage('contact-msg', 'The mobile number needs 10 digits, starting with 6, 7, 8 or 9.', true);
  if (fields.message.value.trim().length < 10) return showMessage('contact-msg', 'Please write a message of at least 10 letters.', true);

  showMessage('contact-msg', `Thanks, ${name}! We will call you back.`);
  contactForm.reset();
});
