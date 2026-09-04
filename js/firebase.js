// firebase.js
// Central Firebase configuration for Model ERP
// Firebase Modular SDK
// New Firebase Project + New Admin Authentication

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    getDatabase,
    ref,
    get,
    set,
    push,
    update,
    remove
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";

import {
    getAnalytics
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-analytics.js";


// ============================================================
// FIREBASE CONFIGURATION
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyCbD7nHFYAKJHVe9eV_JL1A0qHQw",
    authDomain: "modelerp-c7ff7.firebaseapp.com",
    databaseURL: "https://modelerp-c7ff7-default-rtdb.firebaseio.com",
    projectId: "modelerp-c7ff7",
    storageBucket: "modelerp-c7ff7.firebasestorage.app",
    messagingSenderId: "808804437563",
    appId: "1:808804437563:web:37083674d5b6acdbe8161e",
    measurementId: "G-KT82WYLM0J"
};


// ============================================================
// ADMIN AUTHENTICATION UID
// ============================================================

const ADMIN_USER_UID = "089prHaZ5shgPvvaMsl1dgMe6Yx1";


// ============================================================
// INITIALIZE FIREBASE APP
// ============================================================

const app = getApps().length
    ? getApp()
    : initializeApp(firebaseConfig);


// ============================================================
// FIREBASE SERVICES
// ============================================================

const auth = getAuth(app);
const db = getDatabase(app);

let analytics = null;

try {
    analytics = getAnalytics(app);
} catch (error) {
    console.warn("Firebase Analytics unavailable:", error);
}


// ============================================================
// AUTHENTICATION
// ============================================================

let currentUser = null;

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        currentUser = null;
        return;
    }

    // Only the configured Admin UID is allowed
    if (user.uid !== ADMIN_USER_UID) {

        currentUser = null;

        try {
            await signOut(auth);
        } catch (error) {
            console.error("Unauthorized logout error:", error);
        }

        console.warn("Unauthorized Firebase user blocked.");
        return;
    }

    currentUser = user;
});


// ============================================================
// LOGIN
// ============================================================

async function loginAdmin(email, password) {

    const credential = await signInWithEmailAndPassword(
        auth,
        email,
        password
    );

    const user = credential.user;

    if (user.uid !== ADMIN_USER_UID) {

        await signOut(auth);

        throw new Error(
            "Unauthorized account. Only the configured administrator can access this ERP."
        );
    }

    currentUser = user;

    return user;
}


// ============================================================
// CURRENT ADMIN
// ============================================================

function getCurrentUser() {

    const user = auth.currentUser;

    if (!user) {
        return null;
    }

    if (user.uid !== ADMIN_USER_UID) {
        return null;
    }

    return user;
}


// ============================================================
// ADMIN AUTH CHECK
// ============================================================

function isAdminAuthenticated() {

    const user = auth.currentUser;

    return !!(
        user &&
        user.uid === ADMIN_USER_UID
    );
}


// ============================================================
// WAIT FOR AUTH STATE
// ============================================================

function waitForAuth(timeout = 10000) {

    return new Promise((resolve) => {

        if (auth.currentUser) {

            if (auth.currentUser.uid === ADMIN_USER_UID) {
                resolve(auth.currentUser);
            } else {
                resolve(null);
            }

            return;
        }

        let resolved = false;

        const unsubscribe = onAuthStateChanged(auth, (user) => {

            if (resolved) return;

            resolved = true;
            unsubscribe();

            if (user && user.uid === ADMIN_USER_UID) {
                resolve(user);
            } else {
                resolve(null);
            }
        });

        setTimeout(() => {

            if (resolved) return;

            resolved = true;
            unsubscribe();
            resolve(null);

        }, timeout);
    });
}


// ============================================================
// PAGE PROTECTION
// ============================================================

async function protectAdminPage(loginPage = "login.html") {

    const user = await waitForAuth();

    if (!user) {

        if (
            !window.location.pathname.endsWith(loginPage)
        ) {
            window.location.href = loginPage;
        }

        return false;
    }

    return true;
}


// ============================================================
// LOGOUT
// ============================================================

async function logoutAdmin() {

    try {

        await signOut(auth);

        currentUser = null;

        window.location.href = "login.html";

    } catch (error) {

        console.error("Logout failed:", error);

        throw error;
    }
}


// ============================================================
// PASSWORD RESET
// ============================================================

async function sendPasswordReset(email) {

    if (!email) {
        throw new Error("Email address is required.");
    }

    return await sendPasswordResetEmail(
        auth,
        email
    );
}


// ============================================================
// REALTIME DATABASE
// ============================================================

async function getAllData(path) {

    const snapshot = await get(
        ref(db, path)
    );

    if (!snapshot.exists()) {
        return [];
    }

    const data = snapshot.val();

    if (
        typeof data === "object" &&
        data !== null &&
        !Array.isArray(data)
    ) {

        return Object.entries(data).map(
            ([id, value]) => ({
                id,
                ...value
            })
        );
    }

    return data;
}


// ============================================================
// GET ONE RECORD
// ============================================================

async function getOneData(path, id) {

    const snapshot = await get(
        ref(db, `${path}/${id}`)
    );

    if (!snapshot.exists()) {
        return null;
    }

    return {
        id,
        ...snapshot.val()
    };
}


// ============================================================
// CREATE RECORD
// ============================================================

async function createData(path, data) {

    const newRef = push(
        ref(db, path)
    );

    await set(
        newRef,
        data
    );

    return {
        id: newRef.key,
        ...data
    };
}


// ============================================================
// SET RECORD WITH SPECIFIC ID
// ============================================================

async function setData(path, id, data) {

    await set(
        ref(db, `${path}/${id}`),
        data
    );

    return {
        id,
        ...data
    };
}


// ============================================================
// UPDATE RECORD
// ============================================================

async function updateData(path, id, data) {

    await update(
        ref(db, `${path}/${id}`),
        data
    );

    return {
        id,
        ...data
    };
}


// ============================================================
// DELETE RECORD
// ============================================================

async function deleteData(path, id) {

    await remove(
        ref(db, `${path}/${id}`)
    );

    return true;
}


// ============================================================
// ACADEMIC YEAR
// ============================================================

function getAcademicYear() {

    const currentYear = new Date().getFullYear();

    return `${currentYear}-${currentYear + 1}`;
}


// ============================================================
// EXPORTS
// ============================================================

export {
    app,
    auth,
    db,
    analytics,

    ADMIN_USER_UID,

    loginAdmin,
    getCurrentUser,
    isAdminAuthenticated,
    waitForAuth,
    protectAdminPage,
    logoutAdmin,
    sendPasswordReset,

    getAllData,
    getOneData,
    createData,
    setData,
    updateData,
    deleteData,

    getAcademicYear
};


// ============================================================
// GLOBAL ACCESS
// ============================================================

window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDB = db;
window.firebaseAnalytics = analytics;

window.ADMIN_USER_UID = ADMIN_USER_UID;

window.loginAdmin = loginAdmin;
window.getCurrentUser = getCurrentUser;
window.isAdminAuthenticated = isAdminAuthenticated;
window.waitForAuth = waitForAuth;
window.protectAdminPage = protectAdminPage;
window.logoutAdmin = logoutAdmin;
window.sendPasswordReset = sendPasswordReset;

window.getAllData = getAllData;
window.getOneData = getOneData;
window.createData = createData;
window.setData = setData;
window.updateData = updateData;
window.deleteData = deleteData;

window.getAcademicYear = getAcademicYear;
