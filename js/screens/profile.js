import { showScreen } from "../navigation.js";
import { updateSky } from "../ui/sky.js";
import { calculateDailyCalories } from "../core/energy.js";


const openProfileButton = document.querySelector("#open-profile");
const closeProfileButton = document.querySelector("#close-profile");

const profileForm = document.querySelector("#profile-form");

const sexInput = document.querySelector("#profile-sex");
const birthInput = document.querySelector("#profile-birth");
const heightInput = document.querySelector("#profile-height");
const weightInput = document.querySelector("#profile-weight");
const dailyCaloriesElement = document.querySelector("#profile-daily-calories");


function updateDailyCaloriesDisplay(profile) {
    const dailyCalories = calculateDailyCalories(profile);

    dailyCaloriesElement.textContent =
        dailyCalories.toFixed(0);
}


export function initProfile(onProfileSaved) {

    openProfileButton.addEventListener("click", async function() {
        showScreen("profile");

        try {
            const profile = await getProfile();

            if (profile) {
                sexInput.value = profile.sex;
                birthInput.value = profile.birthDate;
                heightInput.value = profile.height;
                weightInput.value = profile.weight;
				updateDailyCaloriesDisplay(profile);
            }

        } catch (error) {
            console.error("Profile loading failed:", error);
        }
    });


    closeProfileButton.addEventListener("click", function() {
        showScreen("home");
        updateSky();
    });


    profileForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const profile = {
            sex: sexInput.value,
            birthDate: birthInput.value,
            height: Number(heightInput.value),
            weight: Number(weightInput.value)
        };

        try {
            const oldProfile = await getProfile();

            if (!oldProfile || Number(oldProfile.weight) !== profile.weight) {
                await saveWeight(profile.weight);
            }

            await saveProfile(profile);

            onProfileSaved(profile);
			updateDailyCaloriesDisplay(profile);

            alert("Profile saved successfully!");

        } catch (error) {
            console.error("Profile saving failed:", error);
            alert("Failed to save profile.");
        }
    });
}