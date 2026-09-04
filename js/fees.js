// ============================================================
// FEE MANAGEMENT – UPDATED FIREBASE MODULE
// NEW FIREBASE SDK + REALTIME DATABASE
// NO ADD FEE MODAL
// ============================================================

import {
  initializeApp,
  getApps,
  getApp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
  getDatabase,
  ref,
  get,
  push,
  set,
  update,
  remove
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

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

const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

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

function getStudents() {
  return window.STUDENTS || [];
}

function getFees() {
  return window.FEE_RECORDS || [];
}

function getPayments() {
  return window.PAYMENTS || [];
}

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function getAcademicYear() {
  return (
    document.getElementById("feeSession")?.value ||
    window.CURRENT_ACADEMIC_YEAR ||
    `${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(-2)}`
  );
}

function generateReceiptNo() {
  return `RCP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
}

// ============================================================
// RENDER FEES TABLE + ANALYTICS
// ============================================================

function renderFees(
  session = getAcademicYear(),
  classFilter = "all",
  monthFilter = "all",
  statusFilter = "all",
  search = "",
  studentId = null
) {
  const fees = getFees();
  const students = getStudents();
  const payments = getPayments();

  let list = [...fees];

  if (session !== "all") {
    list = list.filter(
      fee => !fee.academicYear || fee.academicYear === session
    );
  }

  if (statusFilter !== "all") {
    list = list.filter(
      fee => fee.status === statusFilter
    );
  }

  if (studentId) {
    list = list.filter(
      fee => fee.studentId === studentId
    );
  } else if (search.trim()) {
    const q = search.trim().toLowerCase();

    list = list.filter(fee => {
      const student = students.find(
        s => s.id === fee.studentId
      );

      if (!student) return false;

      return (
        String(student.name || "")
          .toLowerCase()
          .includes(q) ||

        String(
          student.enrollmentId ||
          student.admissionNo ||
          ""
        )
          .toLowerCase()
          .includes(q) ||

        String(student.roll || "")
          .includes(q) ||

        String(student.mobile || "")
          .includes(q) ||

        String(student.guardian || "")
          .toLowerCase()
          .includes(q)
      );
    });
  }

  if (classFilter !== "all") {
    const classNum = parseInt(classFilter, 10);

    list = list.filter(fee => {
      const student = students.find(
        s => s.id === fee.studentId
      );

      return (
        student &&
        Number(student.class) === classNum
      );
    });
  }

  if (monthFilter !== "all") {
    list = list.filter(fee => {
      return payments.some(
        payment =>
          payment.studentId === fee.studentId &&
          payment.month === monthFilter &&
          (
            !fee.receiptNo ||
            payment.receiptNo === fee.receiptNo
          )
      );
    });
  }

  list.sort((a, b) => {
    const nameA =
      students.find(s => s.id === a.studentId)?.name || "";

    const nameB =
      students.find(s => s.id === b.studentId)?.name || "";

    return nameA.localeCompare(nameB);
  });

  const tbody =
    document.getElementById("feeTableBody");

  if (!tbody) return;

  if (!list.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9"
            style="text-align:center;
                   color:var(--gray-500);
                   padding:2rem;">
          No fee records found.
        </td>
      </tr>
    `;

    renderFeeAnalytics();
    return;
  }

  tbody.innerHTML = list.map((fee, index) => {
    const student =
      students.find(s => s.id === fee.studentId);

    const studentName =
      student?.name || "Unknown";

    const studentClass =
      student
        ? `${student.class}${student.section || ""}`
        : "N/A";

    const isPaid =
      fee.status === "paid" ||
      Number(fee.pending || 0) <= 0;

    return `
      <tr>
        <td>${index + 1}</td>

        <td>
          ${escapeHTML(
            student?.enrollmentId ||
            student?.admissionNo ||
            "N/A"
          )}
        </td>

        <td>${escapeHTML(studentName)}</td>

        <td>${escapeHTML(studentClass)}</td>

        <td>${escapeHTML(fee.feeType || "N/A")}</td>

        <td>${formatCurrency(fee.amount)}</td>

        <td>${formatCurrency(fee.paid)}</td>

        <td>${formatCurrency(fee.pending)}</td>

        <td>
          <span class="status-badge status-${escapeHTML(
            fee.status || "pending"
          )}">
            ${escapeHTML(fee.status || "pending")}
          </span>
        </td>

        <td>
          <div class="actions-cell">

            <button
              class="btn-receipt"
              onclick="window.showReceipt('${fee.id}')">
              Receipt
            </button>

            ${
              !isPaid
                ? `
                  <button
                    class="btn-primary"
                    onclick="window.payFee('${fee.id}')">
                    Pay
                  </button>
                `
                : ""
            }

            <button
              class="btn-delete"
              onclick="window.deleteFee('${fee.id}')">
              Delete
            </button>

          </div>
        </td>
      </tr>
    `;
  }).join("");

  renderFeeAnalytics();
}

