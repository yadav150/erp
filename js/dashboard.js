// ============================================================
// DASHBOARD MODULE
// ============================================================

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

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

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getDatabase(app);

// ============================================================
// HELPERS
// ============================================================

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatCurrency(value) {
  return `₹${toNumber(value).toLocaleString("en-IN")}`;
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getAcademicYear() {
  const yearElement =
    document.getElementById("academicYear") ||
    document.querySelector("[data-academic-year]");

  if (yearElement && yearElement.textContent.trim()) {
    return yearElement.textContent.trim();
  }

  return localStorage.getItem("academicYear") || "";
}

// ============================================================
// LOAD DASHBOARD DATA
// ============================================================

async function loadDashboardData() {
  try {
    const [
      studentsSnapshot,
      teachersSnapshot,
      feesSnapshot,
      salarySnapshot,
      activitiesSnapshot
    ] = await Promise.all([
      get(ref(db, "students")),
      get(ref(db, "teachers")),
      get(ref(db, "feeRecords")),
      get(ref(db, "salaryRecords")),
      get(ref(db, "activities"))
    ]);

    window.STUDENTS = studentsSnapshot.exists()
      ? Object.entries(studentsSnapshot.val()).map(([id, data]) => ({
          id,
          ...data
        }))
      : [];

    window.TEACHERS = teachersSnapshot.exists()
      ? Object.entries(teachersSnapshot.val()).map(([id, data]) => ({
          id,
          ...data
        }))
      : [];

    window.FEE_RECORDS = feesSnapshot.exists()
      ? Object.entries(feesSnapshot.val()).map(([id, data]) => ({
          id,
          ...data
        }))
      : [];

    window.SALARY_RECORDS = salarySnapshot.exists()
      ? Object.entries(salarySnapshot.val()).map(([id, data]) => ({
          id,
          ...data
        }))
      : [];

    window.ACTIVITIES = activitiesSnapshot.exists()
      ? Object.entries(activitiesSnapshot.val())
          .map(([id, data]) => ({
            id,
            ...data
          }))
          .sort((a, b) => {
            const dateA = new Date(a.createdAt || a.timestamp || 0).getTime();
            const dateB = new Date(b.createdAt || b.timestamp || 0).getTime();
            return dateB - dateA;
          })
          .slice(0, 10)
      : [];

    renderDashboard();
  } catch (error) {
    console.error("Dashboard data loading failed:", error);

    const statsGrid = document.getElementById("statsGrid");

    if (statsGrid) {
      statsGrid.innerHTML = `
        <div class="dashboard-error">
          Unable to load dashboard data.
        </div>
      `;
    }
  }
}

// ============================================================
// RENDER DASHBOARD
// ============================================================

function renderDashboard() {
  const students = window.STUDENTS || [];
  const teachers = window.TEACHERS || [];
  const fees = window.FEE_RECORDS || [];
  const salary = window.SALARY_RECORDS || [];
  const activities = window.ACTIVITIES || [];

  // ==========================================================
  // KPIs
  // ==========================================================

  const totalStudents = students.length;

  const totalTeachers = teachers.filter(
    teacher =>
      teacher.role === "teacher" ||
      teacher.role === "Teacher"
  ).length;

  const totalStaff = teachers.filter(
    teacher =>
      teacher.role === "staff" ||
      teacher.role === "Staff"
  ).length;

  const totalCollected = fees.reduce(
    (sum, fee) =>
      sum +
      toNumber(
        fee.paid ??
        fee.paidAmount ??
        fee.amountPaid
      ),
    0
  );

  const totalPending = fees.reduce(
    (sum, fee) =>
      sum +
      toNumber(
        fee.pending ??
        fee.pendingAmount ??
        fee.balance
      ),
    0
  );

  const totalSalaryPaid = salary
    .filter(
      record =>
        record.status === "paid" ||
        record.status === "Paid"
    )
    .reduce(
      (sum, record) =>
        sum +
        toNumber(
          record.amount ??
          record.salaryAmount ??
          record.paidAmount
        ),
      0
    );

  const totalSalaryPending = salary
    .filter(
      record =>
        record.status === "pending" ||
        record.status === "Pending"
    )
    .reduce(
      (sum, record) =>
        sum +
        toNumber(
          record.amount ??
          record.salaryAmount ??
          record.pendingAmount
        ),
      0
    );

  // ==========================================================
  // STATS GRID
  // ==========================================================

  const statsGrid = document.getElementById("statsGrid");

  if (statsGrid) {
    statsGrid.innerHTML = `
      <div class="stat-card">
        <span class="stat-label">Total Students</span>
        <span class="stat-value">${totalStudents}</span>
      </div>

      <div class="stat-card">
        <span class="stat-label">Total Teachers</span>
        <span class="stat-value">${totalTeachers}</span>
      </div>

      <div class="stat-card">
        <span class="stat-label">Total Staff</span>
        <span class="stat-value">${totalStaff}</span>
      </div>

      <div class="stat-card">
        <span class="stat-label">Fee Collected</span>
        <span class="stat-value">${formatCurrency(totalCollected)}</span>
      </div>

      <div class="stat-card">
        <span class="stat-label">Pending Fees</span>
        <span class="stat-value">${formatCurrency(totalPending)}</span>
      </div>

      <div class="stat-card">
        <span class="stat-label">Salary Paid</span>
        <span class="stat-value">${formatCurrency(totalSalaryPaid)}</span>
      </div>

      <div class="stat-card">
        <span class="stat-label">Salary Pending</span>
        <span class="stat-value">${formatCurrency(totalSalaryPending)}</span>
      </div>
    `;
  }

  // ==========================================================
  // RECENT ACTIVITIES
  // ==========================================================

  const activityContainer =
    document.getElementById("recentActivities");

  if (activityContainer) {
    if (activities.length === 0) {
      activityContainer.innerHTML = `
        <p class="empty-state">No recent activities.</p>
      `;
    } else {
      activityContainer.innerHTML = activities
        .map(activity => `
          <div class="activity-item">
            <div class="activity-icon">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>

            <div class="activity-content">
              <div class="activity-text">
                ${escapeHTML(activity.text || "No details")}
              </div>

              <div class="activity-time">
                ${escapeHTML(activity.time || "Just now")}
              </div>
            </div>
          </div>
        `)
        .join("");
    }
  }

  // ==========================================================
  // ACADEMIC YEAR
  // ==========================================================

  const academicYear = getAcademicYear();

  document
    .querySelectorAll("[data-dashboard-academic-year]")
    .forEach(element => {
      element.textContent = academicYear || "[Academic Year]";
    });
}

// ============================================================
// QUICK ACTION BUTTONS
// ============================================================

document.querySelectorAll(".quick-action-btn").forEach(button => {
  button.addEventListener("click", () => {
    const action = button.dataset.action;

    switch (action) {
      case "addStudent":
        window.location.href = "add-student.html";
        break;

      case "addTeacher":
        window.location.href = "add-teacher.html";
        break;

      case "addSalary":
        window.location.href = "add-salary.html";
        break;

      case "viewFees":
        if (typeof window.navigateTo === "function") {
          window.navigateTo("fees");
        } else {
          window.location.href = "fees.html";
        }
        break;

      default:
        console.warn("Unknown dashboard action:", action);
    }
  });
});

// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  loadDashboardData();
});

// ============================================================
// EXPOSE GLOBALLY
// ============================================================

window.renderDashboard = renderDashboard;
window.loadDashboardData = loadDashboardData;
