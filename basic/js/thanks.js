/* Made by: Satyam */
/* basic/js/thanks.js - shows the order number on thanks.html.
   Unit 5 topics: URLSearchParams reads ?order=1001 from the address bar, a regular expression checks it,
   and DOM changes (textContent) write it into the heading. */

// Read the order number from the address, e.g. thanks.html?order=1001.
function showOrderNumber() {
  const id = new URLSearchParams(location.search).get('order');

  // Only digits count; with no number the heading keeps its plain "Thank you" text
  if (id && /^[0-9]+$/.test(id)) {
    document.getElementById('thanks-title').textContent = `Order #${id} is placed`;
  }
}

showOrderNumber();
