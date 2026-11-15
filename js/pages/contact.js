/* Made by: Satyam */
/* Bloom & Petal - js/pages/contact.js - the contact page: shop address, the three owners and the message form. */
FS.ready(() => {
  const form = document.getElementById('contact-form');

  // A made-up job and one line for each owner: [job, line].
  const JOBS = {
    Yash: ['Website and design', 'Builds the pages and picks every photo you see.'],
    Satyam: ['Orders and delivery', 'Checks each order and plans the delivery rounds.'],
    Raghav: ['Flowers and stock', 'Buys fresh flowers at the mandi at dawn and counts the stock.']
  };

  // One owner card: initials, name, job and one line.
  const ownerHTML = (name) => {
    const [job, line] = JOBS[name];
    return `
      <article class="owner">
        <span class="avatar avatar-lg" aria-hidden="true">${FS.esc(FS.initials(name))}</span>
        <h3>${FS.esc(name)}</h3>
        <h4>${job}</h4>
        <p>${line}</p>
      </article>`;
  };

  // Checks the message form. Returns { fieldName: 'problem' } (empty when everything is fine).
  const check = ({ name, email, phone, topic, message }) => {
    const errors = {};
    if (name.length < 2) errors.name = 'Please write your name.';
    if (!FS.isEmail(email)) errors.email = 'Please enter a correct email address.';
    if (!FS.isPhone(phone)) errors.phone = 'Enter a 10 digit mobile number starting with 6, 7, 8 or 9.';
    if (!topic) errors.topic = 'Please choose a topic.';
    if (message.length < 10) errors.message = 'Please write at least 10 letters.';
    return errors;
  };

  // Send: show the problems under the fields, or say thank you and empty the form (nothing is sent anywhere).
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = FS.formData(form);
    if (FS.showErrors(form, check(data))) return;
    FS.toast(`Thanks, ${data.name.split(' ')[0]}! We will call you back within a day.`);
    form.reset();
  });

  const shop = FS.SHOP;
  document.getElementById('shop-address').innerHTML = `${shop.address.map(FS.esc).join('<br>')}<br>
    <a href="tel:${FS.esc(shop.phone.replaceAll(' ', ''))}">${FS.esc(shop.phone)}</a><br>
    <a href="mailto:${FS.esc(shop.email)}">${FS.esc(shop.email)}</a>`;
  document.getElementById('owners').innerHTML = shop.owners.map(ownerHTML).join('');
});
