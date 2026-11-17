/* Made by: Satyam */
/* Bloom & Petal - js/pages/contact.js - checks the message form on the contact page (the rest of the page is plain HTML). */

FS.ready(() => {

  // The message form on the contact page
  const form = document.getElementById('contact-form');

  // When the form is sent: check the fields, show any errors, or else say thank you.
  // Nothing is really sent anywhere - this project runs only in the browser.
  form.addEventListener('submit', (event) => {
    event.preventDefault(); // stop the browser from reloading the page

    // Read what the user typed
    const { name, email } = FS.formData(form);

    // HTML already checked the fields (the phone pattern too). JS catches what HTML lets through:
    // a name of only spaces and an email with no dot after the @. One message per wrong field.
    const errors = {};

    if (!name) errors.name = 'Please enter your name.';
    if (!FS.isEmail(email)) errors.email = 'Please enter a correct email address.';

    // showErrors puts the messages under the fields and returns true if there was any error
    if (FS.showErrors(form, errors)) return;

    // Everything is correct: thank the user by first name and empty the form
    FS.toast(`Thanks, ${name.split(' ')[0]}! We will call you back within a day.`);

    form.reset();
  });

});
