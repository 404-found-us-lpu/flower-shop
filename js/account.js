/* Made by: Yash */
/* js/account.js - "Sign in" and "Create an account" on the cart page.
   Unit 5 topics: DOM selection, event handling (submit, click), form validation with regular expressions
   (EMAIL_RULE, PHONE_RULE from shop.js), a higher-order function (find with a callback), Web Storage
   (signIn() and register() in shop.js save to localStorage), accessible JS (role="status" messages, focus). */

const signinForm = document.getElementById('signin-form');
const registerForm = document.getElementById('register-form');

// Show the two forms only when nobody is signed in.
document.getElementById('account').hidden = currentUser() !== null;

// Sign in (or Enter): check the fields again, then sign in and reload the page as a signed-in customer.
signinForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const email = signinForm.elements.email;
  const password = signinForm.elements.password;

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
    location.reload();
  } else {
    showMessage('signin-msg', 'Wrong email or password.', true);
    password.value = '';
    password.focus();
  }
});

// "Use the demo account" fills in the demo customer's email and password (DEMO_USER is in shop.js).
document.getElementById('demo-btn').addEventListener('click', () => {
  signinForm.elements.email.value = DEMO_USER.email;
  signinForm.elements.password.value = DEMO_USER.password;
  showMessage('signin-msg', 'Demo account filled in. Press Sign in.');
});

// Every check for a new account, in order: the field, a test that must be true, and the message when it is not.
const fields = registerForm.elements;
const checks = [
  { field: fields.fullname, ok: () => fields.fullname.value.trim().length >= 2, text: 'Please type your full name.' },
  { field: fields.email, ok: () => EMAIL_RULE.test(fields.email.value.trim()), text: 'Please type an email like name@example.com.' },
  { field: fields.mobile, ok: () => PHONE_RULE.test(fields.mobile.value.trim()), text: 'The mobile number needs 10 digits and starts with 6, 7, 8 or 9.' },
  { field: fields.password, ok: () => fields.password.value.length >= 6, text: 'The password needs at least 6 characters.' },
  { field: fields.confirm, ok: () => fields.confirm.value === fields.password.value, text: 'The two passwords are not the same.' },
  { field: fields.agree, ok: () => fields.agree.checked, text: 'Please tick "I agree" to make the account.' },
];

// Create account (or Enter): run the checks, save the account (this also signs in), reload the page.
registerForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const failed = checks.find((check) => !check.ok());
  if (failed) {
    showMessage('register-msg', failed.text, true);
    failed.field.focus();
    return;
  }

  // register() gives back an error message, or '' when the account was made.
  const problem = register(fields.fullname.value, fields.email.value, fields.password.value);
  if (problem) {
    showMessage('register-msg', problem, true);
    fields.email.focus();
    return;
  }

  location.reload();
});