// ============================================================
// ANALYTICS
// ============================================================

function renderFeeAnalytics() {
  const grid =
    document.getElementById("feeAnalyticsGrid");

  if (!grid) return;

  const payments = getPayments();
  const fees = getFees();

  const now = new Date();

  const todayCollection =
    payments
      .filter(payment => {
        const date = new Date(payment.date);

        return (
          date.toDateString() ===
          now.toDateString()
        );
      })
      .reduce(
        (sum, payment) =>
          sum + Number(payment.amount || 0),
        0
      );

  const monthCollection =
    payments
      .filter(payment => {
        const date = new Date(payment.date);

        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      })
      .reduce(
        (sum, payment) =>
          sum + Number(payment.amount || 0),
        0
      );

  const annualCollection =
    payments
      .filter(payment => {
        const date = new Date(payment.date);

        return (
          date.getFullYear() ===
          now.getFullYear()
        );
      })
      .reduce(
        (sum, payment) =>
          sum + Number(payment.amount || 0),
        0
      );

  const pendingFees =
    fees.reduce(
      (sum, fee) =>
        sum + Number(fee.pending || 0),
      0
    );

  grid.innerHTML = `
    <div class="stat-card">
      <span class="stat-label">
        Today's Collection
      </span>
      <span class="stat-value">
        ${formatCurrency(todayCollection)}
      </span>
    </div>

    <div class="stat-card">
      <span class="stat-label">
        Monthly Collection
      </span>
      <span class="stat-value">
        ${formatCurrency(monthCollection)}
      </span>
    </div>

    <div class="stat-card">
      <span class="stat-label">
        Annual Collection
      </span>
      <span class="stat-value">
        ${formatCurrency(annualCollection)}
      </span>
    </div>

    <div class="stat-card">
      <span class="stat-label">
        Pending Fees
      </span>
      <span class="stat-value">
        ${formatCurrency(pendingFees)}
      </span>
    </div>

    <div class="stat-card">
      <span class="stat-label">
        Total Receipts
      </span>
      <span class="stat-value">
        ${payments.length}
      </span>
    </div>
  `;
}

// ============================================================
// UNIVERSAL SEARCH
// ============================================================

function setupFeeSearch() {
  const input =
    document.getElementById("feeUniversalSearch");

  const suggestions =
    document.getElementById("feeSearchSuggestions");

  if (!input || !suggestions) return;

  input.addEventListener("input", function () {
    const query =
      this.value.trim().toLowerCase();

    if (!query) {
      suggestions.style.display = "none";
      applyFeeFilters();
      return;
    }

    const students = getStudents();

    const matched = students.filter(student => {
      return (
        String(student.name || "")
          .toLowerCase()
          .includes(query) ||

        String(
          student.enrollmentId ||
          student.admissionNo ||
          ""
        )
          .toLowerCase()
          .includes(query) ||

        String(student.roll || "")
          .includes(query) ||

        String(student.mobile || "")
          .includes(query) ||

        String(student.guardian || "")
          .toLowerCase()
          .includes(query)
      );
    });

    if (!matched.length) {
      suggestions.innerHTML = `
        <div class="suggestion-item">
          No results
        </div>
      `;
    } else {
      suggestions.innerHTML =
        matched.map(student => `
          <div
            class="suggestion-item"
            data-id="${escapeHTML(student.id)}">

            <strong>
              ${escapeHTML(student.name)}
            </strong>

            (
            ${escapeHTML(
              student.enrollmentId ||
              student.admissionNo ||
              "N/A"
            )}
            )

            –
            ${escapeHTML(student.class)}
            ${escapeHTML(student.section || "")}

          </div>
        `).join("");

      suggestions
        .querySelectorAll(".suggestion-item[data-id]")
        .forEach(element => {

          element.addEventListener(
            "click",
            function () {

              const id =
                this.dataset.id;

              window.showStudentDetail(id);

              const student =
                getStudents().find(
                  s => s.id === id
                );

              if (student) {
                input.value =
                  student.name;
              }

              suggestions.style.display =
                "none";

              applyFeeFilters();
            }
          );

        });
    }

    suggestions.style.display = "block";
    applyFeeFilters();
  });

  input.addEventListener("blur", () => {
    setTimeout(() => {
      suggestions.style.display = "none";
    }, 200);
  });
}

