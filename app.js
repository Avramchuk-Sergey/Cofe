
/* ===== COFE CONFIGURATION ===== */

let dailyCalories = 2600;
const dayMs = 86400000;

// Minsk: UTC+3, no daylight saving time
const minskOffsetMs = 3 * 60 * 60 * 1000;

// Minsk coordinates
const latitude = 53.9006;
const longitude = 27.5590;


/* ===== ELEMENTS ===== */

const counter = document.querySelector("#counter");
const burnedElement = document.querySelector("#burned");
const eatenElement = document.querySelector("#eaten");
const scaleMarker = document.querySelector("#scale-marker");

const openEntryButton = document.querySelector("#open-entry");
const descriptionInput = document.querySelector("#energy-description");
const entryTypeInputs = document.querySelectorAll('input[name="entry-type"]');
const closeEntryButton = document.querySelector("#close-entry");
const entryStatus = document.querySelector("#entry-status");

const energyForm = document.querySelector("#energy-form");
const caloriesInput = document.querySelector("#calories");
const addEnergyButton = document.querySelector("#add-energy");

const sky = document.querySelector("#sky");
const celestialBody = document.querySelector("#celestial-body");
const scene = document.querySelector(".sky-scene");

const sun = document.querySelector(".sun");
const moon = document.querySelector(".moon");
const stars = document.querySelector("#stars");

const nightLayer = document.querySelector(".sky-night");
const dawnLayer = document.querySelector(".sky-dawn");
const dayLayer = document.querySelector(".sky-day");
const duskLayer = document.querySelector(".sky-dusk");


/* ===== TIME HELPERS ===== */

// Returns calendar components in Minsk time.
// UTC getters are used on a shifted timestamp.
function getMinskParts(date) {
    const shifted = new Date(
        date.getTime() + minskOffsetMs
    );

    return {
        year: shifted.getUTCFullYear(),
        month: shifted.getUTCMonth(),
        day: shifted.getUTCDate(),
        hours: shifted.getUTCHours(),
        minutes: shifted.getUTCMinutes(),
        seconds: shifted.getUTCSeconds()
    };
}

// Midnight in Minsk, expressed as a real timestamp
function getMinskMidnight(date) {
    const p = getMinskParts(date);

    return new Date(
        Date.UTC(p.year, p.month, p.day) -
        minskOffsetMs
    );
}

function getMinskDateKey(date) {
    const p = getMinskParts(date);

    return (
        p.year + "-" +
        String(p.month + 1).padStart(2, "0") + "-" +
        String(p.day).padStart(2, "0")
    );
}

function getMinskMinutes(date) {
    const p = getMinskParts(date);

    return p.hours * 60 + p.minutes;
}

function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return (
        String(hours).padStart(2, "0") +
        ":" +
        String(mins).padStart(2, "0")
    );
}


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

    const now = new Date();
    const midnight = getMinskMidnight(now);

    const elapsed = now - midnight;

    const baseBurned =
        dailyCalories * elapsed / dayMs;

    const burnedCalories =
        baseBurned + extraBurnedCalories;

    const balance =
        eatenCalories - burnedCalories;

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


/* ===== ENERGY INPUT ===== */

function closeEnergyForm() {
    energyForm.classList.add("hidden");
    homeScreen.classList.remove("hidden");

    openEntryButton.setAttribute("aria-expanded", "false");
    entryStatus.textContent = "";

    updateSky();
}

