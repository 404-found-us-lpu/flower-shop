/* Made by: Yash */
/* Bloom & Petal - js/pages/register.js - the sign-up page: creates a customer account, logs it in and opens home.html. */

FS.ready(() => {

  // The sign-up form on register.html.
  const form = document.getElementById('register-form');

  // On submit, FS.register checks every field, saves the account and logs it in.
  // FS.formData never trims password boxes, so a space in a password is kept.
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const result = FS.register(FS.formData(form));

    if (result.ok) location.href = 'home.html';
    else FS.showErrors(form, result.errors);
  });
});
