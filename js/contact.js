/* Bloom & Petal */
/* js/contact.js - the message form in the shop info part of the shop page.
   Unit 5 topics: event handling (submit), form validation with regular expressions (EMAIL_RULE, PHONE_RULE). */

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
