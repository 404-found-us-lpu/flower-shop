/* Bloom & Petal (simple version) - calculator.js - Made by: Raghav */
/* A price calculator that runs in the browser Console. It uses only Unit 4 JavaScript:
   variables, arrays, objects, functions, if/else, switch and console.log. It never touches the page. */

// ----- Shop rules (fixed numbers, so they are const) -----

const DELIVERY_FEE = 50;
const FREE_DELIVERY_FROM = 999;
const MAX_QTY = 10;

// ----- The five flower types -----

const types = ["Bouquets", "Indian favourites", "Single stems", "Plants", "Gifts"];

// ----- All 45 flowers, in id order (flower id 1 is at position 0) -----

const flowers = [
  { id: 1, name: "Red Rose Bouquet", price: 349, type: "Bouquets" },
  { id: 2, name: "White Lily Bunch", price: 299, type: "Bouquets" },
  { id: 3, name: "Sunflower Basket", price: 399, type: "Bouquets" },
  { id: 4, name: "Pink Tulip Bunch", price: 349, type: "Bouquets" },
  { id: 5, name: "Gerbera Mix", price: 249, type: "Bouquets" },
  { id: 6, name: "Lavender Bundle", price: 199, type: "Bouquets" },
  { id: 7, name: "Single Red Rose", price: 29, type: "Single stems" },
  { id: 8, name: "Single Sunflower", price: 39, type: "Single stems" },
  { id: 9, name: "Money Plant Pot", price: 149, type: "Plants" },
  { id: 10, name: "Purple Orchid Pot", price: 499, type: "Plants" },
  { id: 11, name: "Succulent Pot", price: 99, type: "Plants" },
  { id: 12, name: "Birthday Combo", price: 599, type: "Gifts" },
  { id: 13, name: "Mogra Pot", price: 149, type: "Indian favourites" },
  { id: 14, name: "Marigold (Genda)", price: 49, type: "Indian favourites" },
  { id: 15, name: "Aprajita Pot", price: 129, type: "Indian favourites" },
  { id: 16, name: "Bleeding Heart Vine Pot", price: 199, type: "Indian favourites" },
  { id: 17, name: "Guldaudi (Chrysanthemum)", price: 179, type: "Indian favourites" },
  { id: 18, name: "Madhumalti Pot", price: 199, type: "Indian favourites" },
  { id: 19, name: "Yellow Rose Bouquet", price: 329, type: "Bouquets" },
  { id: 20, name: "Carnation Bunch", price: 199, type: "Bouquets" },
  { id: 21, name: "Daisy Bunch", price: 149, type: "Bouquets" },
  { id: 22, name: "Hydrangea Bunch", price: 399, type: "Bouquets" },
  { id: 23, name: "Peony Bouquet", price: 499, type: "Bouquets" },
  { id: 24, name: "Purple Iris Bunch", price: 249, type: "Bouquets" },
  { id: 25, name: "Calla Lily Bunch", price: 449, type: "Bouquets" },
  { id: 26, name: "Alstroemeria Bunch", price: 199, type: "Bouquets" },
  { id: 27, name: "Rajnigandha (Tuberose)", price: 99, type: "Indian favourites" },
  { id: 28, name: "Champa (Frangipani) Pot", price: 249, type: "Indian favourites" },
  { id: 29, name: "Gudhal (Hibiscus) Pot", price: 129, type: "Indian favourites" },
  { id: 30, name: "Kamal (Lotus)", price: 79, type: "Indian favourites" },
  { id: 31, name: "Raat Ki Rani Pot", price: 149, type: "Indian favourites" },
  { id: 32, name: "Parijat Pot", price: 169, type: "Indian favourites" },
  { id: 33, name: "Sadabahar Pot", price: 79, type: "Indian favourites" },
  { id: 34, name: "Bougainvillea Pot", price: 199, type: "Indian favourites" },
  { id: 35, name: "Rangan (Ixora) Pot", price: 149, type: "Indian favourites" },
  { id: 36, name: "Single Gerbera", price: 25, type: "Single stems" },
  { id: 37, name: "Single White Lily", price: 49, type: "Single stems" },
  { id: 38, name: "Single Orchid Stem", price: 129, type: "Single stems" },
  { id: 39, name: "Peace Lily Pot", price: 249, type: "Plants" },
  { id: 40, name: "Anthurium Pot", price: 349, type: "Plants" },
  { id: 41, name: "Rose Plant Pot", price: 199, type: "Plants" },
  { id: 42, name: "Snake Plant Pot", price: 229, type: "Plants" },
  { id: 43, name: "Mixed Flower Basket", price: 699, type: "Gifts" },
  { id: 44, name: "Rose Varmala", price: 549, type: "Gifts" },
  { id: 45, name: "Flower Gift Box", price: 649, type: "Gifts" },
];

// bill(id, qty): the cost of qty flowers of one kind, with the delivery rule.
// qty has a default value, so bill(7) means one flower.
function bill(id, qty = 1) {
  // ids start at 1 but array positions start at 0
  const flower = flowers[id - 1];

  // Stop early with a message when the input is wrong
  if (flower === undefined) {
    return `There is no flower with id ${id}. Use an id from 1 to ${flowers.length}.`;
  } else if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
    return `Quantity must be a whole number from 1 to ${MAX_QTY}.`;
  }

  const subtotal = flower.price * qty;
  let delivery;

  // Delivery is free when the flowers cost Rs 999 or more
  if (subtotal >= FREE_DELIVERY_FROM) {
    delivery = 0;
  } else {
    delivery = DELIVERY_FEE;
  }

  const total = subtotal + delivery;
  const deliveryText = delivery === 0 ? "free delivery" : `Rs ${delivery} delivery`;

  return `${flower.name}: ${qty} x Rs ${flower.price} + ${deliveryText} = Rs ${total}`;
}

// cheapest(): the flower with the lowest price.
const cheapest = () => {
  // Sort a copy (made with spread) so the flowers list keeps its id order
  const byPrice = [...flowers].sort((a, b) => a.price - b.price);
  const { name, price } = byPrice[0];

  return `Cheapest: ${name} at Rs ${price}`;
};

// part(fromId, toId): the flowers with ids fromId to toId.
// slice counts positions from 0, so id 1 is position 0.
const part = (fromId, toId) => flowers.slice(fromId - 1, toId);

// byType(type): every flower of one type, for example byType("Plants").
// The list is in id order, so each type is two runs of ids joined with spread.
function byType(type = "") {
  switch (String(type).toLowerCase()) {
    case "bouquets":
      return [...part(1, 6), ...part(19, 26)];

    case "indian favourites":
    case "indian":
      return [...part(13, 18), ...part(27, 35)];

    case "single stems":
    case "single":
      return [...part(7, 8), ...part(36, 38)];

    case "plants":
      return [...part(9, 11), ...part(39, 42)];

    case "gifts":
      return [...part(12, 12), ...part(43, 45)];

    default:
      return `No type called "${type}". Try one of: ${types.join(", ")}`;
  }
}

// ----- Runs once when the page loads: a welcome and a sample bill -----

console.log("Welcome to the Bloom & Petal price calculator!");
console.log(`${flowers.length} flowers. Delivery Rs ${DELIVERY_FEE}, free from Rs ${FREE_DELIVERY_FROM}.`);
console.log("Sample bill for 4 Single Gerberas, bill(36, 4):");
console.log(bill(36, 4));
console.log('Now try: bill(1, 2)   cheapest()   byType("Plants")   flowers');
