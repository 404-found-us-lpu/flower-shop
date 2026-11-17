/* Made by: Yash */
/* Bloom & Petal - js/pages/profile.js - your profile: your saved details, an edit form and a password form. */
FS.ready((user) => {
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
    document.querySelectorAll('[data-me]').forEach((el) => {
      el.textContent = me[el.dataset.me] || 'Not added yet';
    });
    document.getElementById('p-avatar').textContent = FS.initials(me.name);
    const joined = document.getElementById('p-joined');
    joined.dateTime = me.joined;
    joined.textContent = FS.fmtDate(me.joined);
  };

  // Saves name, mobile number and address (FS.updateProfile checks them).
  const saveDetails = (e) => {
    e.preventDefault();
    const r = FS.updateProfile(FS.formData(detailsForm));
    if (!r.ok) return FS.showErrors(detailsForm, r.errors);
    FS.clearErrors(detailsForm);
    fillForm(r.user);
    FS.toast('Your details are saved.');
  };

  // Changes the password: the present one, then the new one twice.
  const savePassword = (e) => {
    e.preventDefault();
    const { current, next, confirm } = FS.formData(passwordForm);
    const r = FS.changePassword(current, next, confirm);
    if (!r.ok) return FS.showErrors(passwordForm, r.errors);
    passwordForm.reset();
    FS.clearErrors(passwordForm);
    FS.toast('Password changed. Use the new one next time you sign in.');
  };

  detailsForm.addEventListener('submit', saveDetails);
  passwordForm.addEventListener('submit', savePassword);
  window.addEventListener('fs:change', render); // data changed here or in another tab
  fillForm(user);
  render();
});
