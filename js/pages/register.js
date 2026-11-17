/* Made by: Yash */
/* Bloom & Petal - js/pages/register.js - the sign-up page: creates a customer account, logs it in and opens home.html. */
FS.ready(() => {
  const form = document.getElementById('register-form');

  // Sends the form to FS.register (it checks every field), then opens home.html.
  // FS.formData never trims password boxes, so a space in a password is kept.
  const createAccount = (e) => {
    e.preventDefault();
    const r = FS.register(FS.formData(form));
    if (r.ok) {
      location.href = 'home.html';
    } else {
      FS.showErrors(form, r.errors);
    }
  };

  form.addEventListener('submit', createAccount);
});
