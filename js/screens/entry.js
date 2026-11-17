import {
    showScreen,
    getCurrentScreen
} from "../navigation.js";

import { updateSky } from "../ui/sky.js";


const openEntryButton = document.querySelector("#open-entry");
const descriptionInput = document.querySelector("#energy-description");
const entryTypeInputs = document.querySelectorAll('input[name="entry-type"]');
const closeEntryButton = document.querySelector("#close-entry");
const entryStatus = document.querySelector("#entry-status");
const energyForm = document.querySelector("#energy-form");
const caloriesInput = document.querySelector("#calories");
const addEnergyButton = document.querySelector("#add-energy");


let inputMode = "in";


function closeEnergyForm() {
    entryStatus.textContent = "";

    if (getCurrentScreen() === "entry") {
        showScreen("home");
        updateSky();
    }
}


export function initEntry(loadTodayEntries) {

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
}