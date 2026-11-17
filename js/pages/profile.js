/* Made by: Yash */
/* Bloom & Petal - js/pages/profile.js - your profile: your saved details, an edit form and a password form. */

// Runs when the page is ready and someone is logged in. "user" is that person.
FS.ready((user) => {
  // The two forms on this page.
  const detailsForm = document.getElementById('details-form');
  const passwordForm = document.getElementById('password-form');

  // Puts the saved name, mobile number and address into the edit form.
  const fillForm = ({ name, phone, address }) => {
    const { elements } = detailsForm;

    elements.name.value = name;
    elements.phone.value = phone;
    elements.address.value = address || '';
  };

  // Writes the saved details into the page: each [data-me] box, the initials and the joining date.
  const render = () => {
    const me = FS.currentUser();
    if (!me) return; // logged out (for example during a reset)

    // Each box with data-me="name" (or phone, email...) shows that saved value.
    document.querySelectorAll('[data-me]').forEach((el) => {
      el.textContent = me[el.dataset.me] || 'Not added yet';
    });

    // The avatar circle shows the user's initials.
    document.getElementById('p-avatar').textContent = FS.initials(me.name);

    // The joining date, as a <time> element.
    const joined = document.getElementById('p-joined');
    joined.dateTime = me.joined;
    joined.textContent = FS.fmtDate(me.joined);
  };

  // Saves name, mobile number and address (FS.updateProfile checks them).
  const saveDetails = (event) => {
    event.preventDefault();

    const result = FS.updateProfile(FS.formData(detailsForm));
    if (!result.ok) return FS.showErrors(detailsForm, result.errors);

    FS.clearErrors(detailsForm);
    fillForm(result.user);
    FS.toast('Your details are saved.');
  };

  // Changes the password: the present one, then the new one twice.
  const savePassword = (event) => {
    event.preventDefault();

    const { current, next, confirm } = FS.formData(passwordForm);
    const result = FS.changePassword(current, next, confirm);
    if (!result.ok) return FS.showErrors(passwordForm, result.errors);

    passwordForm.reset();
    FS.clearErrors(passwordForm);
    FS.toast('Password changed. Use the new one next time you sign in.');
  };

  // Connect the forms to their functions.
  detailsForm.addEventListener('submit', saveDetails);
  passwordForm.addEventListener('submit', savePassword);

  // Redraw when the saved data changes, here or in another tab.
  window.addEventListener('fs:change', render);

  // First fill of the form and the page.
  fillForm(user);
  render();
});
