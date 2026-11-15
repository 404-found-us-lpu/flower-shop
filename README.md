# Bloom & Petal - online flower shop

A flower shop website for customers: browse flowers (including Indian favourites like mogra, genda and
aprajita), see how many of each are in stock, fill a cart, choose a delivery day and time, place the order and
look back at past orders. Made with **HTML, CSS and JavaScript only** (no frameworks, no server). All data is
saved in the browser with `localStorage`.

* Subject: CSE326 - Internet Programming
* Made by: Yash, Satyam and Raghav (Section K4P26GH), who are also the shop's owners on the site
* Live website: https://project.lpu.lol
* Code: https://github.com/yash-dhanda/flower-shop

## How to open it

Live: https://project.lpu.lol

On your own computer: open the folder in VS Code and use *Open with Live Server*, or run
`python3 -m http.server` in the folder and open http://localhost:8000.

Demo login: **neha@example.com / neha123** (the login page has a one-click demo button). "Reset demo data"
in the account menu puts every flower, order and account back to the start.

## Pages

| Page | Who can open it | What it does |
|---|---|---|
| index.html | everyone | Front page: flowers today, Indian favourites, in season, how it works, reviews, shop tour video, questions |
| contact.html | everyone | Address, phone, email, opening hours, the three owners, a message form and a map |
| login.html, register.html | visitors | Sign in, create an account |
| home.html | logged in | Greeting, next delivery, Indian favourites, shop by type, recent orders, tip of the day |
| catalog.html | logged in | All 18 flowers with search, type tabs, sorting, stock counts and add to cart |
| cart.html | logged in | Cart, free-delivery bar, delivery details, day and time, payment, place order |
| orders.html | logged in | Table of my orders with the total spent |
| order.html | logged in | One order: items, receiver, delivery day, printable receipt |
| profile.html | logged in | My details, change password, a chart of my orders |

## How the code is organised

* `css/style.css` - the one stylesheet (colours, layout, every component), with comments naming the Unit 3 topic of each part
* `js/app.js` - shared code: data store, login, flowers and cart, orders, header and footer, dialogs, helpers
* `js/pages/*.js` - one small script per page
* `images/` - flower photos (credits in `images/CREDITS.md`), `media/` - shop tour video, captions and the order chime, `fonts/` - the two web fonts

## What we used from each unit

| Unit | Where |
|---|---|
| 1 HTML fundamentals | headings h1-h6, p, br, hr, strong/em/b/i, mark, small, sub/sup, abbr, q, blockquote, pre/code, kbd, del/ins, ul/ol/li, dl/dt/dd, links (tel:, mailto:), img, inline SVG (rect, line, polyline, polygon, circle, ellipse, text), audio, video with track, iframe |
| 2 Semantic HTML and forms | header, nav, main, section, article, aside, footer, address, time, figure/figcaption, picture/source, details/summary, search, menu, wbr, forms with fieldset/legend, input types, datalist, select with optgroup, textarea, HTML validation, tables with caption, colgroup/col, thead, tbody, tfoot |
| 3 CSS | variables, selectors and specificity, attribute selectors, all four combinators, colours (hex, rgb, hsl), gradients, units (rem, em, %, vw, ch, fr), typography, box model, positioning, flexbox, grid with areas, pseudo-classes (nth-child, LVHA, user-invalid...) and pseudo-elements (marker, first-letter...), form styling with accent-color, transitions and keyframes, media queries |
| 4 JavaScript fundamentals | const/let, operators, template literals, string methods (trim, includes, padStart, padEnd, replaceAll...), numbers and Math, if / else if, switch, ternary, functions, arrow functions, default parameters, scope and closures, arrays and array methods (map, filter, find, reduce, sort, includes), spread and destructuring, objects and Object.entries |

Beyond Unit 4 (needed to make the shop work): the DOM, events, `localStorage` / `sessionStorage` and JSON.

## Who made what

| Student | Files |
|---|---|
| Yash | `css/style.css`, `index`, `login`, `register`, `profile` pages |
| Raghav | `home`, `catalog`, `orders` pages |
| Satyam | `cart`, `order`, `contact` pages |
| All three | `js/app.js` (the shared data and login code) |

## Limits

There is no server, so the data lives in each browser separately and the login is a demo: passwords are only
scrambled, not truly protected. The contact form checks the message but does not send it anywhere. Contact
details and reviews are made up for the project.
