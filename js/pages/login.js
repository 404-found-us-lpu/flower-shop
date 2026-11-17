/* Made by: Yash */
/* Bloom & Petal - js/pages/login.js - the sign-in page: email and password, and Neha's demo account. */
FS.ready(() => {
  const form = document.getElementById('login-form');
  const { email, password } = form.elements;
  const asked = FS.params().get('next') || '';
  // Only a page of this shop ("name.html", maybe with ?...) is followed, never another website.
  const next = /^[\w-]+\.html(\?.*)?$/.test(asked) ? asked : 'home.html';

  // Signs in with the email and password in the form, then opens the next page.
  const signIn = () => {
    const r = FS.login(email.value, password.value);
    if (r.ok) {
      location.href = next;
    } else {
      FS.showErrors(form, r.errors);
      password.select(); // typing again replaces the wrong password
    }
  };

  // Demo button: fills in Neha's email and password from FS.DEMO, then signs in.
  const tryDemo = () => {
    email.value = FS.DEMO.email;
    password.value = FS.DEMO.password;
    signIn();
  };

  document.getElementById('next-note').hidden = !asked; // say why they landed here
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    signIn();
  });
  document.getElementById('demo-login').addEventListener('click', tryDemo);
});
