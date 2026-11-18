import { DAY_MS } from "../config.js";

import {
    getMinskMidnight,
    getMinskDateKey
} from "./time.js";

import { calculateDailyCalories } from "./energy.js";


/* ===== LOAD ENERGY HISTORY ===== */

export async function loadEnergyHistory() {

    const [profile, weightHistory, entries] =
        await Promise.all([
            getProfile(),
            getWeightHistory(),
            getEntries()
        ]);

    if (!profile || !Number.isFinite(profile.createdAt)) {
        return [];
    }

    const now = Date.now();

    const startDay = getMinskMidnight(
        new Date(profile.createdAt)
    ).getTime();

    const weights = weightHistory
        .filter(record =>
            record.timestamp >= profile.createdAt &&
            record.timestamp <= now
        )
        .sort((a, b) => a.timestamp - b.timestamp);

    const entriesByDate = new Map();

    for (const entry of entries) {

        if (entry.timestamp < profile.createdAt ||
            entry.timestamp > now) continue;

        const dateKey = getMinskDateKey(
            new Date(entry.timestamp)
        );

        if (!entriesByDate.has(dateKey)) {
            entriesByDate.set(dateKey, []);
        }

        entriesByDate.get(dateKey).push(entry);
    }

    const history = [];

    let weightIndex = 0;
    let weight = weights[0]?.weight ?? profile.weight;

    for (
        let day = startDay;
        day <= now;
        day += DAY_MS
    ) {

        const date = new Date(day);
        const dateKey = getMinskDateKey(date);
        const dayEnd = Math.min(day + DAY_MS, now);

        while (
            weightIndex < weights.length &&
            weights[weightIndex].timestamp <= dayEnd
        ) {
            weight = weights[weightIndex].weight;
            weightIndex++;
        }

        const dailyCalories = calculateDailyCalories(
            { ...profile, weight },
            date
        );

        const elapsed = dayEnd - day;

        const baseBurned =
            dailyCalories * elapsed / DAY_MS;

        const dayEntries = entriesByDate.get(dateKey) || [];

        let eaten = 0;
        let extraBurned = 0;

        for (const entry of dayEntries) {

            const calories = Number(entry.calories);

            if (!Number.isFinite(calories) ||
                calories <= 0) continue;

            if (entry.type === "in") {
                eaten += calories;
            }

            if (entry.type === "out") {
                extraBurned += calories;
            }
        }

        history.push({
            date: dateKey,
            weight,
            baseBurned,
            eaten,
            extraBurned,
            balance: eaten - baseBurned - extraBurned,
            entries: dayEntries
        });
    }

    return history.reverse();
}