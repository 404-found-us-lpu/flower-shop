# Bloom & Petal - Flower Shop Management System

A role-based web app for a flower shop: customers order flowers, florists move orders through the
workflow, and the owner manages stock, users and reports. Made with **HTML, CSS and JavaScript only**
(no frameworks, no server). All data is saved in the browser with `localStorage`.

* Subject: CSE326 - Internet Programming
* Made by: Yash, Raghav and Satyam (Section K4P26GH)
* Live website: https://project.lpu.lol
* Code: https://github.com/yash-dhanda/flower-shop

## How to open it

Live: https://project.lpu.lol

On your own computer: open the folder in VS Code and use *Open with Live Server*, or run
`python3 -m http.server` in the folder and open http://localhost:8000.

## Demo logins

| Role | Email | Password |
|---|---|---|
| Customer | neha@example.com | neha123 |
| Florist | priya@bloompetal.in | florist123 |
| Shop owner | meera@bloompetal.in | owner123 |

The login page also has one-click demo buttons. "Reset demo data" in the account menu puts
everything back to the start.

## What each role can do

| Customer | Florist | Shop owner |
|---|---|---|
| Register and log in | Log in | Log in |
| Browse, search, filter and sort flowers | See today's work board | See sales, open orders and low stock |
| Add to cart, change quantities | Move orders to the next stage | Everything a florist can do |
| Check out with delivery date, time and payment | Add and edit flowers, change stock | Delete flowers |
| Track orders and cancel early ones | See all orders, search and filter them | Add, edit and remove users |
| Get notifications | Get notifications for new orders | Reports with charts and CSV download |

## Pages

| Page | Who | What it does |
|---|---|---|
| index.html | everyone | Front page of the shop |
| login.html, register.html | visitors | Sign in, create a customer account |
| home.html | customer | Dashboard: order on the way, shop by type, recent orders |
| catalog.html | customer | All flowers with search, type tabs, sorting and add to cart |
| cart.html | customer | Cart, delivery details, payment, place order |
| orders.html | customer | My orders with tabs and cancel |
| order.html | all logged in | One order: tracker, items, history, status buttons for the shop |
| staff.html | florist | Work board with the four order stages |
| manage-orders.html | florist, owner | Every order with search and filters |
| stock.html | florist, owner | Add, edit, archive and delete flowers, change stock |
| admin.html | owner | Sales, charts, recent orders, low stock |
| reports.html | owner | Reports for a date range, CSV download, print |
| users.html | owner | Add, edit and remove users and their roles |
| profile.html | all logged in | Own details and password |

## The order workflow

Pending -> Confirmed -> Preparing -> Out for delivery -> Delivered.
An order can be cancelled before it is out for delivery (by the customer while it is Pending or
Confirmed). Cancelling puts the flowers back in stock. Every change is written into the order's
history and the customer gets a notification.

## How the code is organised

* `css/style.css` - the one stylesheet (colours, layout, every component)
* `js/app.js` - shared code: data store, login and roles, cart, orders, notifications, header, dialogs
* `js/pages/*.js` - one small script per page
* `images/` - flower photos (credits in `images/CREDITS.md`), `fonts/` - the two web fonts

## Who made what

| Student | Files |
|---|---|
| Yash | `css/style.css`, `index`, `login`, `register`, `profile`, `users` pages |
| Raghav | Customer side: `home`, `catalog`, `cart`, `orders`, `order` pages |
| Satyam | Shop side: `staff`, `manage-orders`, `stock`, `admin`, `reports` pages |
| All three | `js/app.js` (the shared data and login code) |

## Limits

There is no server, so the data lives in each browser separately, and the login is a demo:
passwords are only scrambled, not truly protected. A real shop would keep the data and check logins
on a server.
