/* Made by: Satyam */
/* Bloom & Petal - js/pages/contact.js - the message form (the rest of the contact page is plain HTML). */
FS.ready(() => {
  const form = document.getElementById('contact-form');

  // Send: HTML has checked every field; FS checks email and phone again, then says thank you (nothing is sent anywhere).
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const { name, email, phone } = FS.formData(form);
    const errors = {};
    if (!name) errors.name = 'Please enter your name.';
    if (!FS.isEmail(email)) errors.email = 'Please enter a correct email address.';
    if (!FS.isPhone(phone)) errors.phone = 'Enter a 10 digit mobile number starting with 6, 7, 8 or 9.';
    if (FS.showErrors(form, errors)) return;
    FS.toast(`Thanks, ${name.split(' ')[0]}! We will call you back within a day.`);
    form.reset();
  });
});
