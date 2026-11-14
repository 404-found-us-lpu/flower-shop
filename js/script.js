// Flower Shop Management System - script.js - Made by: Yash (login, next stage) and Satyam (stock page)

// Login page: runs when the Login button is pressed (onsubmit in index.html)
function checkLogin() {
    var email = document.getElementById("email").value.toLowerCase();   // small letters, so Meera@... also works
    if (email == "meera@flowershop.com") { window.location.href = "dashboard-admin.html"; }        // shop owner
    else if (email == "priya@flowershop.com") { window.location.href = "dashboard-staff.html"; }  // florist
    else { window.location.href = "dashboard-customer.html"; }                                     // everybody else
    return false;   // false stops the form from reloading the page
}

// Florist dashboard: writes the next stage in the Status cell of that order
function nextStage(cellId, stage) {
    document.getElementById(cellId).innerHTML = stage;
}

// Stock page: puts the flower's details in the form, so they can be changed and saved
function editFlower(name, type, price, stock) {
    document.getElementById("fname").value = name;
    document.getElementById("ftype").value = type;
    document.getElementById("fprice").value = price;
    document.getElementById("fstock").value = stock;
}

// Stock page: asks first, then removes the flower's row from the table
function deleteFlower(rowId) {
    if (confirm("Delete this flower?")) {
        document.getElementById(rowId).remove();
    }
}
