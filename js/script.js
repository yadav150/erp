// ============================================================
// CORE SCRIPT – GLOBAL UI, NAVIGATION, AUTH & UTILITIES
// ============================================================

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

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

const ADMIN_USER_UID = "089prHaZ5shgPvvaMsl1dgMe6Yx1";

const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

const firebaseAuth = getAuth(firebaseApp);

// ============================================================
// GLOBAL DATA CONTAINERS
// ============================================================

window.STUDENTS = window.STUDENTS || [];
window.TEACHERS = window.TEACHERS || [];
window.FEE_RECORDS = window.FEE_RECORDS || [];
window.PAYMENTS = window.PAYMENTS || [];
window.SALARY_RECORDS = window.SALARY_RECORDS || [];
window.INSTITUTION_SETTINGS = window.INSTITUTION_SETTINGS || {};

// ============================================================
// SAFE HTML ESCAPE
// ============================================================

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ============================================================
// TOAST NOTIFICATION
// ============================================================

function showToast(message, type = "success") {
  let container = document.getElementById("toastContainer");

  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    toast.classList.remove("show");

    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// ============================================================
// LOADING OVERLAY
// ============================================================

function showLoading(message = "Loading...") {
  let loader = document.getElementById("globalLoading");

  if (!loader) {
    loader = document.createElement("div");
    loader.id = "globalLoading";
    loader.className = "global-loading";

    loader.innerHTML = `
      <div class="loading-box">
        <div class="loading-spinner"></div>
        <div class="loading-message"></div>
      </div>
    `;

    document.body.appendChild(loader);
  }

  const messageElement = loader.querySelector(".loading-message");

  if (messageElement) {
    messageElement.textContent = message;
  }

  loader.classList.add("active");
}

function hideLoading() {
  const loader = document.getElementById("globalLoading");

  if (loader) {
    loader.classList.remove("active");
  }
}

// ============================================================
// MODAL – VIEW / CONFIRMATION ONLY
// ADD/NEW FORMS MUST NEVER USE THIS
// ============================================================

function openModal(title, content, primaryText = "", primaryAction = null) {
  closeModal();

  const overlay = document.createElement("div");
  overlay.id = "modal";
  overlay.className = "modal-overlay";

  overlay.innerHTML = `
    <div class="modal-container" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h2>${escapeHTML(title)}</h2>
        <button type="button" class="modal-close" aria-label="Close">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6L18 18M18 6L6 18"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        ${content}
      </div>

      ${
        primaryText
          ? `
            <div class="modal-footer">
              <button type="button" class="btn-secondary modal-cancel">
                Cancel
              </button>
              <button type="button" class="btn-primary modal-primary">
                ${escapeHTML(primaryText)}
              </button>
            </div>
          `
          : ""
      }
    </div>
  `;

  document.body.appendChild(overlay);

  const closeButton = overlay.querySelector(".modal-close");
  const cancelButton = overlay.querySelector(".modal-cancel");
  const primaryButton = overlay.querySelector(".modal-primary");

  if (closeButton) {
    closeButton.addEventListener("click", closeModal);
  }

  if (cancelButton) {
    cancelButton.addEventListener("click", closeModal);
  }

  if (primaryButton && typeof primaryAction === "function") {
    primaryButton.addEventListener("click", primaryAction);
  }

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeModal();
    }
  });
}

function closeModal() {
  const modal = document.getElementById("modal");

  if (modal) {
    modal.remove();
  }
}

// ============================================================
// CONFIRMATION DIALOG
// ============================================================

function showConfirm(message, onConfirm) {
  openModal(
    "Confirmation",
    `<p class="confirm-message">${escapeHTML(message)}</p>`,
    "Confirm",
    async () => {
      try {
        if (typeof onConfirm === "function") {
          await onConfirm();
        }
      } catch (error) {
        console.error("Confirmation action error:", error);
      } finally {
        closeModal();
      }
    }
  );
}

// ============================================================
// PAGE NAVIGATION
// ============================================================

function navigateTo(page) {
  if (!page) return;

  window.location.href = page;
}

function goToDashboard() {
  navigateTo("index.html");
}

function goToStudents() {
  navigateTo("students.html");
}

function goToTeachers() {
  navigateTo("teachers.html");
}

function goToFees() {
  navigateTo("fees.html");
}

function goToSalary() {
  navigateTo("salary.html");
}

function goToReports() {
  navigateTo("analytics.html");
}

function goToSettings() {
  navigateTo("settings.html");
}

// ============================================================
// DEDICATED ADD/NEW PAGE NAVIGATION
// ============================================================

function goToAddStudent() {
  navigateTo("add-student.html");
}

function goToAddTeacher() {
  navigateTo("add-teacher.html");
}

function goToAddFee() {
  navigateTo("add-fee.html");
}

function goToCollectFee() {
  navigateTo("collect-fee.html");
}

function goToPayFee() {
  navigateTo("pay-fee.html");
}

function goToBulkFee() {
  navigateTo("bulk-fee.html");
}

function goToAddSalary() {
  navigateTo("add-salary.html");
}

// ============================================================
// ACADEMIC YEAR
// ============================================================

function getCurrentAcademicYear() {
  const currentYear = new Date().getFullYear();

  return (
    window.INSTITUTION_SETTINGS?.academicYear ||
    localStorage.getItem("academicYear") ||
    `${currentYear}-${currentYear + 1}`
  );
}

