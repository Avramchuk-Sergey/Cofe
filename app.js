/* ===== IMPORTS ===== */

import {
    DEFAULT_DAILY_CALORIES
} from "./js/config.js";

import {
    getMinskDateKey
} from "./js/core/time.js";

import {
    calculateDailyCalories,
    calculateEnergyBalance
} from "./js/core/energy.js";

import {
    initHome,
    updateHomeCounter
} from "./js/screens/home.js";

import {
    showScreen
} from "./js/navigation.js";

import { initEntry }
from "./js/screens/entry.js";

import { initProfile }
from "./js/screens/profile.js";


/* ===== COFE CONFIGURATION ===== */

let dailyCalories = DEFAULT_DAILY_CALORIES;


/* ===== ENERGY DATA ===== */

// Current daily energy totals loaded from IndexedDB.

let eatenCalories = 0;
let extraBurnedCalories = 0;
let entriesLoadToken = 0;
let energyDataReady = false;

let activeDateKey = getMinskDateKey(new Date());

function checkNewDay() {
    const today = getMinskDateKey(new Date());

    if (today !== activeDateKey) {
        activeDateKey = today;
        eatenCalories = 0;
        extraBurnedCalories = 0;
        loadTodayEntries();
    }
}


/* ===== ENERGY COUNTER ===== */

function updateCounter() {

    if (!energyDataReady) return;

    checkNewDay();

    const { burnedCalories, balance } =
        calculateEnergyBalance(
            dailyCalories,
            eatenCalories,
            extraBurnedCalories,
            new Date()
        );

    updateHomeCounter(
        balance,
        burnedCalories,
        eatenCalories
    );
}


async function loadTodayEntries() {
    const token = ++entriesLoadToken;
    const dateKey = getMinskDateKey(new Date());
    try {
        const entries = await getEntries();
        if (token !== entriesLoadToken || dateKey !== activeDateKey) return;
        let eaten = 0;
        let extraBurned = 0;
        for (const entry of entries) {
            if (getMinskDateKey(new Date(entry.timestamp)) !== dateKey) continue;
            const value = Number(entry.calories);
            if (!Number.isFinite(value) || value <= 0) continue;
            if (entry.type === "in") eaten += value;
            if (entry.type === "out") extraBurned += value;
        }
        eatenCalories = eaten;
        extraBurnedCalories = extraBurned;
        updateCounter();
    } catch (error) {
        console.error("Energy entries loading failed:", error);
    }
}

/* ===== INITIALIZATION ===== */

showScreen("home");
initHome(updateCounter);
initEntry(loadTodayEntries);

initProfile(function(profile) {
    dailyCalories = calculateDailyCalories(profile);
    updateCounter();
});


/* ===== LOAD DAILY ENERGY EXPENDITURE ===== */

async function loadDailyCalories() {
    try {
        const profile = await getProfile();

        if (profile) {
            dailyCalories = calculateDailyCalories(profile);
            updateCounter();
        }
    } catch (error) {
        console.error("Daily calories loading failed:", error);
    }
}

Promise.all([loadDailyCalories(), loadTodayEntries()]).then(() => {
    energyDataReady = true;
    updateCounter();
});


if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("./service-worker.js")
            .then(() => {
                console.log("Cofe Service Worker registered");
            })
            .catch((error) => {
                console.error("Service Worker registration failed:", error);
            });
    });
}