// ============================================================
// STUDENT DETAIL
// ============================================================

function showStudentDetail(id) {
  const students = getStudents();
  const payments = getPayments();
  const fees = getFees();

  const student =
    students.find(s => s.id === id);

  if (!student) return;

  const panel =
    document.getElementById("feeStudentDetail");

  if (!panel) return;

  const studentPayments =
    payments.filter(
      payment => payment.studentId === id
    );

  const studentFees =
    fees.filter(
      fee => fee.studentId === id
    );

  const totalPaid =
    studentPayments.reduce(
      (sum, payment) =>
        sum + Number(payment.amount || 0),
      0
    );

  const pendingTotal =
    studentFees.reduce(
      (sum, fee) =>
        sum + Number(fee.pending || 0),
      0
    );

  const lastPayment =
    [...studentPayments]
      .sort(
        (a, b) =>
          new Date(b.date) -
          new Date(a.date)
      )[0] || null;

  panel.style.display = "block";

  panel.innerHTML = `
    <div class="fee-student-detail-content">

      <div class="student-summary">

        <div class="student-avatar">
          ${escapeHTML(
            String(student.name || "?")
              .charAt(0)
              .toUpperCase()
          )}
        </div>

        <div>
          <h3>
            ${escapeHTML(student.name)}
          </h3>

          <p>
            Enrollment ID:
            ${escapeHTML(
              student.enrollmentId ||
              student.admissionNo ||
              "N/A"
            )}

            |

            Roll:
            ${escapeHTML(student.roll || "N/A")}
          </p>
        </div>

      </div>

      <div class="detail-grid">

        <div class="label">
          Class & Section
        </div>
        <div class="value">
          ${escapeHTML(student.class)}
          ${escapeHTML(student.section || "")}
        </div>

        <div class="label">
          Guardian
        </div>
        <div class="value">
          ${escapeHTML(
            student.guardian || "N/A"
          )}
        </div>

        <div class="label">
          Total Paid
        </div>
        <div class="value">
          ${formatCurrency(totalPaid)}
        </div>

        <div class="label">
          Pending Amount
        </div>
        <div class="value">
          ${formatCurrency(pendingTotal)}
        </div>

        <div class="label">
          Last Payment
        </div>
        <div class="value">
          ${
            lastPayment
              ? new Date(
                  lastPayment.date
                ).toLocaleDateString()
              : "N/A"
          }
        </div>

      </div>

      <div class="detail-actions">

        <button
          class="btn btn-primary"
          onclick="window.openCollectFeePage('${escapeHTML(id)}')">
          Collect Fee
        </button>

        <button
          class="btn btn-secondary"
          onclick="window.showPaymentHistory('${escapeHTML(id)}')">
          Payment History
        </button>

        <button
          class="btn btn-secondary"
          onclick="window.printLastReceipt('${escapeHTML(id)}')">
          Print Last Receipt
        </button>

      </div>

      <div class="fee-structure">

        <h4>
          Fee Structure
        </h4>

        <div class="fee-structure-grid">

          ${
            studentFees.length
              ? studentFees.map(fee => `
                <div class="fee-structure-item">

                  <div class="fee-type">
                    ${escapeHTML(
                      fee.feeType || "N/A"
                    )}
                  </div>

                  <div>
                    Amount:
                    ${formatCurrency(fee.amount)}
                  </div>

                  <div>
                    Paid:
                    ${formatCurrency(fee.paid)}
                  </div>

                  <div>
                    Pending:
                    ${formatCurrency(fee.pending)}
                  </div>

                </div>
              `).join("")
              : `
                <div>
                  No fee records found.
                </div>
              `
          }

        </div>

      </div>

    </div>
  `;
}

// ============================================================
// COLLECT FEE – DEDICATED PAGE
// ============================================================

function openCollectFeePage(studentId) {
  const url =
    `collect-fee.html?studentId=${encodeURIComponent(studentId)}`;

  window.location.href = url;
}

// ============================================================
// PROCESS FEE PAYMENT
// ============================================================

