import { showScreen } from "../navigation.js";
import { updateSky } from "../ui/sky.js";
import { loadEnergyHistory } from "../core/history.js";

const openStatisticsButton =
    document.querySelector("#open-statistics");

const closeStatisticsButton =
    document.querySelector("#close-statistics");

const totalBalanceElement =
    document.querySelector("#total-energy-balance");


/* ===== RENDER STATISTICS ===== */

async function renderStatistics() {

    totalBalanceElement.textContent = "—";
    totalBalanceElement.classList.remove("positive", "negative");

    try {
        const history = await loadEnergyHistory();

        if (history.length === 0) return;

        const totalBalance = history.reduce(
            (total, day) => total + day.balance,
            0
        );

        const roundedBalance = Math.round(totalBalance);

        totalBalanceElement.textContent =
            roundedBalance > 0
                ? "+" + roundedBalance
                : String(roundedBalance);

        if (roundedBalance > 0) {
            totalBalanceElement.classList.add("positive");
        } else if (roundedBalance < 0) {
            totalBalanceElement.classList.add("negative");
        }

    } catch (error) {
        console.error("Statistics loading failed:", error);
        totalBalanceElement.textContent = "Error";
    }
}


/* ===== INITIALIZATION ===== */

export function initStatistics() {

    openStatisticsButton.addEventListener("click", function() {
        showScreen("statistics");
        renderStatistics();
    });

    closeStatisticsButton.addEventListener("click", function() {
        showScreen("home");
        updateSky();
    });
}