/* Made by: Yash */
/* Bloom & Petal - js/pages/register.js - the sign-up page: creates a customer account, logs it in and opens home.html. */
FS.ready(() => {
  const form = document.getElementById('register-form');
  const showBtn = document.getElementById('show-passwords');
  const { password, confirm } = form.elements;

  // "Show" button: switches both password boxes between dots and plain text.
  const togglePasswords = () => {
    const type = password.type === 'password' ? 'text' : 'password';
    password.type = confirm.type = type;
    showBtn.textContent = type === 'text' ? 'Hide' : 'Show';
    showBtn.setAttribute('aria-label', `${showBtn.textContent} passwords`);
  };

  // Sends the form to FS.register (it checks every field), then opens home.html.
  // The passwords are read straight from the boxes, so they are never trimmed, even while "Show" is on.
  const createAccount = (e) => {
    e.preventDefault();
    const r = FS.register({ ...FS.formData(form), password: password.value, confirm: confirm.value });
    if (!r.ok) return FS.showErrors(form, r.errors);
    FS.toast(`Welcome to Bloom & Petal, ${r.user.name.split(' ')[0]}. Your account is ready.`);
    setTimeout(() => { location.href = 'home.html'; }, 900);   // a moment to read the toast
  };

  showBtn.addEventListener('click', togglePasswords);
  form.addEventListener('submit', createAccount);
});
