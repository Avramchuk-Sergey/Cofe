import { DAY_MS } from "../config.js";
import { getMinskMidnight } from "./time.js";

// Mifflin–St Jeor equation
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

// Daily energy expenditure
export function calculateDailyCalories(profile) {
    return calculateBMR(profile) * 1.2;
}

// Baseline energy expenditure since midnight
export function calculateBaseBurned(dailyCalories, date) {
    const midnight = getMinskMidnight(date);
    const elapsed = date - midnight;

    return dailyCalories * elapsed / DAY_MS;
}

// Current energy balance
export function calculateEnergyBalance(
    dailyCalories,
    eatenCalories,
    extraBurnedCalories,
    date
) {
    const baseBurned = calculateBaseBurned(
        dailyCalories,
        date
    );

    const burnedCalories = baseBurned + extraBurnedCalories;
    const balance = eatenCalories - burnedCalories;

    return {
        baseBurned,
        burnedCalories,
        balance
    };
}