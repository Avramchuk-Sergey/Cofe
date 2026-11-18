/* ===== SCREENS ===== */

const screens = {
    home: document.querySelector("#home-screen"),
    entry: document.querySelector("#energy-form"),
    profile: document.querySelector("#profile-screen"),
	journal: document.querySelector("#journal-screen")
};

const openEntryButton = document.querySelector("#open-entry");

/* ===== MAIN MENU ===== */

const menuButton = document.querySelector("#menu-button");
const mainMenu = document.querySelector("#main-menu");

function setMenuOpen(isOpen) {
    mainMenu.classList.toggle("hidden", !isOpen);

    menuButton.setAttribute(
        "aria-expanded",
        String(isOpen)
    );
}

menuButton.addEventListener("click", function() {
    setMenuOpen(mainMenu.classList.contains("hidden"));
});

document.addEventListener("click", function(event) {
    if (!event.target.closest(".header")) {
        setMenuOpen(false);
    }
});

/* ===== SCREEN NAVIGATION ===== */

let currentScreen = "home";

export function getCurrentScreen() {
    return currentScreen;
}

export function showScreen(screenName) {
    if (!Object.hasOwn(screens, screenName)) {
        throw new Error("Unknown screen: " + screenName);
    }

    for (const [name, element] of Object.entries(screens)) {
        element.classList.toggle(
            "hidden",
            name !== screenName
        );
    }

    currentScreen = screenName;

    openEntryButton.setAttribute(
        "aria-expanded",
        String(screenName === "entry")
    );

    setMenuOpen(false);
}