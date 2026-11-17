/* Made by: Yash */
/* js/signin.js - the sign-in page.
   Unit 5 topics: DOM selection and changes, event handling (submit, click), form validation with a regular
   expression, Web Storage (signIn() in shop.js saves who is signed in), accessible JS (role="status", focus). */

const form = document.getElementById('signin-form');

// Where to go after signing in: the page in ?next= (only a plain name like "order.html"), else the home page.
function nextPage() {
  const next = new URLSearchParams(location.search).get('next');
  return next && /^[a-z-]+\.html$/.test(next) ? next : 'index.html';
}

// Already signed in: swap the form for "You are signed in as NAME" and a Sign out button.
function showSignedIn(me) {
  const box = document.createElement('div');
  box.className = 'card';

  const text = document.createElement('p');
  text.textContent = `You are signed in as ${me.name}.`;

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Sign out';
  button.addEventListener('click', signOut);

  box.append(text, button);
  form.replaceWith(box);
}

// Pressing Sign in (or Enter): check the fields again, then sign in.
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const email = form.elements.email;
  const password = form.elements.password;

  if (!EMAIL_RULE.test(email.value.trim())) {
    showMessage('signin-msg', 'Please type an email like name@example.com.', true);
    email.focus();
    return;
  }

  if (password.value.length < 6) {
    showMessage('signin-msg', 'The password needs at least 6 characters.', true);
    password.focus();
    return;
  }

  if (signIn(email.value, password.value)) {
    location.href = nextPage();
  } else {
    showMessage('signin-msg', 'Wrong email or password.', true);
    password.value = '';
    password.focus();
  }
});

// "Use the demo account" fills in Neha's email and password (DEMO_USER is in shop.js).
document.getElementById('demo-btn').addEventListener('click', () => {
  form.elements.email.value = DEMO_USER.email;
  form.elements.password.value = DEMO_USER.password;
  showMessage('signin-msg', 'Demo account filled in. Press Sign in.');
});

// When the page opens, check whether someone is already signed in.
const me = currentUser();
if (me) showSignedIn(me);