openEntryButton.addEventListener("click", function() {
    homeScreen.classList.add("hidden");
    energyForm.classList.remove("hidden");

    openEntryButton.setAttribute("aria-expanded", "true");

    energyForm.reset();
    inputMode = "in";
    entryStatus.textContent = "";
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

/* ===== ASTRONOMICAL CALCULATIONS ===== */

const rad = Math.PI / 180;
const J0 = 0.0009;

function toJulian(date) {
    return date.valueOf() / dayMs -
        0.5 + 2440588;
}

function fromJulian(j) {
    return new Date(
        (j + 0.5 - 2440588) * dayMs
    );
}

function toDays(date) {
    return toJulian(date) - 2451545;
}

function solarMeanAnomaly(d) {
    return rad * (
        357.5291 + 0.98560028 * d
    );
}

function eclipticLongitude(M) {
    const C = rad * (
        1.9148 * Math.sin(M) +
        0.0200 * Math.sin(2 * M) +
        0.0003 * Math.sin(3 * M)
    );

    return M + C +
        rad * 102.9372 + Math.PI;
}

function declination(L) {
    return Math.asin(
        Math.sin(L) *
        Math.sin(rad * 23.4397)
    );
}

function julianCycle(d, lw) {
    return Math.round(
        d - J0 - lw / (2 * Math.PI)
    );
}

function approxTransit(H, lw, n) {
    return J0 +
        (H + lw) / (2 * Math.PI) + n;
}

function solarTransitJ(ds, M, L) {
    return 2451545 + ds +
        0.0053 * Math.sin(M) -
        0.0069 * Math.sin(2 * L);
}

function hourAngle(h, phi, dec) {
    const value =
        (Math.sin(h) -
        Math.sin(phi) * Math.sin(dec)) /
        (Math.cos(phi) * Math.cos(dec));

    return Math.acos(
        Math.max(-1, Math.min(1, value))
    );
}

function getSunTimes(date) {
    const lw = -longitude * rad;
    const phi = latitude * rad;

    const p = getMinskParts(date);

    // UTC noon for the Minsk calendar date
    const utcNoon = new Date(
        Date.UTC(p.year, p.month, p.day, 12)
    );

    const d = toDays(utcNoon);
    const n = julianCycle(d, lw);
    const ds = approxTransit(0, lw, n);

    const M = solarMeanAnomaly(ds);
    const L = eclipticLongitude(M);
    const dec = declination(L);

    const Jnoon = solarTransitJ(ds, M, L);

    function getPair(angle) {
        const h = angle * rad;
        const w = hourAngle(h, phi, dec);

        const a = approxTransit(w, lw, n);
        const Jset = solarTransitJ(a, M, L);
        const Jrise = Jnoon - (Jset - Jnoon);

        return {
            rise: fromJulian(Jrise),
            set: fromJulian(Jset)
        };
    }

    return {
        sun: getPair(-0.833),
        twilight: getPair(-6)
    };
}


/* ===== DECORATIVE STARS ===== */

for (let i = 0; i < 35; i++) {
    const star = document.createElement("div");

    star.className = "star";

    star.style.left =
        Math.random() * 100 + "%";

    star.style.top =
        Math.random() * 75 + "%";

    star.style.opacity =
        0.3 + Math.random() * 0.7;

    stars.appendChild(star);
}


function getSkyTime() {
    return new Date();
}

/* ===== SKY BACKGROUND ===== */

function setSkyLayers(
    night,
    dawn,
    day,
    dusk
) {
    nightLayer.style.opacity = night;
    dawnLayer.style.opacity = dawn;
    dayLayer.style.opacity = day;
    duskLayer.style.opacity = dusk;
}

// Smooth interpolation helper
function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}

function smoothstep(value) {
    const t = clamp01(value);
    return t * t * (3 - 2 * t);
}

function blend(a, b, value) {
    return a + (b - a) * value;
}


/* ===== SKY ANIMATION ===== */

function updateSky() {
    const now = getSkyTime();

    const times = getSunTimes(now);
    const midnight = getMinskMidnight(now);

    // Progress through the 24-hour arc
    const progress =
        (now - midnight) / dayMs;

    const t = clamp01(progress);

    // Quadratic Bezier curve
    const x = 600 * t;

    const y =
        210 * (1 - t) * (1 - t) +
        (-170) * 2 * (1 - t) * t +
        210 * t * t;

    // Position relative to the visible arc
    const sceneWidth = scene.clientWidth;
    const arcHeight = 230;

    celestialBody.style.left =
        (x / 600 * sceneWidth) + "px";

    celestialBody.style.top =
        (y / 230 * arcHeight) + "px";

    // Astronomical events
    const sunrise = times.sun.rise.getTime();
    const sunset = times.sun.set.getTime();

    const dawn = times.twilight.rise.getTime();
    const dusk = times.twilight.set.getTime();

    const current = now.getTime();

    let sunOpacity = 0;
    let moonOpacity = 0;
    let starsOpacity = 0;

    let night = 0;
    let dawnLayerOpacity = 0;
    let day = 0;
    let duskLayerOpacity = 0;

    // Morning transition
    if (current < dawn) {
        night = 1;
        moonOpacity = 1;
        starsOpacity = 1;

    } else if (current < sunrise) {
        const p = smoothstep(
            (current - dawn) / (sunrise - dawn)
        );

        night = 1 - p;
        dawnLayerOpacity = p;

        moonOpacity = 1 - p * 0.5;
        sunOpacity = p * 0.5;
        starsOpacity = 1 - p;

    } else if (current < sunrise + 3600000) {
        const p = smoothstep(
            (current - sunrise) / 3600000
        );

        dawnLayerOpacity = 1 - p;
        day = p;

        sunOpacity = blend(0.5, 1, p);
        moonOpacity = 0.5 * (1 - p);

    } else if (current < sunset - 3600000) {
        day = 1;
        sunOpacity = 1;

    } else if (current < sunset) {
        const p = smoothstep(
            (current - (sunset - 3600000)) /
            3600000
        );

        day = 1 - p;
        duskLayerOpacity = p;

        sunOpacity = 1 - p * 0.5;
        moonOpacity = p * 0.5;

    } else if (current < dusk) {
        const p = smoothstep(
            (current - sunset) / (dusk - sunset)
        );

        duskLayerOpacity = 1 - p;
        night = p;

        sunOpacity = 0.5 * (1 - p);
        moonOpacity = blend(0.5, 1, p);
        starsOpacity = p;

    } else {
        night = 1;
        moonOpacity = 1;
        starsOpacity = 1;
    }

    setSkyLayers(
        night,
        dawnLayerOpacity,
        day,
        duskLayerOpacity
    );

    sun.style.opacity = sunOpacity;
    moon.style.opacity = moonOpacity;
    stars.style.opacity = starsOpacity;

    // Text adapts to the sky brightness
    const lightSky =
        day + dawnLayerOpacity * 0.7 +
        duskLayerOpacity * 0.4;

    const textColor =
        lightSky > 0.5 ? "#2f2f2f" : "#ffffff";

    document.body.style.color = textColor;

}


/* ===== INITIALIZATION ===== */

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


/* ===== MAIN MENU ===== */

const menuButton = document.querySelector("#menu-button");
const mainMenu = document.querySelector("#main-menu");

menuButton.addEventListener("click", function() {
    const isHidden = mainMenu.classList.toggle("hidden");

    menuButton.setAttribute(
        "aria-expanded",
        String(!isHidden)
    );
});

document.addEventListener("click", function(event) {
    if (!event.target.closest(".header")) {
        mainMenu.classList.add("hidden");
        menuButton.setAttribute("aria-expanded", "false");
    }
});


/* ===== SCREEN NAVIGATION ===== */

const homeScreen = document.querySelector("#home-screen");
const profileScreen = document.querySelector("#profile-screen");

const openProfileButton =
    document.querySelector("#open-profile");

const closeProfileButton =
    document.querySelector("#close-profile");


openProfileButton.addEventListener("click", async function() {
    homeScreen.classList.add("hidden");
    profileScreen.classList.remove("hidden");

    mainMenu.classList.add("hidden");
    menuButton.setAttribute("aria-expanded", "false");

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
    profileScreen.classList.add("hidden");
    homeScreen.classList.remove("hidden");
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


/* ===== BASAL METABOLIC RATE ===== */

function calculateBMR(profile) {
    const today = new Date();
    const birth = new Date(profile.birthDate + "T00:00:00");

    let age = today.getFullYear() - birth.getFullYear();

    const birthdayPassed =
        today.getMonth() > birth.getMonth() ||
        (
            today.getMonth() === birth.getMonth() &&
            today.getDate() >= birth.getDate()
        );

    if (!birthdayPassed) {
        age--;
    }

    const sexConstant = profile.sex === "male" ? 5 : -161;

    return (
        10 * profile.weight +
        6.25 * profile.height -
        5 * age +
        sexConstant
    );
}


/* ===== DAILY ENERGY EXPENDITURE ===== */

function calculateDailyCalories(profile) {
    // Fixed sedentary baseline. Extra activity is entered manually as OUT.
    return calculateBMR(profile) * 1.2;
}


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





