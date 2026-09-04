```javascript
// ============================================================
// RECEIPT MODULE – Firebase SDK, Dynamic Institution Settings
// Generate, Download PDF, Print, Reprint
// ============================================================

import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  get
} from "firebase/database";

// ============================================================
// FIREBASE CONFIGURATION
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyCbD7nHFYAKhJHeKawfzV9eV_JL1A0qHQw",
  authDomain: "modelerp-c7ff7.firebaseapp.com",
  databaseURL: "https://modelerp-c7ff7-default-rtdb.firebaseio.com",
  projectId: "modelerp-c7ff7",
  storageBucket: "modelerp-c7ff7.firebasestorage.app",
  messagingSenderId: "808804437563",
  appId: "1:808804437563:web:37083674d5b6acdbe8161e",
  measurementId: "G-KT82WYLM0J"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ============================================================
// DEFAULT INSTITUTION INFORMATION
// Admin Settings can override these values.
// ============================================================

const DEFAULT_INSTITUTION_INFO = {
  name: "[Your Institution Name]",
  address: "[Your Institution Address]",
  code: "[Institution Code]",
  phone: "[Contact Number]",
  email: "[Institution Email]",
  website: "[Institution Website]"
};

let INSTITUTION_INFO = {
  ...DEFAULT_INSTITUTION_INFO
};

// ============================================================
// LOAD INSTITUTION SETTINGS
// ============================================================

async function loadInstitutionInfo() {
  try {
    const possiblePaths = [
      "settings/institution",
      "institutionSettings",
      "settings"
    ];

    for (const path of possiblePaths) {
      const snapshot = await get(ref(db, path));

      if (!snapshot.exists()) continue;

      const data = snapshot.val();

      INSTITUTION_INFO = {
        ...DEFAULT_INSTITUTION_INFO,
        ...(data.institution || {}),
        ...(
          path === "institutionSettings" ||
          path === "settings"
            ? data
            : {}
        )
      };

      break;
    }

    window.INSTITUTION_INFO = INSTITUTION_INFO;

    return INSTITUTION_INFO;

  } catch (error) {
    console.error(
      "Failed to load institution settings:",
      error
    );

    return INSTITUTION_INFO;
  }
}

// ============================================================
// UTILITY
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
// NUMBER TO WORDS – INDIAN NUMBERING
// ============================================================

function numberToWords(num) {
  num = Number(num) || 0;

  if (num === 0) {
    return "Zero Rupees Only";
  }

  num = Math.floor(num);

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen"
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety"
  ];

  function twoDigits(value) {
    if (value < 20) {
      return ones[value];
    }

    return (
      tens[Math.floor(value / 10)] +
      (value % 10 ? ` ${ones[value % 10]}` : "")
    );
  }

  function threeDigits(value) {
    if (value < 100) {
      return twoDigits(value);
    }

    return (
      `${ones[Math.floor(value / 100)]} Hundred` +
      (value % 100
        ? ` ${twoDigits(value % 100)}`
        : "")
    );
  }

  let words = "";

  const crore = Math.floor(num / 10000000);
  num %= 10000000;

  const lakh = Math.floor(num / 100000);
  num %= 100000;

  const thousand = Math.floor(num / 1000);
  num %= 1000;

  const hundred = num;

  if (crore) {
    words += `${threeDigits(crore)} Crore `;
  }

  if (lakh) {
    words += `${threeDigits(lakh)} Lakh `;
  }

  if (thousand) {
    words += `${threeDigits(thousand)} Thousand `;
  }

  if (hundred) {
    words += `${threeDigits(hundred)} `;
  }

  return `${words.trim()} Rupees Only`;
}

// ============================================================
// GET ACADEMIC YEAR
// ============================================================

function getAcademicYear() {
  return (
    window.ACADEMIC_YEAR ||
    localStorage.getItem("academicYear") ||
    "[Academic Year]"
  );
}

// ============================================================
// GET FEE RECORD
// ============================================================

function getFeeRecord(id) {
  const records = window.FEE_RECORDS || [];

  return records.find(
    record => String(record.id) === String(id)
  );
}

// ============================================================
// GET STUDENT
// ============================================================

function getStudent(studentId) {
  const students = window.STUDENTS || [];

  return students.find(
    student =>
      String(student.id) === String(studentId)
  );
}

// ============================================================
// GET PAYMENT
// ============================================================

function getPaymentForFee(fee, student) {
  const payments = window.PAYMENTS || [];

  return payments.find(payment =>
    String(payment.studentId) === String(student.id) &&
    Number(payment.amount) === Number(fee.amount) &&
    payment.status === fee.status
  );
}

// ============================================================
// RECEIPT DATA
// ============================================================

function prepareFeeReceiptData(fee) {
  const student = getStudent(fee.studentId);

  if (!student) {
    return null;
  }

  const payment =
    getPaymentForFee(fee, student);

  return {
    fee,
    student,
    payment,

    receiptNumber:
      fee.receiptNo ||
      `RCP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,

    date:
      new Date().toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric"
        }
      ),

    paymentMethod:
      payment?.method ||
      fee.paymentMethod ||
      "N/A",

    academicYear:
      fee.academicYear ||
      getAcademicYear(),

    amount:
      Number(fee.amount) || 0,

    paid:
      Number(fee.paid) || 0,

    pending:
      Number(fee.pending) || 0
  };
}

