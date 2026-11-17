/* Made by: Yash */
/* basic/js/register.js - the "Create an account" page.
   Unit 5 topics: form validation with regular expressions (EMAIL_RULE, PHONE_RULE from shop.js), a higher-order
   function (find with a callback), event handling (submit), Web Storage (register() in shop.js saves the account
   in localStorage), accessible JS (role="status" message and focus on the field that needs fixing). */

const form = document.getElementById('register-form');
const fields = form.elements;

// Every check in order: the field, a test that must be true, and the message when it is not.
const checks = [
  { field: fields.fullname, ok: () => fields.fullname.value.trim().length >= 2, text: 'Please type your full name.' },
  { field: fields.email, ok: () => EMAIL_RULE.test(fields.email.value.trim()), text: 'Please type an email like name@example.com.' },
  { field: fields.mobile, ok: () => PHONE_RULE.test(fields.mobile.value.trim()), text: 'The mobile number needs 10 digits and starts with 6, 7, 8 or 9.' },
  { field: fields.password, ok: () => fields.password.value.length >= 6, text: 'The password needs at least 6 characters.' },
  { field: fields.confirm, ok: () => fields.confirm.value === fields.password.value, text: 'The two passwords are not the same.' },
  { field: fields.agree, ok: () => fields.agree.checked, text: 'Please tick "I agree" to make the account.' },
];

// Pressing Create account (or Enter): run the checks, then save the account and go to the home page.
form.addEventListener('submit', (event) => {
  event.preventDefault();

  const failed = checks.find((check) => !check.ok());
  if (failed) {
    showMessage('register-msg', failed.text, true);
    failed.field.focus();
    return;
  }

  // register() gives back an error message, or '' when the account was made (and signed in).
  const problem = register(fields.fullname.value, fields.email.value, fields.password.value);
  if (problem) {
    showMessage('register-msg', problem, true);
    fields.email.focus();
    return;
  }

  showMessage('register-msg', 'Account made. Taking you to the home page...');
  location.href = 'index.html';
});
