import {
    showScreen,
    getCurrentScreen
} from "../navigation.js";

import { updateSky } from "../ui/sky.js";


/* ===== UI ELEMENTS ===== */

const openEntryButton = document.querySelector("#open-entry");
const closeEntryButton = document.querySelector("#close-entry");
const energyForm = document.querySelector("#energy-form");

const entryTitle = document.querySelector("#entry-title");
const entryHint = document.querySelector("#entry-hint");
const entryStatus = document.querySelector("#entry-status");

const descriptionInput = document.querySelector("#energy-description");
const caloriesInput = document.querySelector("#calories");
const entryTypeInputs = document.querySelectorAll('input[name="entry-type"]');

const dateTimeFields = document.querySelector("#entry-datetime");
const dateInput = document.querySelector("#entry-date");
const timeInput = document.querySelector("#entry-time");

const addEnergyButton = document.querySelector("#add-energy");
const deleteEntryButton = document.querySelector("#delete-entry");


/* ===== ENTRY STATE ===== */

let editingEntry = null;
let isBusy = false;

let refreshTodayEntries;
let refreshJournal;


/* ===== DATE AND TIME ===== */

const minskDateTimeFormatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Minsk",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
});


function fillDateTime(timestamp) {
    const parts = Object.fromEntries(
        minskDateTimeFormatter
            .formatToParts(new Date(timestamp))
            .map(part => [part.type, part.value])
    );

    dateInput.value =
        `${parts.year}-${parts.month}-${parts.day}`;

    timeInput.value =
        `${parts.hour}:${parts.minute}:${parts.second}`;
}


function readTimestamp() {
    if (!editingEntry) {
        return Date.now();
    }

    return new Date(
        `${dateInput.value}T${timeInput.value}+03:00`
    ).getTime();
}


/* ===== FORM STATE ===== */

function setBusy(busy) {
    isBusy = busy;
    addEnergyButton.disabled = busy;
    deleteEntryButton.disabled = busy;
    closeEntryButton.disabled = busy;
}


function configureForm(entry = null) {
    energyForm.reset();
    entryStatus.textContent = "";

    editingEntry = entry;

    const isEditing = entry !== null;

    entryTitle.textContent =
        isEditing ? "Edit entry" : "Energy entry";

    addEnergyButton.textContent =
        isEditing ? "Save changes" : "Save entry";

    dateTimeFields.classList.toggle("hidden", !isEditing);
    deleteEntryButton.classList.toggle("hidden", !isEditing);
    entryHint.classList.toggle("hidden", isEditing);

    dateInput.required = isEditing;
    timeInput.required = isEditing;

    if (isEditing) {
        descriptionInput.value = entry.description;
        caloriesInput.value = entry.calories;

        entryTypeInputs.forEach(function(radio) {
            radio.checked = radio.value === entry.type;
        });

        fillDateTime(entry.timestamp);
    }
}


/* ===== OPEN AND CLOSE ===== */

function openNewEntry() {
    if (isBusy) return;

    configureForm();
    showScreen("entry");
    descriptionInput.focus();
}


export function openEditEntry(entry) {
    if (isBusy) return;

    configureForm(entry);
    showScreen("entry");
}


function closeEnergyForm() {
    if (getCurrentScreen() !== "entry") return;

    const returnToJournal = editingEntry !== null;

    editingEntry = null;
    entryStatus.textContent = "";

    if (returnToJournal) {
        showScreen("journal");
        refreshJournal();
    } else {
        showScreen("home");
        updateSky();
    }
}


/* ===== SAVE ENTRY ===== */

async function handleEntrySubmit(event) {
    event.preventDefault();

    if (isBusy) return;

    const description = descriptionInput.value.trim();
    const calories = Number(caloriesInput.value);
    const timestamp = readTimestamp();

    const selectedType = energyForm.querySelector(
        'input[name="entry-type"]:checked'
    );

    if (!description ||
        !Number.isFinite(calories) ||
        calories <= 0 ||
        !selectedType) {

        entryStatus.textContent =
            "Enter a description and positive kcal value.";
        return;
    }

    if (!Number.isFinite(timestamp) || timestamp > Date.now()) {
        entryStatus.textContent = "Enter a valid date and time.";
        return;
    }

    const entry = {
        type: selectedType.value,
        description: description,
        calories: calories,
        timestamp: timestamp
    };

    setBusy(true);
    entryStatus.textContent = "Saving...";

    try {
        if (editingEntry) {
            await updateEntry({
                ...editingEntry,
                ...entry
            });
        } else {
            await saveEntry(entry);
        }

        await refreshTodayEntries();

        closeEnergyForm();

    } catch (error) {
        console.error("Energy entry saving failed:", error);
        entryStatus.textContent = "Could not save entry.";

    } finally {
        setBusy(false);
    }
}


/* ===== DELETE ENTRY ===== */

async function handleEntryDelete() {
    if (!editingEntry || isBusy) return;

    if (!window.confirm("Delete this energy entry?")) {
        return;
    }

    setBusy(true);
    entryStatus.textContent = "Deleting...";

    try {
        await deleteEntry(editingEntry.id);

        await refreshTodayEntries();

        closeEnergyForm();

    } catch (error) {
        console.error("Energy entry deletion failed:", error);
        entryStatus.textContent = "Could not delete entry.";

    } finally {
        setBusy(false);
    }
}


/* ===== INITIALIZATION ===== */

export function initEntry(loadTodayEntries, renderJournal) {

    refreshTodayEntries = loadTodayEntries;
    refreshJournal = renderJournal;

    openEntryButton.addEventListener("click", openNewEntry);

    closeEntryButton.addEventListener("click", function() {
        if (!isBusy) {
            closeEnergyForm();
        }
    });

    energyForm.addEventListener("submit", handleEntrySubmit);

    deleteEntryButton.addEventListener("click", handleEntryDelete);
}