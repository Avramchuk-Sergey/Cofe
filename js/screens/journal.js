import { showScreen } from "../navigation.js";
import { updateSky } from "../ui/sky.js";
import { openEditEntry } from "./entry.js";
import { loadEnergyHistory } from "../core/history.js";

const journalContent = document.querySelector("#journal-content");
const openJournalButton = document.querySelector("#open-journal");
const closeJournalButton = document.querySelector("#close-journal");

const timeFormatter = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Minsk",
    hour: "2-digit",
    minute: "2-digit"
});



function createEntryElement(entry) {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "journal-entry";

    const time = document.createElement("span");
    time.className = "journal-time";
    time.textContent = timeFormatter.format(entry.timestamp);

    const description = document.createElement("span");
    description.className = "journal-description";
    description.textContent = entry.description;

    const calories = document.createElement("span");
    calories.className = "journal-calories";

    const isIncome = entry.type === "in";

    calories.classList.add(isIncome ? "in" : "out");
    calories.textContent =
        (isIncome ? "+" : "−") + entry.calories;

    row.append(time, description, calories);
	
	row.addEventListener("click", function() {
    openEditEntry(entry);
    });

    return row;
}


export async function renderJournal() {
    journalContent.textContent = "Loading...";

    try {
        const history = await loadEnergyHistory();

        journalContent.replaceChildren();

        if (history.length === 0) {
            journalContent.textContent = "No history yet.";
            return;
        }

        for (const day of history) {

            const section = document.createElement("section");
            section.className = "journal-day";

            const heading = document.createElement("h3");
            heading.className = "journal-date";

            const date = document.createElement("span");
            date.textContent = day.date.split("-").reverse().join(".");

            const balance = document.createElement("span");
            balance.className = "journal-balance";

            const roundedBalance = Math.round(day.balance);

            balance.textContent =
                roundedBalance > 0
                    ? "+" + roundedBalance
                    : String(roundedBalance);

            if (roundedBalance > 0) {
                balance.classList.add("positive");
            } else if (roundedBalance < 0) {
                balance.classList.add("negative");
            }

            heading.append(date, balance);
            section.append(heading);

            const sortedEntries = [...day.entries].sort(
                (a, b) => b.timestamp - a.timestamp
            );

            for (const entry of sortedEntries) {
                section.append(createEntryElement(entry));
            }

            journalContent.append(section);
        }

    } catch (error) {
        console.error("Journal loading failed:", error);
        journalContent.textContent = "Could not load history.";
    }
}


export function initJournal() {
    openJournalButton.addEventListener("click", function() {
        showScreen("journal");
        renderJournal();
    });

    closeJournalButton.addEventListener("click", function() {
        showScreen("home");
        updateSky();
    });
}