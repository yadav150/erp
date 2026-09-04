// app.js
// Model ERP — Application Core
// New Firebase SDK + New Authentication
// Admin-only ERP access

import {
    initializeApp,
    getApps,
    getApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";


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
// ADMIN UID
// ============================================================

const ADMIN_USER_UID = "089prHaZ5shgPvvaMsl1dgMe6Yx1";


// ============================================================
// FIREBASE INITIALIZATION
// ============================================================

const app = getApps().length
    ? getApp()
    : initializeApp(firebaseConfig);

const auth = getAuth(app);


// ============================================================
// AUTH STATE
// ============================================================

let currentAdmin = null;
let authReady = false;

let authReadyPromiseResolve;

const authReadyPromise = new Promise((resolve) => {
    authReadyPromiseResolve = resolve;
});


onAuthStateChanged(auth, async (user) => {

    if (!user) {

        currentAdmin = null;
        authReady = true;

        authReadyPromiseResolve(null);

        return;
    }


    // --------------------------------------------------------
    // ADMIN UID VERIFICATION
    // --------------------------------------------------------

    if (user.uid !== ADMIN_USER_UID) {

        currentAdmin = null;

        try {
            await signOut(auth);
        } catch (error) {
            console.error(
                "Unauthorized user sign-out failed:",
                error
            );
        }

        authReady = true;

        authReadyPromiseResolve(null);

        return;
    }


    // --------------------------------------------------------
    // AUTHORIZED ADMIN
    // --------------------------------------------------------

    currentAdmin = user;
    authReady = true;

    authReadyPromiseResolve(user);
});


// ============================================================
// WAIT FOR AUTHENTICATION STATE
// ============================================================

async function waitForAuth(timeout = 10000) {

    if (authReady) {
        return currentAdmin;
    }

    return Promise.race([
        authReadyPromise,

        new Promise((resolve) => {
            setTimeout(() => {
                resolve(null);
            }, timeout);
        })
    ]);
}


// ============================================================
// GET CURRENT ADMIN
// ============================================================

function getCurrentAdmin() {

    const user = auth.currentUser;

    if (
        !user ||
        user.uid !== ADMIN_USER_UID
    ) {
        return null;
    }

    return user;
}


// ============================================================
// AUTHENTICATION STATUS
// ============================================================

function isAdminAuthenticated() {

    const user = auth.currentUser;

    return !!(
        user &&
        user.uid === ADMIN_USER_UID
    );
}


// ============================================================
// PROTECT ADMIN PAGES
// ============================================================

async function protectAdminPage(
    loginPage = "login.html"
) {

    const user = await waitForAuth();

    if (
        !user ||
        user.uid !== ADMIN_USER_UID
    ) {

        const currentPage =
            window.location.pathname
                .split("/")
                .pop();

        if (currentPage !== loginPage) {
            window.location.href = loginPage;
        }

        return false;
    }

    return true;
}


// ============================================================
// REDIRECT TO LOGIN
// ============================================================

function redirectToLogin(
    loginPage = "login.html"
) {

    window.location.href = loginPage;
}


// ============================================================
// LOGOUT
// ============================================================

async function logoutAdmin() {

    try {

        await signOut(auth);

        currentAdmin = null;

        window.location.href = "login.html";

    } catch (error) {

        console.error(
            "Logout failed:",
            error
        );

        throw error;
    }
}


// ============================================================
// ACADEMIC YEAR
// ============================================================

function getAcademicYear() {

    const now = new Date();

    const year = now.getFullYear();

    return `${year}-${year + 1}`;
}


// ============================================================
// NAVIGATION
// ============================================================

function navigateTo(page) {

    if (!page) return;

    window.location.href = page;
}


// ============================================================
// DEDICATED ADD PAGE ROUTES
// ============================================================

function openAddStudentPage() {
    navigateTo("add-student.html");
}

function openAddTeacherPage() {
    navigateTo("add-teacher.html");
}

function openAddFeePage() {
    navigateTo("add-fee.html");
}

function openCollectFeePage() {
    navigateTo("collect-fee.html");
}

function openBulkFeePage() {
    navigateTo("bulk-fee.html");
}

function openPayFeePage() {
    navigateTo("pay-fee.html");
}

function openAddSalaryPage() {
    navigateTo("add-salary.html");
}


// ============================================================
// ACTIVE NAVIGATION
// ============================================================

function setActiveNavigation() {

    const currentPage =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();

    const navLinks =
        document.querySelectorAll(
            "[data-page]"
        );

    navLinks.forEach((link) => {

        const target =
            (link.dataset.page || "")
                .split("/")
                .pop()
                .toLowerCase();

        if (target === currentPage) {

            link.classList.add("active");

        } else {

            link.classList.remove("active");
        }
    });
}


// ============================================================
// LOGOUT BUTTON BINDING
// ============================================================

function bindLogoutButtons() {

    const buttons =
        document.querySelectorAll(
            "[data-logout]"
        );

    buttons.forEach((button) => {

        button.addEventListener(
            "click",
            async (event) => {

                event.preventDefault();

                try {
                    await logoutAdmin();
                } catch (error) {
                    console.error(error);
                }
            }
        );
    });
}


// ============================================================
// PAGE INITIALIZATION
// ============================================================

async function initializeAppPage() {

    setActiveNavigation();
    bindLogoutButtons();

    const loginPage =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase() === "login.html";

    if (!loginPage) {
        await protectAdminPage();
    }
}


// ============================================================
// DOM READY
// ============================================================

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeAppPage
    );

} else {

    initializeAppPage();
}


// ============================================================
// GLOBAL ACCESS
// ============================================================

window.firebaseApp = app;
window.firebaseAuth = auth;

window.ADMIN_USER_UID = ADMIN_USER_UID;

window.currentAdmin = () =>
    getCurrentAdmin();

window.getCurrentAdmin =
    getCurrentAdmin;

window.isAdminAuthenticated =
    isAdminAuthenticated;

window.waitForAuth =
    waitForAuth;

window.protectAdminPage =
    protectAdminPage;

window.redirectToLogin =
    redirectToLogin;

window.logoutAdmin =
    logoutAdmin;

window.getAcademicYear =
    getAcademicYear;

window.navigateTo =
    navigateTo;

window.openAddStudentPage =
    openAddStudentPage;

window.openAddTeacherPage =
    openAddTeacherPage;

window.openAddFeePage =
    openAddFeePage;

window.openCollectFeePage =
    openCollectFeePage;

window.openBulkFeePage =
    openBulkFeePage;

window.openPayFeePage =
    openPayFeePage;

window.openAddSalaryPage =
    openAddSalaryPage;

window.setActiveNavigation =
    setActiveNavigation;
