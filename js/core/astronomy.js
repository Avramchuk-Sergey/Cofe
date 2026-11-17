import { DAY_MS, LOCATION } from "../config.js";
import { getMinskParts } from "./time.js";


const rad = Math.PI / 180;
const J0 = 0.0009;

function toJulian(date) {
    return date.valueOf() / DAY_MS -
        0.5 + 2440588;
}

function fromJulian(j) {
    return new Date(
        (j + 0.5 - 2440588) * DAY_MS
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

export function getSunTimes(date) {
    const lw = -LOCATION.longitude * rad;
    const phi = LOCATION.latitude * rad;

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
