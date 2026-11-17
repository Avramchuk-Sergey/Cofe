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

import { updateSky } 
from "./js/ui/sky.js";

import { renderCounter } 
from "./js/ui/counter.js";

import {
    showScreen,
    getCurrentScreen
} from "./js/navigation.js";


/* ===== COFE CONFIGURATION ===== */

let dailyCalories = DEFAULT_DAILY_CALORIES;

/* ===== ELEMENTS ===== */

const openEntryButton = document.querySelector("#open-entry");
const descriptionInput = document.querySelector("#energy-description");
const entryTypeInputs = document.querySelectorAll('input[name="entry-type"]');
const closeEntryButton = document.querySelector("#close-entry");
const entryStatus = document.querySelector("#entry-status");

const energyForm = document.querySelector("#energy-form");
const caloriesInput = document.querySelector("#calories");
const addEnergyButton = document.querySelector("#add-energy");




/* ===== ENERGY DATA ===== */

// Temporary in-memory data for the prototype.
// Persistent journal will be added later.

let eatenCalories = 0;
let extraBurnedCalories = 0;
let inputMode = "in";
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

    renderCounter(
        balance,
        burnedCalories,
        eatenCalories
    );
}


/* ===== ENERGY INPUT ===== */

function closeEnergyForm() {
    entryStatus.textContent = "";

    if (getCurrentScreen() === "entry") {
        showScreen("home");
        updateSky();
    }
}

openEntryButton.addEventListener("click", function() {
    energyForm.reset();
    inputMode = "in";
    entryStatus.textContent = "";

    showScreen("entry");

    descriptionInput.focus();
});

closeEntryButton.addEventListener("click", closeEnergyForm);


entryTypeInputs.forEach(function(radio) {
    radio.addEventListener("change", function() {
        if (radio.checked) inputMode = radio.value;
    });
});

energyForm.addEventListener("submit", async function(event) {
    event.preventDefault();
    const description = descriptionInput.value.trim();
    const calories = Number(caloriesInput.value);
    if (!description || !Number.isFinite(calories) || calories <= 0) {
        entryStatus.textContent = "Enter a description and positive kcal value.";
        return;
    }

    addEnergyButton.disabled = true;
    entryStatus.textContent = "Saving...";
    try {
        await saveEntry({
            type: inputMode,
            description: description,
            calories: calories,
            timestamp: Date.now()
        });
        await loadTodayEntries();
        closeEnergyForm();
    } catch (error) {
        console.error("Energy entry saving failed:", error);
        entryStatus.textContent = "Could not save entry.";
    } finally {
        addEnergyButton.disabled = false;
    }
});

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

updateCounter();
updateSky();

// Live energy balance
setInterval(updateCounter, 1000);

// Astronomical sky
setInterval(updateSky, 60000);

// Refresh after returning to the browser tab
document.addEventListener(
    "visibilitychange",
    function() {
        if (!document.hidden) {
            updateCounter();
            updateSky();
        }
    }
);

// Keep celestial position aligned after resizing
window.addEventListener("resize", updateSky);

/* ===== SCREEN NAVIGATION ===== */


const openProfileButton =
    document.querySelector("#open-profile");

const closeProfileButton =
    document.querySelector("#close-profile");


openProfileButton.addEventListener("click", async function() {
    showScreen("profile");

    try {
        const profile = await getProfile();

        if (profile) {
            document.querySelector("#profile-sex").value =
                profile.sex;

            document.querySelector("#profile-birth").value =
                profile.birthDate;

            document.querySelector("#profile-height").value =
                profile.height;

            document.querySelector("#profile-weight").value =
                profile.weight;


        }
    } catch (error) {
        console.error("Profile loading failed:", error);
    }
});


closeProfileButton.addEventListener("click", function() {
    showScreen("home");
    updateSky();
});


/* ===== PROFILE SAVE ===== */

const profileForm = document.querySelector("#profile-form");

profileForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const profile = {
        sex: document.querySelector("#profile-sex").value,
        birthDate: document.querySelector("#profile-birth").value,
        height: Number(
            document.querySelector("#profile-height").value
        ),
        weight: Number(
            document.querySelector("#profile-weight").value
        )
    };
	
	
try {
    const oldProfile = await getProfile();

    if (!oldProfile || Number(oldProfile.weight) !== profile.weight) {
        await saveWeight(profile.weight);
    }

    await saveProfile(profile);
	
	dailyCalories = calculateDailyCalories(profile);
    updateCounter();

    alert("Profile saved successfully!");
} catch (error) {
    console.error("Profile saving failed:", error);
    alert("Failed to save profile.");
}

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