async function processFeePayment(studentId) {

  const amountInput =
    document.getElementById("calcAmountReceived");

  const methodInput =
    document.getElementById("calcPaymentMethod");

  if (!amountInput || !methodInput) {
    window.showToast(
      "Payment form not found.",
      "error"
    );
    return;
  }

  const received =
    Number(amountInput.value || 0);

  const method =
    methodInput.value;

  if (received <= 0) {
    window.showToast(
      "Please enter a valid amount.",
      "error"
    );
    return;
  }

  const button =
    document.getElementById(
      "processPaymentBtn"
    );

  if (button) {
    button.disabled = true;
    button.textContent = "Processing...";
  }

  try {

    const receiptNo =
      generateReceiptNo();

    const now =
      new Date();

    const payment = {
      studentId,
      receiptNo,
      date: now.toISOString(),
      month: now.toLocaleString(
        "default",
        { month: "long" }
      ),
      amount: received,
      method,
      status: "paid",
      academicYear: getAcademicYear(),
      createdAt: now.toISOString()
    };

    const paymentRef =
      push(ref(db, "payments"));

    await set(
      paymentRef,
      payment
    );

    const paymentResult = {
      id: paymentRef.key,
      ...payment
    };

    window.PAYMENTS =
      [
        ...getPayments(),
        paymentResult
      ];

    window.showToast(
      `Payment processed successfully. Receipt: ${receiptNo}`,
      "success"
    );

    window.location.href =
      `receipt.html?receiptNo=${encodeURIComponent(receiptNo)}`;

  } catch (error) {

    console.error(
      "Payment error:",
      error
    );

    window.showToast(
      "Payment failed. Please try again.",
      "error"
    );

  } finally {

    if (button) {
      button.disabled = false;
      button.textContent =
        "Process Payment";
    }

  }
}

// ============================================================
// PAY INDIVIDUAL FEE
// ============================================================

function payFee(feeId) {

  const fee =
    getFees().find(
      item => item.id === feeId
    );

  if (!fee) {
    window.showToast(
      "Fee record not found.",
      "error"
    );
    return;
  }

  window.location.href =
    `pay-fee.html?feeId=${encodeURIComponent(feeId)}`;
}

// ============================================================
// SAVE INDIVIDUAL FEE PAYMENT
// ============================================================

async function processIndividualFeePayment(
  feeId,
  amountPaid,
  method
) {

  const fee =
    getFees().find(
      item => item.id === feeId
    );

  if (!fee) {
    throw new Error(
      "Fee record not found."
    );
  }

  const amount =
    Number(amountPaid);

  const pending =
    Number(fee.pending || 0);

  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > pending
  ) {
    throw new Error(
      "Invalid payment amount."
    );
  }

  const newPaid =
    Number(fee.paid || 0) + amount;

  const newPending =
    Math.max(
      0,
      pending - amount
    );

  const newStatus =
    newPending === 0
      ? "paid"
      : "pending";

  const updatedFee = {
    paid: newPaid,
    pending: newPending,
    status: newStatus,
    updatedAt: new Date().toISOString()
  };

  await update(
    ref(db, `feeRecords/${feeId}`),
    updatedFee
  );

  const receiptNo =
    generateReceiptNo();

  const now =
    new Date();

  const payment = {
    studentId: fee.studentId,
    feeId,
    receiptNo,
    date: now.toISOString(),
    month: now.toLocaleString(
      "default",
      { month: "long" }
    ),
    amount,
    method,
    status: "paid",
    academicYear:
      fee.academicYear ||
      getAcademicYear(),
    createdAt: now.toISOString()
  };

  const paymentRef =
    push(ref(db, "payments"));

  await set(
    paymentRef,
    payment
  );

  const index =
    window.FEE_RECORDS.findIndex(
      item => item.id === feeId
    );

  if (index !== -1) {
    window.FEE_RECORDS[index] = {
      ...window.FEE_RECORDS[index],
      ...updatedFee
    };
  }

  window.PAYMENTS = [
    ...getPayments(),
    {
      id: paymentRef.key,
      ...payment
    }
  ];

  return {
    receiptNo,
    paymentId: paymentRef.key
  };
}

// ============================================================
// PAYMENT HISTORY
// ============================================================