// ============================================================
// SHOW FEE RECEIPT
// ============================================================

async function showReceipt(id) {
  await loadInstitutionInfo();

  const fee = getFeeRecord(id);

  if (!fee) {
    window.showToast(
      "Fee record not found",
      "error"
    );
    return;
  }

  const data =
    prepareFeeReceiptData(fee);

  if (!data) {
    window.showToast(
      "Student not found",
      "error"
    );
    return;
  }

  const {
    student,
    receiptNumber,
    date,
    paymentMethod,
    academicYear,
    amount,
    paid,
    pending
  } = data;

  const statusClass =
    fee.status === "paid"
      ? "status-paid"
      : fee.status === "pending"
        ? "status-pending"
        : "status-overdue";

  const receiptHTML = `
    <div
      class="receipt-wrapper"
      id="receiptContent"
    >

      <div class="school-header">

        <h2 class="school-name">
          ${escapeHTML(INSTITUTION_INFO.name)}
        </h2>

        <p class="school-address">
          ${escapeHTML(INSTITUTION_INFO.address)}
        </p>

        <p class="school-contact">
          <strong>Institution Code:</strong>
          ${escapeHTML(INSTITUTION_INFO.code)}
          &nbsp;|&nbsp;

          <strong>Phone:</strong>
          ${escapeHTML(INSTITUTION_INFO.phone)}
          &nbsp;|&nbsp;

          <strong>Email:</strong>
          ${escapeHTML(INSTITUTION_INFO.email)}
          &nbsp;|&nbsp;

          <strong>Web:</strong>
          ${escapeHTML(INSTITUTION_INFO.website)}
        </p>

      </div>

      <div class="receipt-title">

        <h3>Fee Receipt</h3>

        <span class="receipt-number">
          # ${escapeHTML(receiptNumber)}
        </span>

      </div>

      <div
        style="
          display:flex;
          justify-content:space-between;
          font-size:0.85rem;
          margin-bottom:0.75rem;
        "
      >

        <span>
          <strong>Date:</strong>
          ${escapeHTML(date)}
        </span>

        <span>
          <strong>Academic Year:</strong>
          ${escapeHTML(academicYear)}
        </span>

      </div>

      <div
        style="
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:0.3rem 1rem;
          background:#f8fafc;
          padding:0.75rem 1rem;
          border-radius:5px;
          margin-bottom:0.75rem;
          font-size:0.85rem;
        "
      >

        <div>
          <strong>Student:</strong>
          ${escapeHTML(student.name)}
        </div>

        <div>
          <strong>Class:</strong>
          ${escapeHTML(
            `${student.class || ""}${student.section || ""}`
          )}
        </div>

        <div>
          <strong>Roll No:</strong>
          ${escapeHTML(student.roll || "N/A")}
        </div>

        <div>
          <strong>Admission No:</strong>
          ${escapeHTML(
            student.admissionNo || "N/A"
          )}
        </div>

        <div>
          <strong>Guardian:</strong>
          ${escapeHTML(
            student.guardian || "N/A"
          )}
        </div>

        <div>
          <strong>Fee Type:</strong>
          ${escapeHTML(
            fee.feeType || "N/A"
          )}
        </div>

      </div>

      <div class="receipt-details-grid">

        <div>
          <strong>Amount:</strong>
          ₹${amount.toLocaleString("en-IN")}
        </div>

        <div>
          <strong>Paid:</strong>
          ₹${paid.toLocaleString("en-IN")}
        </div>

        <div>
          <strong>Pending:</strong>
          ₹${pending.toLocaleString("en-IN")}
        </div>

        <div>
          <strong>Status:</strong>
          <span class="status-badge ${statusClass}">
            ${escapeHTML(fee.status || "N/A")}
          </span>
        </div>

        <div>
          <strong>Payment Method:</strong>
          ${escapeHTML(paymentMethod)}
        </div>

        <div>
          <strong>Amount in Words:</strong>
          ${escapeHTML(numberToWords(amount))}
        </div>

      </div>

      <div
        class="receipt-signatures"
        style="
          display:grid;
          grid-template-columns:1fr 1fr 1fr;
          gap:1rem;
          margin-top:2.5rem;
          text-align:center;
        "
      >

        <div>
          <div
            style="
              border-top:1px solid #222;
              padding-top:0.4rem;
            "
          >
            Student/Guardian Signature
          </div>
        </div>

        <div>
          <div
            style="
              border-top:1px solid #222;
              padding-top:0.4rem;
            "
          >
            Authorized Signature
          </div>
        </div>

        <div>
          <div
            style="
              border-top:1px solid #222;
              padding-top:0.4rem;
            "
          >
            Principal Signature
          </div>
        </div>

      </div>

      <div class="receipt-footer">

        This is a system-generated receipt.

        <br />

        ${escapeHTML(INSTITUTION_INFO.name)}

      </div>

    </div>
  `;

  window.openModal(
    "Fee Receipt",
    `
      ${receiptHTML}

      <div
        class="receipt-actions"
        style="
          display:flex;
          gap:0.75rem;
          justify-content:flex-end;
          margin-top:0.75rem;
          border-top:1px solid var(--gray-200);
          padding-top:0.75rem;
        "
      >

        <button
          type="button"
          onclick="window.downloadReceiptPDF('${escapeHTML(id)}')"
          class="btn btn-primary"
        >
          Download PDF
        </button>

        <button
          type="button"
          onclick="window.print()"
          class="btn btn-secondary"
        >
          Print
        </button>

      </div>
    `,
    "Close",
    () => {
      window.closeModal();
    }
  );

  const modalConfirm =
    document.getElementById(
      "modalConfirm"
    );

  if (modalConfirm) {
    modalConfirm.textContent =
      "Close";

    window.modalCallback =
      () => {
        window.closeModal();
      };
  }
}

