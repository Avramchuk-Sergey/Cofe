import { updateSky } from "../ui/sky.js";
import { renderCounter } from "../ui/counter.js";

export function updateHomeCounter(balance, burnedCalories, eatenCalories) {
    renderCounter(
        balance,
        burnedCalories,
        eatenCalories
    );
}

export function initHome(updateCounter) {

    updateCounter();
    updateSky();

    // Live energy balance
    setInterval(updateCounter, 1000);

    // Astronomical sky
    setInterval(updateSky, 60000);

    // Refresh after returning to the browser tab
    document.addEventListener("visibilitychange", function() {
        if (!document.hidden) {
            updateCounter();
            updateSky();
        }
    });

    // Keep celestial position aligned after resizing
    window.addEventListener("resize", updateSky);
}