function showPaymentHistory(studentId) {

  const payments =
    getPayments()
      .filter(
        payment =>
          payment.studentId === studentId
      )
      .sort(
        (a, b) =>
          new Date(b.date) -
          new Date(a.date)
      );

  if (!payments.length) {
    window.showToast(
      "No payment history found.",
      "info"
    );
    return;
  }

  const student =
    getStudents().find(
      item => item.id === studentId
    );

  if (!student) return;

  const rows =
    payments.map(payment => `
      <tr>

        <td>
          ${escapeHTML(payment.receiptNo)}
        </td>

        <td>
          ${new Date(
            payment.date
          ).toLocaleDateString()}
        </td>

        <td>
          ${escapeHTML(
            payment.month || "N/A"
          )}
        </td>

        <td>
          ${formatCurrency(payment.amount)}
        </td>

        <td>
          ${escapeHTML(
            payment.method || "N/A"
          )}
        </td>

        <td>
          <span class="status-badge status-${escapeHTML(
            payment.status || "paid"
          )}">
            ${escapeHTML(
              payment.status || "paid"
            )}
          </span>
        </td>

        <td>

          <button
            class="btn-edit"
            onclick="window.viewReceipt('${escapeHTML(payment.id)}')">
            View
          </button>

          <button
            class="btn-receipt"
            onclick="window.reprintReceipt('${escapeHTML(payment.id)}')">
            Reprint
          </button>

          <button
            class="btn-edit"
            onclick="window.downloadReceiptPDF('${escapeHTML(payment.id)}')">
            PDF
          </button>

        </td>

      </tr>
    `).join("");

  window.openModal(
    `Payment History – ${escapeHTML(student.name)}`,
    `
      <div style="overflow-x:auto;">
        <table class="data-table">

          <thead>
            <tr>
              <th>Receipt No</th>
              <th>Date</th>
              <th>Month</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            ${rows}
          </tbody>

        </table>
      </div>
    `,
    "Close",
    () => window.closeModal()
  );
}

// ============================================================
// BULK COLLECTION – DEDICATED PAGE
// ============================================================

function openBulkCollectPage() {
  window.location.href =
    "bulk-fee.html";
}

// ============================================================
// PROCESS BULK COLLECTION
// ============================================================

async function processBulkCollection(
  classValue,
  section,
  feeType,
  amount
) {

  const students =
    getStudents().filter(
      student =>
        Number(student.class) ===
          Number(classValue) &&
        String(student.section || "") ===
          String(section)
    );

  if (!students.length) {
    throw new Error(
      "No students found for the selected class and section."
    );
  }

  const feeAmount =
    Number(amount);

  if (
    !feeType ||
    !Number.isFinite(feeAmount) ||
    feeAmount <= 0
  ) {
    throw new Error(
      "Invalid fee details."
    );
  }

  let successCount = 0;
  let errorCount = 0;

  for (const student of students) {

    try {

      const fee = {
        studentId: student.id,
        feeType,
        amount: feeAmount,
        paid: 0,
        pending: feeAmount,
        status: "pending",
        academicYear: getAcademicYear(),
        createdAt:
          new Date().toISOString()
      };

      const feeRef =
        push(ref(db, "feeRecords"));

      await set(
        feeRef,
        fee
      );

      window.FEE_RECORDS.push({
        id: feeRef.key,
        ...fee
      });

      successCount++;

    } catch (error) {

      console.error(
        `Error adding fee for ${student.name}:`,
        error
      );

      errorCount++;
    }
  }

  return {
    successCount,
    errorCount
  };
}

// ============================================================
// FILTERS
// ============================================================

function applyFeeFilters() {

  const session =
    document.getElementById(
      "feeSession"
    )?.value ||
    getAcademicYear();

  const classFilter =
    document.getElementById(
      "feeClassFilter"
    )?.value ||
    "all";

  const monthFilter =
    document.getElementById(
      "feeMonthFilter"
    )?.value ||
    "all";

  const statusFilter =
    document.getElementById(
      "feeStatusFilter"
    )?.value ||
    "all";

  const search =
    document.getElementById(
      "feeUniversalSearch"
    )?.value ||
    "";

  renderFees(
    session,
    classFilter,
    monthFilter,
    statusFilter,
    search
  );
}

// ============================================================
// ADD FEE – DEDICATED PAGE
// ============================================================

function showAddFeePage() {
  window.location.href =
    "add-fee.html";
}

// ============================================================
// CREATE FEE RECORD
// Used by add-fee.html
// ============================================================

