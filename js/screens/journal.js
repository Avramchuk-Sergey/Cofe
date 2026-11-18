import { showScreen } from "../navigation.js";
import { updateSky } from "../ui/sky.js";

const journalContent = document.querySelector("#journal-content");
const openJournalButton = document.querySelector("#open-journal");
const closeJournalButton = document.querySelector("#close-journal");

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Minsk",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
});

const timeFormatter = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Minsk",
    hour: "2-digit",
    minute: "2-digit"
});


function groupEntriesByDate(entries) {
    const groups = new Map();

    const sortedEntries = [...entries].sort(
        (a, b) => b.timestamp - a.timestamp
    );

    for (const entry of sortedEntries) {
        const date = dateFormatter.format(entry.timestamp);

        if (!groups.has(date)) {
            groups.set(date, []);
        }

        groups.get(date).push(entry);
    }

    return groups;
}


function createEntryElement(entry) {
    const row = document.createElement("div");
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

    return row;
}


async function renderJournal() {
    journalContent.textContent = "Loading...";

    try {
        const entries = await getEntries();
        journalContent.replaceChildren();

        if (entries.length === 0) {
            journalContent.textContent = "No entries yet.";
            return;
        }

        const groups = groupEntriesByDate(entries);

        for (const [date, dayEntries] of groups) {
            const section = document.createElement("section");
            section.className = "journal-day";

            const heading = document.createElement("h3");
            heading.className = "journal-date";
            heading.textContent = date;

            section.append(heading);

            for (const entry of dayEntries) {
                section.append(createEntryElement(entry));
            }

            journalContent.append(section);
        }

    } catch (error) {
        console.error("Journal loading failed:", error);
        journalContent.textContent = "Could not load entries.";
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