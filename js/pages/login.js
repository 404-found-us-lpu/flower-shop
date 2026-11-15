/* Made by: Yash */
/* Bloom & Petal - js/pages/login.js - the sign-in page: email and password, a "Show" button and Neha's demo account. */
FS.ready(() => {
  const form = document.getElementById('login-form');
  const { email, password } = form.elements;
  const showBtn = document.getElementById('show-password');
  const asked = FS.params().get('next') || '';
  // Only a page of this shop ("name.html", maybe with ?...) is followed, never another website.
  const next = /^[\w-]+\.html(\?.*)?$/.test(asked) ? asked : 'home.html';

  // Signs in with the email and password in the form, then opens the next page. Returns true when it worked.
  const signIn = () => {
    const r = FS.login(email.value, password.value);
    if (!r.ok) {
      FS.showErrors(form, r.errors);
      password.select();                                   // typing again replaces the wrong password
      return false;
    }
    FS.toast(`Welcome back, ${r.user.name.split(' ')[0]}.`);
    setTimeout(() => { location.href = next; }, 600);       // a moment to read the toast
    return true;
  };

  // "Show" button: switches the password between dots and plain text.
  const togglePassword = () => {
    password.type = password.type === 'password' ? 'text' : 'password';
    showBtn.textContent = password.type === 'text' ? 'Hide' : 'Show';
    showBtn.setAttribute('aria-label', `${showBtn.textContent} password`);
  };

  // Demo button: fills in FS.DEMO and signs in. If the demo password was changed here, offer to reset the demo data.
  const tryDemo = () => {
    email.value = FS.DEMO.email;
    password.value = FS.DEMO.password;
    if (signIn()) return;
    FS.confirm('The demo account was changed in this browser. Reset all demo data so it works again? Orders saved in this browser will be lost.',
      { title: 'Demo account changed', okText: 'Reset demo data', danger: true })
      .then((yes) => { if (yes && FS.resetDemo()) signIn(); });
  };

  document.getElementById('next-note').hidden = !asked;     // say why they landed here
  form.addEventListener('submit', (e) => { e.preventDefault(); signIn(); });
  showBtn.addEventListener('click', togglePassword);
  document.getElementById('demo-login').addEventListener('click', tryDemo);
});