async function addFeeRecord({
  studentId,
  feeType,
  amount,
  academicYear
}) {

  if (!studentId) {
    throw new Error(
      "Student is required."
    );
  }

  if (!feeType) {
    throw new Error(
      "Fee type is required."
    );
  }

  const feeAmount =
    Number(amount);

  if (
    !Number.isFinite(feeAmount) ||
    feeAmount <= 0
  ) {
    throw new Error(
      "Please enter a valid fee amount."
    );
  }

  const fee = {
    studentId,
    feeType,
    amount: feeAmount,
    paid: 0,
    pending: feeAmount,
    status: "pending",
    academicYear:
      academicYear ||
      getAcademicYear(),
    createdAt:
      new Date().toISOString()
  };

  const feeRef =
    push(ref(db, "feeRecords"));

  await set(
    feeRef,
    fee
  );

  const result = {
    id: feeRef.key,
    ...fee
  };

  window.FEE_RECORDS = [
    ...getFees(),
    result
  ];

  return result;
}

// ============================================================
// DELETE FEE
// ============================================================

async function deleteFee(id) {

  if (!confirm(
    "Delete this fee record?"
  )) {
    return;
  }

  const fee =
    getFees().find(
      item => item.id === id
    );

  if (!fee) {
    window.showToast(
      "Fee record not found.",
      "error"
    );
    return;
  }

  try {

    await remove(
      ref(db, `feeRecords/${id}`)
    );

    window.FEE_RECORDS =
      getFees().filter(
        item => item.id !== id
      );

    window.showToast(
      "Fee record deleted successfully.",
      "success"
    );

    applyFeeFilters();

    if (window.renderDashboard) {
      window.renderDashboard();
    }

  } catch (error) {

    console.error(
      "Delete fee error:",
      error
    );

    window.showToast(
      "Failed to delete fee record.",
      "error"
    );
  }
}

// ============================================================
// INITIALIZE FEE MODULE
// ============================================================

function initFeeModule() {

  renderFees();
  renderFeeAnalytics();
  setupFeeSearch();

  const filters = [
    "feeSession",
    "feeClassFilter",
    "feeMonthFilter",
    "feeStatusFilter"
  ];

  filters.forEach(id => {

    const element =
      document.getElementById(id);

    if (element) {
      element.addEventListener(
        "change",
        applyFeeFilters
      );
    }
  });

  const bulkButton =
    document.getElementById(
      "feeCollectBulkBtn"
    );

  if (bulkButton) {
    bulkButton.addEventListener(
      "click",
      openBulkCollectPage
    );
  }

  const addFeeButton =
    document.getElementById(
      "addFeeBtn"
    );

  if (addFeeButton) {
    addFeeButton.addEventListener(
      "click",
      showAddFeePage
    );
  }

  const searchInput =
    document.getElementById(
      "feeUniversalSearch"
    );

  if (searchInput) {
    searchInput.addEventListener(
      "input",
      applyFeeFilters
    );
  }
}

// ============================================================
// LOAD FEE DATA FROM REALTIME DATABASE
// ============================================================

async function loadFeeData() {

  try {

    const [
      feesSnapshot,
      paymentsSnapshot
    ] = await Promise.all([
      get(ref(db, "feeRecords")),
      get(ref(db, "payments"))
    ]);

    const feesData =
      feesSnapshot.val() || {};

    const paymentsData =
      paymentsSnapshot.val() || {};

    window.FEE_RECORDS =
      Object.entries(feesData)
        .map(([id, data]) => ({
          id,
          ...data
        }));

    window.PAYMENTS =
      Object.entries(paymentsData)
        .map(([id, data]) => ({
          id,
          ...data
        }));

    renderFees();
    renderFeeAnalytics();

  } catch (error) {

    console.error(
      "Failed to load fee data:",
      error
    );

    window.showToast?.(
      "Failed to load fee data.",
      "error"
    );
  }
}

// ============================================================
// EXPOSE GLOBALLY
// ============================================================

window.renderFees =
  renderFees;

window.initFeeModule =
  initFeeModule;

window.showAddFeePage =
  showAddFeePage;

window.deleteFee =
  deleteFee;

window.payFee =
  payFee;

window.showStudentDetail =
  showStudentDetail;

window.openCollectFeePage =
  openCollectFeePage;

window.processFeePayment =
  processFeePayment;

window.processIndividualFeePayment =
  processIndividualFeePayment;

window.showPaymentHistory =
  showPaymentHistory;

window.openBulkCollectPage =
  openBulkCollectPage;

window.processBulkCollection =
  processBulkCollection;

window.addFeeRecord =
  addFeeRecord;

window.applyFeeFilters =
  applyFeeFilters;

window.loadFeeData =
  loadFeeData;

// ============================================================
// AUTO LOAD
// ============================================================

if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      loadFeeData();
      initFeeModule();
    }
  );
} else {
  loadFeeData();
  initFeeModule();
}
