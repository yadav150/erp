```js
// ============================================================
// CORE APPLICATION
// Navigation, Toast, Loading, Data, Authentication
// ============================================================

import {
  initializeApp,
  getApps,
  getApp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
  getDatabase,
  ref,
  get
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

// ============================================================
// FIREBASE CONFIG
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

const ADMIN_USER_UID = "089prHaZ5shgPvvaMsl1dgMe6Yx1";

const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

const db = getDatabase(app);
const auth = getAuth(app);

// ============================================================
// DOM REFS
// ============================================================

const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const menuToggle = document.getElementById("menuToggle");
const sidebarClose = document.getElementById("sidebarClose");
const pageTitle = document.getElementById("pageTitle");

const toastContainer =
  document.getElementById("toastContainer");

const loadingOverlay =
  document.getElementById("loadingOverlay");

const notificationBtn =
  document.getElementById("notificationBtn");

const badgeDot =
  document.querySelector(".badge-dot");

const logoutBtn =
  document.getElementById("logoutBtn");

let currentPage = "dashboard";

// ============================================================
// TOAST & LOADING
// ============================================================

function showLoading(show = true) {
  if (!loadingOverlay) return;

  loadingOverlay.classList.toggle("active", Boolean(show));
}

function showToast(message, type = "info") {
  if (!toastContainer) return;

  const toast = document.createElement("div");

  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(20px)";

    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}

// ============================================================
// MODAL SUPPORT
// ============================================================
// Modal support is retained for VIEW/CONFIRM dialogs.
// Add/New forms must use dedicated pages.
// ============================================================

function openModal(title, bodyHTML, confirmText = "Confirm", callback) {
  const modalOverlay = document.getElementById("modalOverlay");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");
  const modalConfirm = document.getElementById("modalConfirm");

  if (!modalOverlay || !modalTitle || !modalBody) return;

  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHTML;

  if (modalConfirm) {
    modalConfirm.textContent = confirmText;
  }

  window.__modalCallback =
    typeof callback === "function" ? callback : null;

  modalOverlay.classList.add("active");
}

function closeModal() {
  const modalOverlay =
    document.getElementById("modalOverlay");

  if (modalOverlay) {
    modalOverlay.classList.remove("active");
  }

  window.__modalCallback = null;
}

// ============================================================
// NAVIGATION
// ============================================================

function navigateTo(page) {
  currentPage = page;

  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.toggle(
      "active",
      link.dataset.page === page
    );
  });

  document.querySelectorAll(".page-section").forEach(section => {
    section.classList.remove("active");
  });

  const target =
    document.getElementById(`page-${page}`);

  if (target) {
    target.classList.add("active");
  }

  const titles = {
    dashboard: "Dashboard",
    students: "Students",
    teachers: "Teachers & Staff",
    fees: "Fee Management",
    salary: "Salary",
    analytics: "Reports & Analytics",
    attendance: "Attendance"
  };

  const title = titles[page] || "Dashboard";

  if (pageTitle) {
    pageTitle.textContent = title;
  }

  document.title = `SchoolERP | ${title}`;

  switch (page) {
    case "dashboard":
      if (window.renderDashboard) {
        window.renderDashboard();
      }
      break;

    case "students":
      if (window.renderStudents) {
        window.renderStudents();
      }
      break;

    case "teachers":
      if (window.renderStaff) {
        window.renderStaff();
      }
      break;

    case "fees":
      if (window.renderFees) {
        window.renderFees();
      }

      if (window.initFeeModule) {
        window.initFeeModule();
      }
      break;

    case "salary":
      if (window.renderSalary) {
        window.renderSalary();
      }
      break;

    case "analytics":
      if (window.renderAnalytics) {
        window.renderAnalytics();
      }
      break;

    case "attendance":
      if (window.renderAttendance) {
        window.renderAttendance();
      }
      break;

    default:
      break;
  }

  if (window.innerWidth < 1024) {
    sidebar?.classList.remove("open");
    overlay?.classList.remove("active");
  }
}

// ============================================================
// SIDEBAR EVENTS
// ============================================================

menuToggle?.addEventListener("click", () => {
  sidebar?.classList.toggle("open");
  overlay?.classList.toggle("active");
});

sidebarClose?.addEventListener("click", () => {
  sidebar?.classList.remove("open");
  overlay?.classList.remove("active");
});

overlay?.addEventListener("click", () => {
  sidebar?.classList.remove("open");
  overlay?.classList.remove("active");
});

document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();

    const page = link.dataset.page;

    if (page) {
      navigateTo(page);
    }
  });
});

// ============================================================
// MODAL EVENTS
// ============================================================

document
  .getElementById("modalClose")
  ?.addEventListener("click", closeModal);

document
  .getElementById("modalCancel")
  ?.addEventListener("click", closeModal);

document
  .getElementById("modalOverlay")
  ?.addEventListener("click", event => {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  });

document
  .getElementById("modalConfirm")
  ?.addEventListener("click", () => {
    if (typeof window.__modalCallback === "function") {
      window.__modalCallback();
    }
  });

// ============================================================
// NOTIFICATION
// ============================================================

if (notificationBtn) {
  notificationBtn.addEventListener("click", () => {
    showToast("No new notifications", "info");
  });
}

if (badgeDot) {
  badgeDot.style.display = "none";
}

// ============================================================
// LOGOUT
// ============================================================

async function logoutAdmin() {
  await signOut(auth);
  localStorage.removeItem("adminSession");
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      showLoading(true);

      await logoutAdmin();

      showLoading(false);

      showToast(
        "Logged out successfully.",
        "success"
      );

      setTimeout(() => {
        window.location.href = "index.html";
      }, 500);

    } catch (error) {
      console.error("Logout error:", error);

      showLoading(false);

      showToast(
        "Logout failed. Please try again.",
        "error"
      );
    }
  });
}

// ============================================================
// GLOBAL DATA STORES
// ============================================================

window.STUDENTS = [];
window.TEACHERS = [];
window.FEE_RECORDS = [];
window.SALARY_RECORDS = [];
window.PAYMENTS = [];
window.ACTIVITIES = [];

// ============================================================
// FIREBASE DATA READER
// ============================================================

async function readData(path) {
  const snapshot = await get(ref(db, path));

  if (!snapshot.exists()) {
    return [];
  }

  const data = snapshot.val();

  return Object.entries(data).map(([id, value]) => ({
    id,
    ...(value || {})
  }));
}

// ============================================================
// LOAD ALL DATA
// ============================================================

async function loadAllData() {
  try {
    const [
      students,
      teachers,
      fees,
      salary,
      payments,
      activities
    ] = await Promise.all([
      readData("students"),
      readData("teachers"),
      readData("feeRecords"),
      readData("salaryRecords"),
      readData("payments"),
      readData("activities")
    ]);

    window.STUDENTS = students;
    window.TEACHERS = teachers;
    window.FEE_RECORDS = fees;
    window.SALARY_RECORDS = salary;
    window.PAYMENTS = payments;
    window.ACTIVITIES = activities;

    return {
      students,
      teachers,
      fees,
      salary,
      payments,
      activities
    };

  } catch (error) {
    console.error(
      "Error loading Firebase data:",
      error
    );

    showToast(
      "Error loading data from Firebase.",
      "error"
    );

    return null;
  }
}

// ============================================================
// AUTHENTICATION CHECK
// ============================================================

function getCurrentAdmin() {
  return new Promise(resolve => {
    const unsubscribe = onAuthStateChanged(
      auth,
      user => {
        unsubscribe();

        if (
          user &&
          user.uid === ADMIN_USER_UID
        ) {
          resolve(user);
        } else {
          resolve(null);
        }
      },
      error => {
        console.error(
          "Authentication state error:",
          error
        );

        unsubscribe();
        resolve(null);
      }
    );
  });
}

// ============================================================
// INIT
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  showLoading(true);

  try {
    const user = await getCurrentAdmin();

    if (!user) {
      console.warn(
        "No authenticated admin user."
      );

      showLoading(false);

      window.location.href = "index.html";
      return;
    }

    console.log(
      "Authenticated admin:",
      user.email
    );

    await loadAllData();

    // Existing teacher migration support.
    // Runs only when the teacher module provides it.
    if (typeof window.migrateEmployeeIds === "function") {
      await window.migrateEmployeeIds();
    }

    showLoading(false);

    navigateTo("dashboard");

  } catch (error) {
    console.error(
      "Application initialization failed:",
      error
    );

    showLoading(false);

    showToast(
      "Unable to initialize the application.",
      "error"
    );
  }
});

// ============================================================
// EXPOSE GLOBAL FUNCTIONS
// ============================================================

window.showToast = showToast;
window.showLoading = showLoading;
window.openModal = openModal;
window.closeModal = closeModal;
window.navigateTo = navigateTo;
window.loadAllData = loadAllData;
window.getCurrentAdmin = getCurrentAdmin;
window.logoutAdmin = logoutAdmin;
window.db = db;
window.auth = auth;
```
