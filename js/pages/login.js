/* Made by: Yash */
/* Bloom & Petal - js/pages/login.js - the sign-in page: email and password, a "Show" button and three demo accounts. */
FS.ready(function () {
  const form = document.getElementById('login-form');
  const submitBtn = form.querySelector('button[type="submit"]');
  const showBtn = document.getElementById('show-password');
  const demoBox = document.getElementById('demo-logins');
  const next = safeNext(FS.params().get('next'));

  // ?next= is the page to open after signing in (app.js adds it when a guest opens a page that needs a login).
  // Only a page of this shop is followed: "//" or ":" could lead to another website, and browsers
  // read "\" as "/" and skip spaces, so a value with any of these is ignored.
  function safeNext(value) {
    return value && !/\/\/|:|\\|\s/.test(value) ? value : '';
  }

  // Locks the buttons while signing in, so a double click cannot sign in twice.
  function setBusy(busy) {
    submitBtn.disabled = busy;
    submitBtn.querySelector('span').textContent = busy ? 'Signing in...' : 'Sign in';
    demoBox.querySelectorAll('button').forEach(function (b) { b.disabled = busy; });
  }

  // Signs in with the email and password in the form. Returns true when it worked.
  // (The password is read straight from the box, never trimmed, even while "Show" makes it a text field.)
  function signIn() {
    setBusy(true);
    const r = FS.login(form.elements.email.value, form.elements.password.value);
    if (!r.ok) {
      setBusy(false);
      FS.showErrors(form, r.errors);
      form.elements.password.select();        // so typing again replaces the wrong password
      return false;
    }
    FS.clearErrors(form);
    FS.toast('Welcome back, ' + r.user.name.split(' ')[0] + '.');
    setTimeout(function () { location.href = next || r.home; }, 600);   // a moment to read the toast
    return true;
  }

  // "Show" button: switches the password between dots and plain text.
  function togglePassword() {
    const input = form.elements.password;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    showBtn.textContent = show ? 'Hide' : 'Show';
    showBtn.setAttribute('aria-label', (show ? 'Hide' : 'Show') + ' password');
  }

  // A demo account stops working if it was changed or removed in this browser.
  // Offer to put all the demo data back, then sign in again.
  function offerReset(roleLabel) {
    FS.confirm('The ' + roleLabel + ' demo account was changed or removed in this browser. Reset all demo data so the demo accounts work again? Orders and changes saved in this browser will be lost.',
      { title: 'Demo account changed', okText: 'Reset demo data', danger: true })
      .then(function (yes) {
        if (!yes) return;
        FS.resetDemo();
        signIn();
      });
  }

  // Tell the visitor why they landed here when another page sent them.
  document.getElementById('next-note').hidden = !next;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    signIn();
  });

  showBtn.addEventListener('click', togglePassword);

  // Demo buttons: fill the form with that account from FS.DEMO and sign in straight away.
  demoBox.addEventListener('click', function (e) {
    const btn = e.target.closest('.demo-login');
    if (!btn) return;
    const demo = FS.DEMO[btn.dataset.role];
    form.elements.email.value = demo.email;
    form.elements.password.value = demo.password;
    if (!signIn()) offerReset(btn.querySelector('strong').textContent.toLowerCase());
  });
});
