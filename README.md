# Bloom & Petal - online flower shop

A flower shop website: browse 45 flowers (including Indian favourites like mogra, genda and aprajita), see how many of
each are in stock, sign in, fill a cart, choose a delivery day and time, place the order and see it under My orders.
Made with **HTML, CSS and JavaScript only** (no frameworks, no server), using what CSE326 Units 1-5 teach. Accounts,
the cart and orders are saved in the browser with `localStorage`.

* Subject: CSE326 - Internet Programming
* Made by: Yash, Satyam and Raghav (Section K4P26GH), who are also the shop's owners on the site
* Live website: https://project.lpu.lol
* Code: https://github.com/yash-dhanda/flower-shop

## How to open it

Live: https://project.lpu.lol

On your own computer: open the folder in VS Code and use *Open with Live Server* (the flowers are loaded from
`flowers.json` with `fetch`, which needs a web server; double-clicking the file is not enough).

Demo login: **neha@example.com / neha123** (the sign-in page has a demo button), or create an account.

## Pages

| Page | What it does |
|---|---|
| index.html | Home: flowers today, Indian favourites with Add to cart, how to order, reviews |
| flowers.html | All 45 flowers from `flowers.json`: type buttons, search, Add to cart, drag a flower to the cart |
| order.html | Cart (change quantity, remove) and checkout: receiver, day, time slot, payment, card message |
| thanks.html | "Your order is placed" |
| orders.html | My orders, with the total spent |
| signin.html, register.html | Sign in, create an account |
| contact.html | Address, phone, email, hours, the three owners, a message form, a map and "How far is our shop from me?" |

## How the code is organised

* `css/style.css` - the one stylesheet, with comments naming the Unit 3 topic of each part
* `js/shop.js` - shared code: saved data (localStorage), accounts, loading the flowers (fetch + JSON), cart, orders,
  form rules (regular expressions), the header
* `js/<page>.js` - one small script per page
* `flowers.json` - the 45 flowers; `images/` - photos (credits in `images/CREDITS.md`); `media/chime.mp3` - the order chime

## What we used from each unit

| Unit | Where |
|---|---|
| 1 HTML fundamentals | headings, text tags (strong, em, b, i, mark, small, sub, abbr, q, blockquote, kbd, code, pre), lists, links (tel:, mailto:), images, inline SVG (rect, line, polyline, polygon, circle, text), audio, iframe |
| 2 Semantic HTML and forms | header, nav, main, section, article, footer, address, time, figure, forms with fieldset/legend, labels, input types, required, pattern, minlength, datalist, textarea, tables with caption, colgroup, thead, tbody, tfoot |
| 3 CSS | variables, selectors, attribute selectors, combinators, colours, gradients, units, typography, box model, positioning, flexbox, grid with areas, pseudo-classes and pseudo-elements, form styling, transitions, keyframes, media queries |
| 4 JavaScript fundamentals | const/let, template literals, functions and arrow functions, default parameters, if / else, arrays and objects, spread and destructuring |
| 5 Interactive web | DOM selection and changes, events, event delegation, form validation with regular expressions, dates, localStorage / sessionStorage, fetch + JSON, audio events (the chime), Geolocation (distance to the shop), Drag and Drop (drag a flower to the cart) |

## Who made what

| Student | Files |
|---|---|
| Yash | `css/style.css`, `index`, `signin`, `register` pages and their scripts |
| Raghav | `flowers.html`, `js/flowers.js`, `flowers.json` |
| Satyam | `order`, `orders`, `thanks`, `contact` pages and their scripts |
| All three | `js/shop.js` (the shared code) |

## Limits

There is no server, so accounts, carts and orders live in each browser separately, and passwords are kept in the
browser (fine for a class demo, never for a real shop). The contact form checks the message but does not send it.
Contact details and reviews are made up for the project.
