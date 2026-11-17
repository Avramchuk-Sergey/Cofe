import { DAY_MS } from "../config.js";
import { getMinskMidnight } from "../core/time.js";
import { getSunTimes } from "../core/astronomy.js";

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

export function updateSky() {
    const now = getSkyTime();

    const times = getSunTimes(now);
    const midnight = getMinskMidnight(now);

    // Progress through the 24-hour arc
    const progress =
        (now - midnight) / DAY_MS;

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
