```javascript
// ============================================================
// SALARY MODULE – Firebase SDK, CRUD, Render, Filters
// One Salary Record Per Employee Per Month/Year
// ============================================================

import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  get,
  push,
  set,
  update,
  remove
} from "firebase/database";

// ============================================================
// FIREBASE CONFIGURATION
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyCbD7nHFYAKhJHeV9eV_JL1A0qHQw",
  authDomain: "modelerp-c7ff7.firebaseapp.com",
  databaseURL: "https://modelerp-c7ff7-default-rtdb.firebaseio.com",
  projectId: "modelerp-c7ff7",
  storageBucket: "modelerp-c7ff7.firebasestorage.app",
  messagingSenderId: "808804437563",
  appId: "1:808804437563:web:37083674d5b6acdbe8161e",
  measurementId: "G-KT82WYLM0J"
};

// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ============================================================
// HELPERS
// ============================================================

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getCurrentMonth() {
  return new Date().toLocaleString("default", {
    month: "long"
  });
}

function getCurrentYear() {
  return new Date().getFullYear();
}

function getAcademicYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  return month >= 4
    ? `${year}-${year + 1}`
    : `${year - 1}-${year}`;
}

// ============================================================
// FIREBASE DATA HELPERS
// ============================================================

async function getSalaryRecords() {
  const snapshot = await get(ref(db, "salaryRecords"));

  if (!snapshot.exists()) {
    return [];
  }

  const data = snapshot.val();

  return Object.entries(data).map(([id, record]) => ({
    id,
    ...record
  }));
}

async function getTeachers() {
  const snapshot = await get(ref(db, "teachers"));

  if (!snapshot.exists()) {
    return [];
  }

  const data = snapshot.val();

  return Object.entries(data).map(([id, teacher]) => ({
    id,
    ...teacher
  }));
}

// ============================================================
// FIND EMPLOYEE BY EMPLOYEE ID
// ============================================================

async function getEmployeeById(employeeId) {
  const teachers = await getTeachers();

  return teachers.find(
    teacher =>
      String(teacher.employeeId || teacher.id || "").trim() ===
      String(employeeId || "").trim()
  );
}

// ============================================================
// DUPLICATE CHECK
// ============================================================

async function salaryAlreadyExists(employeeId, month, year) {
  const records = await getSalaryRecords();

  return records.some(record =>
    String(record.employeeId || "").trim() ===
      String(employeeId || "").trim() &&
    String(record.month || "").trim() ===
      String(month || "").trim() &&
    Number(record.year) === Number(year)
  );
}

// ============================================================
// RENDER SALARY TABLE + STATS
// ============================================================

async function renderSalary(statusFilter = "all", search = "") {
  const tbody = document.getElementById("salaryTableBody");

  let salaryRecords = [];

  try {
    salaryRecords = await getSalaryRecords();
    window.SALARY_RECORDS = salaryRecords;
  } catch (error) {
    console.error("Failed to load salary records:", error);

    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align:center; padding:2rem;">
            Failed to load salary records.
          </td>
        </tr>
      `;
    }

    return;
  }

  // ==========================================================
  // STATS
  // ==========================================================

  const totalPaid = salaryRecords
    .filter(s => s.status === "paid")
    .reduce(
      (sum, s) => sum + (Number(s.amount) || 0),
      0
    );

  const totalPending = salaryRecords
    .filter(s => s.status === "pending")
    .reduce(
      (sum, s) => sum + (Number(s.amount) || 0),
      0
    );

  const totalRecords = salaryRecords.length;

  const statsGrid =
    document.getElementById("salaryStatsGrid");

  if (statsGrid) {
    statsGrid.innerHTML = `
      <div class="stat-card">
        <span class="stat-label">Total Salary Paid</span>
        <span class="stat-value">
          ₹${totalPaid.toLocaleString("en-IN")}
        </span>
      </div>

      <div class="stat-card">
        <span class="stat-label">Total Salary Pending</span>
        <span class="stat-value">
          ₹${totalPending.toLocaleString("en-IN")}
        </span>
      </div>

      <div class="stat-card">
        <span class="stat-label">Total Records</span>
        <span class="stat-value">
          ${totalRecords}
        </span>
      </div>
    `;
  }

  // ==========================================================
  // FILTER
  // ==========================================================

  let list = [...salaryRecords];

  if (statusFilter !== "all") {
    list = list.filter(
      s => s.status === statusFilter
    );
  }

  if (search.trim()) {
    const q = search.trim().toLowerCase();

    list = list.filter(s =>
      String(s.employeeId || "")
        .toLowerCase()
        .includes(q) ||

      String(s.employeeName || "")
        .toLowerCase()
        .includes(q) ||

      String(s.month || "")
        .toLowerCase()
        .includes(q) ||

      String(s.year || "")
        .toLowerCase()
        .includes(q)
    );
  }

  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align:center; padding:2rem;">
          No salary records found.
        </td>
      </tr>
    `;

    return;
  }

  // ==========================================================
  // TABLE
  // ==========================================================

  tbody.innerHTML = list.map((s, index) => `
    <tr>

      <td>
        ${index + 1}
      </td>

      <td>
        ${escapeHTML(s.employeeId || "—")}
      </td>

      <td>
        ${escapeHTML(s.employeeName || "—")}
      </td>

      <td>
        ${escapeHTML(s.designation || s.role || "—")}
      </td>

      <td>
        ${escapeHTML(s.month || "—")}
      </td>

      <td>
        ${escapeHTML(s.year || "—")}
      </td>

      <td>
        ₹${(Number(s.amount) || 0).toLocaleString("en-IN")}
      </td>

      <td>
        <span class="status-badge status-${escapeHTML(
          s.status || "pending"
        )}">
          ${escapeHTML(s.status || "pending")}
        </span>
      </td>

      <td>
        ${escapeHTML(s.paymentMethod || "—")}
      </td>

      <td>
        <div class="actions-cell">

          <button
            type="button"
            class="btn-receipt"
            onclick="window.showSalaryReceipt('${escapeHTML(s.id)}')"
          >
            Receipt
          </button>

          <button
            type="button"
            class="btn-delete"
            data-id="${escapeHTML(s.id)}"
            data-action="deleteSalary"
            onclick="window.deleteSalary('${escapeHTML(s.id)}')"
          >
            Delete
          </button>

        </div>
      </td>

    </tr>
  `).join("");
}

// ============================================================
// ADD SALARY – DEDICATED PAGE
// ============================================================

async function addSalary() {
  const form =
    document.getElementById("addSalaryForm");

  if (!form) return;

  const employeeId =
    document.getElementById("salaryEmployeeId")
      ?.value.trim();

  const month =
    document.getElementById("salaryMonth")
      ?.value.trim();

  const year =
    Number(
      document.getElementById("salaryYear")
        ?.value
    );

  const status =
    document.getElementById("salaryStatus")
      ?.value;

  const paymentMethod =
    document.getElementById("salaryPaymentMethod")
      ?.value.trim();

  // ==========================================================
  // VALIDATION
  // ==========================================================

  if (!employeeId || !month || !year) {
    window.showToast(
      "Please fill all required fields.",
      "error"
    );
    return;
  }

  if (status === "paid" && !paymentMethod) {
    window.showToast(
      "Payment method is required when salary is Paid.",
      "error"
    );
    return;
  }

  // ==========================================================
  // FETCH EMPLOYEE
  // ==========================================================

  let employee;

  try {
    employee =
      await getEmployeeById(employeeId);
  } catch (error) {
    console.error(
      "Employee lookup error:",
      error
    );

    window.showToast(
      "Unable to fetch employee details.",
      "error"
    );

    return;
  }

  if (!employee) {
    window.showToast(
      "Employee not found. Please enter a valid Employee ID.",
      "error"
    );

    return;
  }

  // ==========================================================
  // DUPLICATE CHECK
  // ==========================================================

  if (
    await salaryAlreadyExists(
      employeeId,
      month,
      year
    )
  ) {
    window.showToast(
      "This employee already has a salary record for this month and year.",
      "error"
    );

    return;
  }

  // ==========================================================
  // GET MONTHLY SALARY FROM EMPLOYEE PROFILE
  // ==========================================================

  const amount = Number(
    employee.salary ??
    employee.monthlySalary ??
    employee.salaryAmount ??
    0
  );

  if (!amount || amount <= 0) {
    window.showToast(
      "Monthly salary is not configured in the employee profile.",
      "error"
    );

    return;
  }

  // ==========================================================
  // RECEIPT NUMBER
  // ==========================================================

  let receiptNo = "";

  if (status === "paid") {
    receiptNo =
      `SAL-${year}-${String(Date.now()).slice(-6)}`;
  }

  // ==========================================================
  // CREATE RECORD
  // ==========================================================

  const salaryRecord = {
    employeeId:
      employee.employeeId || employee.id,

    employeeName:
      employee.name || "",

    role:
      employee.role || "teacher",

    designation:
      employee.designation || "",

    month,
    year,

    academicYear:
      getAcademicYear(),

    amount,

    status,

    paymentMethod:
      status === "paid"
        ? paymentMethod
        : "",

    receiptNo,

    paymentDate:
      status === "paid"
        ? new Date()
            .toISOString()
            .split("T")[0]
        : "",

    createdAt:
      new Date().toISOString()
  };

  // ==========================================================
  // SUBMIT BUTTON
  // ==========================================================

  const submitBtn =
    form.querySelector(
      '[type="submit"]'
    );

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Saving...";
  }

  try {
    const salaryRef =
      push(ref(db, "salaryRecords"));

    await set(
      salaryRef,
      salaryRecord
    );

    window.showToast(
      "Salary record added successfully.",
      "success"
    );

    window.location.href =
      "salary.html";

  } catch (error) {
    console.error(
      "Add salary error:",
      error
    );

    window.showToast(
      "Failed to save salary record. Please try again.",
      "error"
    );

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent =
        "Save Salary";
    }
  }
}

// ============================================================
// AUTO FETCH EMPLOYEE DETAILS
// ============================================================

function setupSalaryEmployeeLookup() {
  const employeeIdInput =
    document.getElementById(
      "salaryEmployeeId"
    );

  if (!employeeIdInput) return;

  const employeeName =
    document.getElementById(
      "salaryEmployeeName"
    );

  const employeeRole =
    document.getElementById(
      "salaryEmployeeRole"
    );

  const employeeDesignation =
    document.getElementById(
      "salaryEmployeeDesignation"
    );

  const employeeSalary =
    document.getElementById(
      "salaryEmployeeAmount"
    );

  const employeeStatus =
    document.getElementById(
      "salaryEmployeeStatus"
    );

  async function updateEmployeeDetails() {
    const employeeId =
      employeeIdInput.value.trim();

    if (!employeeId) {
      if (employeeName)
        employeeName.value = "";

      if (employeeRole)
        employeeRole.value = "";

      if (employeeDesignation)
        employeeDesignation.value = "";

      if (employeeSalary)
        employeeSalary.value = "";

      if (employeeStatus)
        employeeStatus.textContent = "";

      return;
    }

    try {
      const employee =
        await getEmployeeById(
          employeeId
        );

      if (!employee) {
        if (employeeName)
          employeeName.value = "";

        if (employeeRole)
          employeeRole.value = "";

        if (employeeDesignation)
          employeeDesignation.value = "";

        if (employeeSalary)
          employeeSalary.value = "";

        if (employeeStatus) {
          employeeStatus.textContent =
            "Employee not found";

          employeeStatus.className =
            "form-status error";
        }

        return;
      }

      const amount = Number(
        employee.salary ??
        employee.monthlySalary ??
        employee.salaryAmount ??
        0
      );

      if (employeeName)
        employeeName.value =
          employee.name || "";

      if (employeeRole)
        employeeRole.value =
          employee.role || "";

      if (employeeDesignation)
        employeeDesignation.value =
          employee.designation || "";

      if (employeeSalary)
        employeeSalary.value =
          amount > 0
            ? `₹${amount.toLocaleString("en-IN")}`
            : "";

      if (employeeStatus) {
        employeeStatus.textContent =
          amount > 0
            ? "Employee found"
            : "Monthly salary not configured";

        employeeStatus.className =
          amount > 0
            ? "form-status success"
            : "form-status error";
      }

    } catch (error) {
      console.error(
        "Employee lookup error:",
        error
      );

      if (employeeStatus) {
        employeeStatus.textContent =
          "Unable to fetch employee details";

        employeeStatus.className =
          "form-status error";
      }
    }
  }

  employeeIdInput.addEventListener(
    "input",
    updateEmployeeDetails
  );

  employeeIdInput.addEventListener(
    "change",
    updateEmployeeDetails
  );
}

// ============================================================
// INITIALIZE ADD SALARY PAGE
// ============================================================

function initializeAddSalaryPage() {
  const form =
    document.getElementById(
      "addSalaryForm"
    );

  if (!form) return;

  const monthInput =
    document.getElementById(
      "salaryMonth"
    );

  const yearInput =
    document.getElementById(
      "salaryYear"
    );

  const statusInput =
    document.getElementById(
      "salaryStatus"
    );

  if (monthInput && !monthInput.value) {
    monthInput.value =
      getCurrentMonth();
  }

  if (yearInput && !yearInput.value) {
    yearInput.value =
      getCurrentYear();
  }

  if (statusInput && !statusInput.value) {
    statusInput.value =
      "paid";
  }

  setupSalaryEmployeeLookup();

  form.addEventListener(
    "submit",
    async event => {
      event.preventDefault();
      await addSalary();
    }
  );
}

// ============================================================
// DELETE SALARY
// ============================================================

async function deleteSalary(id) {
  if (
    !confirm(
      "Are you sure you want to delete this salary record?"
    )
  ) {
    return;
  }

  const btn =
    document.querySelector(
      `button[data-id="${id}"][data-action="deleteSalary"]`
    );

  if (btn) {
    btn.disabled = true;
    btn.textContent =
      "Deleting...";
  }

  try {
    await remove(
      ref(db, `salaryRecords/${id}`)
    );

    window.SALARY_RECORDS =
      (window.SALARY_RECORDS || [])
        .filter(
          record => record.id !== id
        );

    window.showToast(
      "Salary record deleted.",
      "success"
    );

    renderSalary();

    if (window.renderDashboard) {
      window.renderDashboard();
    }

  } catch (error) {
    console.error(
      "Delete salary error:",
      error
    );

    window.showToast(
      "Failed to delete salary record. Please try again.",
      "error"
    );

    if (btn) {
      btn.disabled = false;
      btn.textContent =
        "Delete";
    }
  }
}

// ============================================================
// EVENT BINDINGS
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    // Add Salary page
    initializeAddSalaryPage();

    // Salary search
    const searchInput =
      document.getElementById(
        "salarySearch"
      );

    if (searchInput) {
      searchInput.addEventListener(
        "input",
        event => {

          const status =
            document.getElementById(
              "salaryFilter"
            )?.value || "all";

          renderSalary(
            status,
            event.target.value
          );
        }
      );
    }

    // Salary filter
    const filterSelect =
      document.getElementById(
        "salaryFilter"
      );

    if (filterSelect) {
      filterSelect.addEventListener(
        "change",
        event => {

          const search =
            document.getElementById(
              "salarySearch"
            )?.value || "";

          renderSalary(
            event.target.value,
            search
          );
        }
      );
    }

    // Initial render
    if (
      document.getElementById(
        "salaryTableBody"
      )
    ) {
      renderSalary();
    }
  }
);

// ============================================================
// GLOBAL FUNCTIONS
// ============================================================

window.renderSalary =
  renderSalary;

window.addSalary =
  addSalary;

window.deleteSalary =
  deleteSalary;

window.getEmployeeById =
  getEmployeeById;

window.salaryAlreadyExists =
  salaryAlreadyExists;

window.initializeAddSalaryPage =
  initializeAddSalaryPage;
```
