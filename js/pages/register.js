/* Made by: Yash */
/* Bloom & Petal - js/pages/register.js - the sign-up page: creates a customer account and logs it in. */
FS.ready(function () {
  const form = document.getElementById('register-form');
  const submitBtn = form.querySelector('button[type="submit"]');
  const showBtn = document.getElementById('show-passwords');

  // Locks the button while the account is made, so a double click cannot make two.
  function setBusy(busy) {
    submitBtn.disabled = busy;
    submitBtn.querySelector('span').textContent = busy ? 'Creating account...' : 'Create account';
  }

  // "Show" button: switches both password boxes between dots and plain text.
  function togglePasswords() {
    const show = form.elements.password.type === 'password';
    form.elements.password.type = show ? 'text' : 'password';
    form.elements.confirm.type = show ? 'text' : 'password';
    showBtn.textContent = show ? 'Hide' : 'Show';
    showBtn.setAttribute('aria-label', (show ? 'Hide' : 'Show') + ' passwords');
  }

  // Sends the form to FS.register, which checks every field, saves the customer and logs them in.
  function createAccount(e) {
    e.preventDefault();
    const data = FS.formData(form);
    // Passwords are read straight from the boxes: never trimmed, even while "Show" makes them text fields.
    data.password = form.elements.password.value;
    data.confirm = form.elements.confirm.value;
    setBusy(true);
    const r = FS.register(data);
    if (!r.ok) {
      setBusy(false);
      FS.showErrors(form, r.errors);
      return;
    }
    FS.clearErrors(form);
    FS.toast('Welcome to Bloom & Petal, ' + r.user.name.split(' ')[0] + '. Your account is ready.');
    setTimeout(function () { location.href = r.home; }, 900);   // a moment to read the toast
  }

  showBtn.addEventListener('click', togglePasswords);
  form.addEventListener('submit', createAccount);
});