// ============================================================
// DOWNLOAD FEE RECEIPT PDF
// ============================================================

async function downloadReceiptPDF(id) {
  await loadInstitutionInfo();

  const fee = getFeeRecord(id);

  if (!fee) {
    window.showToast(
      "Fee record not found",
      "error"
    );
    return;
  }

  const data =
    prepareFeeReceiptData(fee);

  if (!data) {
    window.showToast(
      "Student not found",
      "error"
    );
    return;
  }

  const {
    student,
    receiptNumber,
    date,
    paymentMethod,
    academicYear,
    amount,
    paid,
    pending
  } = data;

  const jsPDF =
    window.jspdf?.jsPDF;

  if (!jsPDF) {
    window.showToast(
      "jsPDF library not loaded",
      "error"
    );
    return;
  }

  window.showToast(
    "Generating PDF...",
    "info"
  );

  const doc =
    new jsPDF(
      "p",
      "mm",
      "a4"
    );

  const pageWidth = 210;
  const margin = 15;
  let y = 20;

  // ==========================================================
  // HEADER
  // ==========================================================

  doc.setFontSize(18);
  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setTextColor(
    30,
    41,
    59
  );

  doc.text(
    INSTITUTION_INFO.name,
    pageWidth / 2,
    y,
    { align: "center" }
  );

  y += 7;

  doc.setFontSize(10);
  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setTextColor(
    71,
    85,
    105
  );

  doc.text(
    INSTITUTION_INFO.address,
    pageWidth / 2,
    y,
    { align: "center" }
  );

  y += 5;

  doc.setFontSize(8);

  doc.setTextColor(
    100,
    116,
    139
  );

  const contactText =
    `Code: ${INSTITUTION_INFO.code} | ` +
    `Phone: ${INSTITUTION_INFO.phone} | ` +
    `Email: ${INSTITUTION_INFO.email}`;

  doc.text(
    contactText,
    pageWidth / 2,
    y,
    { align: "center" }
  );

  y += 8;

  doc.setDrawColor(
    100,
    116,
    139
  );

  doc.setLineWidth(0.4);

  doc.line(
    margin,
    y,
    pageWidth - margin,
    y
  );

  y += 7;

  // ==========================================================
  // TITLE
  // ==========================================================

  doc.setFontSize(14);

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setTextColor(
    51,
    65,
    85
  );

  doc.text(
    "FEE RECEIPT",
    margin,
    y
  );

  doc.setFontSize(9);

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.text(
    `# ${receiptNumber}`,
    pageWidth - margin,
    y,
    { align: "right" }
  );

  y += 7;

  doc.text(
    `Date: ${date}`,
    margin,
    y
  );

  doc.text(
    `Academic Year: ${academicYear}`,
    pageWidth - margin,
    y,
    { align: "right" }
  );

  y += 8;

  // ==========================================================
  // STUDENT DETAILS
  // ==========================================================

  const studentRows = [
    [
      "Student",
      student.name || "N/A"
    ],
    [
      "Class",
      `${student.class || ""}${student.section || ""}`
    ],
    [
      "Roll No",
      student.roll || "N/A"
    ],
    [
      "Admission No",
      student.admissionNo || "N/A"
    ],
    [
      "Guardian",
      student.guardian || "N/A"
    ],
    [
      "Fee Type",
      fee.feeType || "N/A"
    ]
  ];

  const studentHeight =
    studentRows.length * 7 + 5;

  doc.setFillColor(
    248,
    250,
    252
  );

  doc.rect(
    margin,
    y - 2,
    pageWidth - 2 * margin,
    studentHeight,
    "F"
  );

  studentRows.forEach(
    (row, index) => {

      const rowY =
        y + index * 7;

      doc.setFontSize(9);

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setTextColor(
        30,
        41,
        59
      );

      doc.text(
        row[0],
        margin + 3,
        rowY + 5
      );

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setTextColor(
        51,
        65,
        85
      );

      doc.text(
        String(row[1]),
        70,
        rowY + 5
      );
    }
  );

  y += studentHeight + 5;

  // ==========================================================
  // FEE DETAILS
  // ==========================================================

  const feeRows = [
    [
      "Amount",
      `Rs. ${amount.toLocaleString("en-IN")}`
    ],
    [
      "Paid",
      `Rs. ${paid.toLocaleString("en-IN")}`
    ],
    [
      "Pending",
      `Rs. ${pending.toLocaleString("en-IN")}`
    ],
    [
      "Status",
      String(fee.status || "N/A").toUpperCase()
    ],
    [
      "Payment Method",
      paymentMethod
    ],
    [
      "Amount in Words",
      numberToWords(amount)
    ]
  ];

  const feeHeight =
    feeRows.length * 7 + 5;

  doc.setFillColor(
    248,
    250,
    252
  );

  doc.rect(
    margin,
    y - 2,
    pageWidth - 2 * margin,
    feeHeight,
    "F"
  );

  feeRows.forEach(
    (row, index) => {

      const rowY =
        y + index * 7;

      doc.setFontSize(9);

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setTextColor(
        30,
        41,
        59
      );

      doc.text(
        row[0],
        margin + 3,
        rowY + 5
      );

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setTextColor(
        51,
        65,
        85
      );

      const value =
        String(row[1]);

      const lines =
        doc.splitTextToSize(
          value,
          125
        );

      doc.text(
        lines,
        70,
        rowY + 5
      );
    }
  );

  y += feeHeight + 15;

  // ==========================================================
  // SIGNATURES
  // ==========================================================

  const signatureY =
    y + 12;

  doc.setDrawColor(
    51,
    65,
    85
  );

  doc.setLineWidth(0.3);

  const signatureWidth = 48;

  doc.line(
    margin,
    signatureY,
    margin + signatureWidth,
    signatureY
  );

  doc.line(
    pageWidth / 2 - signatureWidth / 2,
    signatureY,
    pageWidth / 2 + signatureWidth / 2,
    signatureY
  );

  doc.line(
    pageWidth - margin - signatureWidth,
    signatureY,
    pageWidth - margin,
    signatureY
  );

  doc.setFontSize(8);

  doc.text(
    "Student/Guardian Signature",
    margin + signatureWidth / 2,
    signatureY + 5,
    { align: "center" }
  );

  doc.text(
    "Authorized Signature",
    pageWidth / 2,
    signatureY + 5,
    { align: "center" }
  );

  doc.text(
    "Principal Signature",
    pageWidth - margin - signatureWidth / 2,
    signatureY + 5,
    { align: "center" }
  );

  // ==========================================================
  // FOOTER
  // ==========================================================

  doc.setDrawColor(
    203,
    213,
    225
  );

  doc.line(
    margin,
    275,
    pageWidth - margin,
    275
  );

  doc.setFontSize(7);

  doc.setFont(
    "helvetica",
    "italic"
  );

  doc.setTextColor(
    100,
    116,
    139
  );

  doc.text(
    "This is a system-generated receipt.",
    pageWidth / 2,
    281,
    { align: "center" }
  );

  doc.text(
    INSTITUTION_INFO.name,
    pageWidth / 2,
    286,
    { align: "center" }
  );

  // ==========================================================
  // SAVE
  // ==========================================================

  const safeName =
    String(student.name || "Student")
      .replace(/[^a-z0-9]+/gi, "_")
      .replace(/^_+|_+$/g, "");

  const fileName =
    `Fee_Receipt_${safeName}_${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`;

  doc.save(fileName);

  window.showToast(
    "Receipt PDF downloaded successfully",
    "success"
  );
}

