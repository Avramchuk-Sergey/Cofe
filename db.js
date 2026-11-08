
/* ===== COFE DATABASE ===== */

const DB_NAME = "CofeDB";
const DB_VERSION = 2;

function openDatabase() {
    return new Promise((resolve, reject) => {

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = function(event) {
            const db = event.target.result;

            if (!db.objectStoreNames.contains("profile")) {
                db.createObjectStore("profile", {
                    keyPath: "id"
                });
            }

            if (!db.objectStoreNames.contains("entries")) {
                db.createObjectStore("entries", {
                    keyPath: "id",
                    autoIncrement: true
                });
            }
			
			if (!db.objectStoreNames.contains("weightHistory")) {
                db.createObjectStore("weightHistory", {
                    keyPath: "id",
                    autoIncrement: true
                });
            }

        };

        request.onsuccess = function(event) {
            resolve(event.target.result);
        };

        request.onerror = function(event) {
            reject(event.target.error);
        };
    });
}


/* ===== SAVE PROFILE ===== */

async function saveProfile(profile) {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        // Both stores are read in one transaction so legacy profiles can
        // inherit their earliest weight timestamp as the start date.
        const transaction = db.transaction(
            ["profile", "weightHistory"], "readwrite"
        );
        const store = transaction.objectStore("profile");
        const existingRequest = store.get(1);

        existingRequest.onsuccess = function() {
            const existing = existingRequest.result;
            if (existing && Number.isFinite(existing.createdAt)) {
                store.put({ ...profile, id: 1, createdAt: existing.createdAt });
                return;
            }

            // For an older profile, the first weight record normally dates
            // from the first profile save. If unavailable, use today.
            const weightRequest = transaction.objectStore("weightHistory")
                .openCursor();
            weightRequest.onsuccess = function() {
                const first = weightRequest.result?.value;
                const createdAt = first && Number.isFinite(first.timestamp)
                    ? first.timestamp : Date.now();
                store.put({ ...profile, id: 1, createdAt });
            };
        };

        transaction.oncomplete = function() {
            db.close();
            resolve();
        };
        transaction.onerror = function() {
            db.close();
            reject(transaction.error);
        };
        transaction.onabort = function() {
            db.close();
            reject(transaction.error);
        };
    });
}


/* ===== GET PROFILE ===== */

async function getProfile() {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            "profile",
            "readonly"
        );

        const store = transaction.objectStore("profile");
        const request = store.get(1);

        request.onsuccess = function() {
            resolve(request.result || null);
        };

        transaction.oncomplete = function() {
            db.close();
        };

        transaction.onerror = function() {
            db.close();
            reject(transaction.error);
        };
    });
}


/* ===== SAVE WEIGHT ===== */

async function saveWeight(weight) {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction("weightHistory", "readwrite");
        const store = transaction.objectStore("weightHistory");

        const record = {
            weight: weight,
            timestamp: Date.now()
        };

        store.add(record);

        transaction.oncomplete = function() {
            db.close();
            resolve();
        };

        transaction.onerror = function() {
            db.close();
            reject(transaction.error);
        };
    });
}


/* ===== SAVE ENERGY ENTRY ===== */

async function saveEntry(entry) {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction("entries", "readwrite");
        const store = transaction.objectStore("entries");

        store.add(entry);

        transaction.oncomplete = function() {
            db.close();
            resolve();
        };

        transaction.onerror = function() {
            db.close();
            reject(transaction.error);
        };
    });
}


/* ===== READ ENERGY ENTRIES ===== */

async function getEntries() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("entries", "readonly");
        const request = transaction.objectStore("entries").getAll();
        let records = [];
        request.onsuccess = function() { records = request.result; };
        transaction.oncomplete = function() { db.close(); resolve(records); };
        transaction.onerror = function() { db.close(); reject(transaction.error); };
    });
}
