# Flower Shop Management System

A website for a flower shop, made with HTML, CSS and a little JavaScript.
There is no server and no database, so the pages show example records.

* Subject: CSE326 - Internet Programming
* Made by: Yash, Raghav and Satyam (Section K4P26GH)

## How to open it

Live website: https://project.lpu.lol

On your own computer: double click `index.html`, or in VS Code right click it and choose *Open with Live Server*.

## Login

Any email and password will work. The email decides which side opens:

| Email | Opens |
|---|---|
| meera@flowershop.com | Shop owner |
| priya@flowershop.com | Florist |
| any other email | Customer |

## Pages

| Page | Who uses it | What it shows |
|---|---|---|
| index.html | everyone | Login |
| register.html | new customer | Registration form |
| dashboard-customer.html | customer | Her orders |
| catalog.html | customer | The six flowers with photos, and a search form |
| cart.html | customer | Cart and delivery form |
| dashboard-staff.html | florist | Open orders with a Next stage button, low stock |
| dashboard-admin.html | shop owner | Totals and all orders |
| orders.html | shop owner | All orders and the order stages |
| flowers.html | shop owner | Stock list: add, edit and delete flowers |
| reports.html | shop owner | Totals and a bar chart |

## Where each requirement is

| Requirement | Where |
|---|---|
| Registration and login | register.html, index.html + `checkLogin()` |
| Role based access | each role has its own pages and menu: customer, florist, shop owner |
| Dashboard | dashboard-customer, dashboard-staff, dashboard-admin |
| Add / view / edit / delete | flowers.html: Save, the table, Edit, Delete |
| Search and filter | search forms on catalog, orders and flowers pages (design only) |
| Order workflow | catalog -> cart -> delivery form -> Place order |
| Status tracking | order stages on orders.html, Next stage button on the florist dashboard |
| Validation | `required`, `type="email"`, phone `pattern="[0-9]{10}"`, password `minlength="6"`, number `min`/`max` |
| Notifications and confirmations | messages after register, order and save; question before delete; low stock note |
| Reports | reports.html: totals and sales by type bar chart |
| Responsive | viewport tag, grids become 1 column below 700px, menu wraps, wide tables scroll |

## JavaScript used (`js/script.js`)

* `checkLogin()` opens the right dashboard after login
* `nextStage()` writes the next stage of an order on the florist dashboard
* `editFlower()` fills the stock form with a flower's details
* `deleteFlower()` asks first, then removes the flower's row
* `alert()` after registering, placing an order and saving a flower
* `history.back()` on the Back button

## Not done yet

* Nothing is saved, because there is no database. A deleted flower or a new stage comes back after a reload.
* The search forms are only the design. Searching needs more JavaScript.

## Photo credits

The six flower photos come from Wikimedia Commons. They were cropped and made smaller.
Each photo keeps its own licence.

| Photo | By | Licence | Source |
|---|---|---|---|
| red-rose-bouquet.jpg | Karthika Manikandan | CC0 | https://commons.wikimedia.org/wiki/File:Bouquet_of_red_and_yellow_roses.jpg |
| white-lily-bunch.jpg | George E. Koronaios | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:A_bunch_of_white_lilies_on_a_black_table.jpg |
| sunflower-basket.jpg | Ukra.Inka.Roz | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Sunflowers_for_peace.jpg |
| single-red-rose.jpg | Shixart1985 | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:A_single_red_rose_rests_on_scattered_pages.jpg |
| money-plant-pot.jpg | Mokkie | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:Money_Plant_(Epipremnum_aureum_%27Gold%27).jpg |
| birthday-combo.jpg | Ronald Saunders | CC BY-SA 2.0 | https://commons.wikimedia.org/wiki/File:Flickr_-_ronsaunders47_-_Birthday_bouquet..jpg |