function updateAcademicYearUI() {
  const academicYear = getCurrentAcademicYear();

  document.querySelectorAll("[data-academic-year]").forEach((element) => {
    element.textContent = academicYear;
  });

  const elements = [
    "academicYear",
    "currentAcademicYear",
    "headerAcademicYear"
  ];

  elements.forEach((id) => {
    const element = document.getElementById(id);

    if (element) {
      element.textContent = academicYear;
    }
  });
}

// ============================================================
// ACTIVE NAVIGATION
// ============================================================

function setActiveNavigation() {
  const currentPage =
    window.location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll("[data-page]").forEach((item) => {
    const target = item.getAttribute("data-page");

    if (!target) return;

    item.classList.toggle(
      "active",
      target === currentPage
    );
  });
}

// ============================================================
// GLOBAL LOGOUT
// ============================================================

async function logoutAdmin() {
  try {
    await signOut(firebaseAuth);

    sessionStorage.clear();

    window.location.href = "login.html";
  } catch (error) {
    console.error("Logout error:", error);
    showToast("Unable to logout. Please try again.", "error");
  }
}

// ============================================================
// AUTHENTICATION GUARD
// ============================================================

function checkAdminAuthentication() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(
      firebaseAuth,
      (user) => {
        unsubscribe();

        if (!user) {
          resolve(false);
          return;
        }

        if (user.uid !== ADMIN_USER_UID) {
          signOut(firebaseAuth)
            .finally(() => resolve(false));

          return;
        }

        resolve(true);
      },
      () => {
        resolve(false);
      }
    );
  });
}

// ============================================================
// PROTECTED PAGE CHECK
// ============================================================

async function protectAdminPage() {
  const currentPage =
    window.location.pathname.split("/").pop() || "index.html";

  const publicPages = [
    "",
    "login.html",
    "forgot-password.html"
  ];

  if (publicPages.includes(currentPage)) {
    return true;
  }

  const authenticated = await checkAdminAuthentication();

  if (!authenticated) {
    window.location.href = "login.html";
    return false;
  }

  return true;
}

// ============================================================
// HEADER / LOGOUT BINDINGS
// ============================================================

function initializeGlobalButtons() {
  document.querySelectorAll("[data-logout]").forEach((button) => {
    button.addEventListener("click", logoutAdmin);
  });

  document.querySelectorAll("[data-navigate]").forEach((button) => {
    button.addEventListener("click", () => {
      const page = button.getAttribute("data-navigate");

      if (page) {
        navigateTo(page);
      }
    });
  });

  const logoutButton = document.getElementById("logoutBtn");

  if (logoutButton) {
    logoutButton.addEventListener("click", logoutAdmin);
  }
}

// ============================================================
// GLOBAL ADD BUTTON ROUTING
// ============================================================

function initializeAddButtons() {
  const routes = {
    addStudentBtn: "add-student.html",
    addTeacherBtn: "add-teacher.html",
    addFeeBtn: "add-fee.html",
    collectFeeBtn: "collect-fee.html",
    payFeeBtn: "pay-fee.html",
    bulkFeeBtn: "bulk-fee.html",
    addSalaryBtn: "add-salary.html"
  };

  Object.entries(routes).forEach(([id, page]) => {
    const button = document.getElementById(id);

    if (!button) return;

    button.addEventListener("click", (event) => {
      event.preventDefault();
      navigateTo(page);
    });
  });
}

// ============================================================
// SMOOTH FADE-IN
// ============================================================

function initializeFadeIn() {
  document.querySelectorAll(".fade-in").forEach((element, index) => {
    element.style.animationDelay = `${index * 40}ms`;
  });
}

// ============================================================
// PREVENT ACCIDENTAL PAGE OVERFLOW
// ============================================================

function initializePageLayout() {
  document.documentElement.style.overflowX = "hidden";
  document.body.style.overflowX = "hidden";
}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================

function initializeKeyboardShortcuts() {
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
    }
  });
}

// ============================================================
// GLOBAL INITIALIZATION
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  initializePageLayout();
  initializeFadeIn();
  initializeGlobalButtons();
  initializeAddButtons();
  initializeKeyboardShortcuts();
  setActiveNavigation();
  updateAcademicYearUI();

  await protectAdminPage();
});

// ============================================================
// GLOBAL EXPORTS
// ============================================================

window.firebaseApp = firebaseApp;
window.firebaseAuth = firebaseAuth;
window.ADMIN_USER_UID = ADMIN_USER_UID;

window.escapeHTML = escapeHTML;

window.showToast = showToast;
window.showLoading = showLoading;
window.hideLoading = hideLoading;

window.openModal = openModal;
window.closeModal = closeModal;
window.showConfirm = showConfirm;

window.navigateTo = navigateTo;

window.goToDashboard = goToDashboard;
window.goToStudents = goToStudents;
window.goToTeachers = goToTeachers;
window.goToFees = goToFees;
window.goToSalary = goToSalary;
window.goToReports = goToReports;
window.goToSettings = goToSettings;

window.goToAddStudent = goToAddStudent;
window.goToAddTeacher = goToAddTeacher;
window.goToAddFee = goToAddFee;
window.goToCollectFee = goToCollectFee;
window.goToPayFee = goToPayFee;
window.goToBulkFee = goToBulkFee;
window.goToAddSalary = goToAddSalary;

window.getCurrentAcademicYear = getCurrentAcademicYear;
window.updateAcademicYearUI = updateAcademicYearUI;

window.logoutAdmin = logoutAdmin;
window.checkAdminAuthentication = checkAdminAuthentication;
window.protectAdminPage = protectAdminPage;
