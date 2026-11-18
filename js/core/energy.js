import { DAY_MS } from "../config.js";
import {
    getMinskMidnight,
    getMinskParts
} from "./time.js";

// Mifflin–St Jeor equation
// Mifflin–St Jeor equation
function calculateBMR(profile, date) {
    const { year, month, day } = getMinskParts(date);

    const [birthYear, birthMonth, birthDay] =
        profile.birthDate.split("-").map(Number);

    let age = year - birthYear;

    const birthdayPassed =
        month + 1 > birthMonth ||
        (
            month + 1 === birthMonth &&
            day >= birthDay
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
export function calculateDailyCalories(profile, date = new Date()) {
    return calculateBMR(profile, date) * 1.2;
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