// ============================================================
// VIEW RECEIPT FROM PAYMENT HISTORY
// ============================================================

async function viewReceipt(id) {
  await loadInstitutionInfo();

  const payments =
    window.PAYMENTS || [];

  const payment =
    payments.find(
      p => String(p.id) === String(id)
    );

  if (payment) {

    const student =
      getStudent(payment.studentId);

    if (!student) {
      window.showToast(
        "Student not found",
        "error"
      );
      return;
    }

    const receiptNumber =
      payment.receiptNo ||
      `RCP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    const date =
      payment.date
        ? new Date(
            payment.date
          ).toLocaleDateString(
            "en-IN",
            {
              day: "2-digit",
              month: "short",
              year: "numeric"
            }
          )
        : new Date().toLocaleDateString(
            "en-IN",
            {
              day: "2-digit",
              month: "short",
              year: "numeric"
            }
          );

    const amount =
      Number(payment.amount) || 0;

    const statusClass =
      payment.status === "paid"
        ? "status-paid"
        : "status-pending";

    const receiptHTML = `
      <div
        class="receipt-wrapper"
        id="receiptContent"
      >

        <div class="school-header">

          <h2 class="school-name">
            ${escapeHTML(INSTITUTION_INFO.name)}
          </h2>

          <p class="school-address">
            ${escapeHTML(INSTITUTION_INFO.address)}
          </p>

          <p class="school-contact">
            <strong>Institution Code:</strong>
            ${escapeHTML(INSTITUTION_INFO.code)}
            &nbsp;|&nbsp;

            <strong>Phone:</strong>
            ${escapeHTML(INSTITUTION_INFO.phone)}
            &nbsp;|&nbsp;

            <strong>Email:</strong>
            ${escapeHTML(INSTITUTION_INFO.email)}
          </p>

        </div>

        <div class="receipt-title">

          <h3>Payment Receipt</h3>

          <span class="receipt-number">
            # ${escapeHTML(receiptNumber)}
          </span>

        </div>

        <div
          style="
            display:flex;
            justify-content:space-between;
            font-size:0.85rem;
            margin-bottom:0.75rem;
          "
        >

          <span>
            <strong>Date:</strong>
            ${escapeHTML(date)}
          </span>

          <span>
            <strong>Academic Year:</strong>
            ${escapeHTML(
              payment.academicYear ||
              getAcademicYear()
            )}
          </span>

        </div>

        <div
          style="
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:0.3rem 1rem;
            background:#f8fafc;
            padding:0.75rem 1rem;
            border-radius:5px;
            margin-bottom:0.75rem;
            font-size:0.85rem;
          "
        >

          <div>
            <strong>Student:</strong>
            ${escapeHTML(student.name)}
          </div>

          <div>
            <strong>Class:</strong>
            ${escapeHTML(
              `${student.class || ""}${student.section || ""}`
            )}
          </div>

          <div>
            <strong>Roll No:</strong>
            ${escapeHTML(
              student.roll || "N/A"
            )}
          </div>

          <div>
            <strong>Admission No:</strong>
            ${escapeHTML(
              student.admissionNo || "N/A"
            )}
          </div>

          <div>
            <strong>Guardian:</strong>
            ${escapeHTML(
              student.guardian || "N/A"
            )}
          </div>

          <div>
            <strong>Month:</strong>
            ${escapeHTML(
              payment.month || "N/A"
            )}
          </div>

        </div>

        <div class="receipt-details-grid">

          <div>
            <strong>Amount:</strong>
            ₹${amount.toLocaleString("en-IN")}
          </div>

          <div>
            <strong>Method:</strong>
            ${escapeHTML(
              payment.method || "N/A"
            )}
          </div>

          <div>
            <strong>Status:</strong>
            <span class="status-badge ${statusClass}">
              ${escapeHTML(
                payment.status || "N/A"
              )}
            </span>
          </div>

          <div>
            <strong>Amount in Words:</strong>
            ${escapeHTML(
              numberToWords(amount)
            )}
          </div>

        </div>

        <div
          style="
            display:grid;
            grid-template-columns:1fr 1fr 1fr;
            gap:1rem;
            margin-top:2.5rem;
            text-align:center;
          "
        >

          <div
            style="
              border-top:1px solid #222;
              padding-top:0.4rem;
            "
          >
            Student/Guardian Signature
          </div>

          <div
            style="
              border-top:1px solid #222;
              padding-top:0.4rem;
            "
          >
            Authorized Signature
          </div>

          <div
            style="
              border-top:1px solid #222;
              padding-top:0.4rem;
            "
          >
            Principal Signature
          </div>

        </div>

        <div class="receipt-footer">

          This is a system-generated receipt.

          <br />

          ${escapeHTML(INSTITUTION_INFO.name)}

        </div>

      </div>
    `;

    window.openModal(
      "Payment Receipt",
      `
        ${receiptHTML}

        <div
          class="receipt-actions"
          style="
            display:flex;
            justify-content:flex-end;
            margin-top:0.75rem;
            border-top:1px solid var(--gray-200);
            padding-top:0.75rem;
          "
        >

          <button
            type="button"
            onclick="window.print()"
            class="btn btn-secondary"
          >
            Print
          </button>

        </div>
      `,
      "Close",
      () => {
        window.closeModal();
      }
    );

    return;
  }

  // ==========================================================
  // FALLBACK TO FEE RECORD
  // ==========================================================

  const fee =
    getFeeRecord(id);

  if (fee) {
    await showReceipt(id);
    return;
  }

  window.showToast(
    "No receipt found",
    "error"
  );
}

// ============================================================
// REPRINT RECEIPT
// ============================================================

async function reprintReceipt(id) {
  await viewReceipt(id);

  setTimeout(
    () => {
      window.print();
    },
    500
  );
}

// ============================================================
// PRINT LAST RECEIPT FOR STUDENT
// ============================================================

async function printLastReceipt(studentId) {
  const payments =
    window.PAYMENTS || [];

  const studentPayments =
    payments.filter(
      payment =>
        String(payment.studentId) ===
        String(studentId)
    );

  if (studentPayments.length === 0) {
    window.showToast(
      "No payment history found",
      "info"
    );
    return;
  }

  const lastPayment =
    studentPayments[
      studentPayments.length - 1
    ];

  await viewReceipt(
    lastPayment.id
  );

  setTimeout(
    () => {
      window.print();
    },
    500
  );
}

// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {
    await loadInstitutionInfo();
  }
);

// ============================================================
// EXPOSE GLOBALLY
// ============================================================

window.showReceipt =
  showReceipt;

window.downloadReceiptPDF =
  downloadReceiptPDF;

window.viewReceipt =
  viewReceipt;

window.reprintReceipt =
  reprintReceipt;

window.printLastReceipt =
  printLastReceipt;

window.loadInstitutionInfo =
  loadInstitutionInfo;

window.numberToWords =
  numberToWords;

window.INSTITUTION_INFO =
  INSTITUTION_INFO;
```
