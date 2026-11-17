import { LOCATION } from "../config.js";

// Returns calendar components in Minsk time.
export function getMinskParts(date) {
    const shifted = new Date(
        date.getTime() + LOCATION.utcOffsetMs
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

// Returns midnight in Minsk as a real timestamp.
export function getMinskMidnight(date) {
    const { year, month, day } = getMinskParts(date);

    return new Date(
        Date.UTC(year, month, day) -
        LOCATION.utcOffsetMs
    );
}

// Returns a calendar date in YYYY-MM-DD format.
export function getMinskDateKey(date) {
    const { year, month, day } = getMinskParts(date);

    return (
        year + "-" +
        String(month + 1).padStart(2, "0") + "-" +
        String(day).padStart(2, "0")
    );
}