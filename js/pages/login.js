/* Made by: Yash */
/* Bloom & Petal - js/pages/login.js - the sign-in page: email and password, and Neha's demo account. */

// Run this code once the page and the shared FS helpers are ready.
FS.ready(() => {

  // --- The form and its two fields ---
  const form = document.getElementById('login-form');
  const { email, password } = form.elements;

  // --- Where to go after signing in ---
  // "?next=cart.html" in the address means: go back to that page after login.
  const asked = FS.params().get('next') || '';

  // Only a page of this shop ("name.html", maybe with ?...) is followed, never another website.
  const next = /^[\w-]+\.html(\?.*)?$/.test(asked) ? asked : 'home.html';

  // Signs in with the email and password in the form, then opens the next page.
  const signIn = () => {
    const result = FS.login(email.value, password.value);

    if (result.ok) {
      location.href = next;
    } else {
      FS.showErrors(form, result.errors);
      password.select(); // typing again replaces the wrong password
    }
  };

  // Demo button: fills in Neha's email and password from FS.DEMO, then signs in.
  const tryDemo = () => {
    email.value = FS.DEMO.email;
    password.value = FS.DEMO.password;
    signIn();
  };

  // --- Connect everything to the page ---
  // Show the "please sign in first" note only when another page sent the user here.
  document.getElementById('next-note').hidden = !asked;

  // Pressing "Sign in" (or Enter) signs in without reloading the page.
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    signIn();
  });

  document.getElementById('demo-login').addEventListener('click', tryDemo);
});
