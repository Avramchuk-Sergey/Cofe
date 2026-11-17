/* ===== ELEMENTS ===== */

const counter = document.querySelector("#counter");
const burnedElement = document.querySelector("#burned");
const eatenElement = document.querySelector("#eaten");
const scaleMarker = document.querySelector("#scale-marker");

/* ===== ENERGY COUNTER RENDERING ===== */

export function renderCounter(balance, burnedCalories, eatenCalories) {

    // Main balance
    counter.textContent =
        (balance > 0 ? "+" : "") +
        balance.toFixed(3);

    // Energy OUT
    burnedElement.textContent =
        "−" + burnedCalories.toFixed(1);

    // Energy IN
    eatenElement.textContent =
        eatenCalories.toFixed(1);

    // Main counter color
    counter.style.color =
        balance < 0 ? "#c64b4b" :
        balance > 0 ? "#36845b" :
        "#777777";

    // Energy scale marker
    const markerPosition =
        50 + balance / 1500 * 50;

    const limitedPosition =
        Math.max(2, Math.min(98, markerPosition));

    scaleMarker.style.left =
        limitedPosition + "%";
}