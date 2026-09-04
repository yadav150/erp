// receipt.js
// Professional Fee / Payment Receipt
// Uses the new Firebase SDK and current ERP configuration.
// Institution details are loaded dynamically from Firebase Settings.

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


// ======================================================
// FIREBASE CONFIGURATION
// ======================================================

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


// ======================================================
// FIREBASE INITIALIZATION
// ======================================================

const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

const db = getDatabase(app);


// ======================================================
// DEFAULT INSTITUTION INFORMATION
// ======================================================

const DEFAULT_INSTITUTION = {
  name: "[Your Institution Name]",
  address: "[Your Institution Address]",
  code: "[Institution Code]",
  phone: "[Contact Number]",
  email: "[Institution Email]",
  website: "[Institution Website]",
  principalName: "[Principal Name]"
};


// ======================================================
// HELPERS
// ======================================================

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function numberToWords(number) {
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

  number = Math.floor(Number(number) || 0);

  if (number === 0) return "Zero";

  function convertLessThanThousand(num) {
    let result = "";

    if (num >= 100) {
      result += ones[Math.floor(num / 100)] + " Hundred ";
      num %= 100;
    }

    if (num >= 20) {
      result += tens[Math.floor(num / 10)] + " ";
      num %= 10;
    }

    if (num > 0) {
      result += ones[num] + " ";
    }

    return result.trim();
  }

  let result = "";

  if (number >= 10000000) {
    result += convertLessThanThousand(
      Math.floor(number / 10000000)
    ) + " Crore ";
    number %= 10000000;
  }

  if (number >= 100000) {
    result += convertLessThanThousand(
      Math.floor(number / 100000)
    ) + " Lakh ";
    number %= 100000;
  }

  if (number >= 1000) {
    result += convertLessThanThousand(
      Math.floor(number / 1000)
    ) + " Thousand ";
    number %= 1000;
  }

  if (number > 0) {
    result += convertLessThanThousand(number);
  }

  return result.trim() + " Rupees Only";
}


function getAcademicYear() {
  const yearElement =
    document.querySelector("[data-academic-year]") ||
    document.getElementById("academicYear");

  return yearElement?.textContent?.trim() ||
    localStorage.getItem("academicYear") ||
    "[Academic Year]";
}


// ======================================================
// LOAD INSTITUTION SETTINGS
// ======================================================

async function loadInstitutionSettings() {
  const possiblePaths = [
    "settings/institution",
    "institutionSettings",
    "settings"
  ];

  for (const path of possiblePaths) {
    try {
      const snapshot = await get(ref(db, path));

      if (snapshot.exists()) {
        const data = snapshot.val() || {};

        return {
          ...DEFAULT_INSTITUTION,
          ...data
        };
      }
    } catch (error) {
      console.warn(
        `Unable to load institution settings from ${path}`,
        error
      );
    }
  }

  return {
    ...DEFAULT_INSTITUTION
  };
}


// ======================================================
// FIND RECORD
// ======================================================

function findRecord(id, collections = []) {
  for (const collection of collections) {
    const records = window[collection];

    if (!Array.isArray(records)) continue;

    const found = records.find(
      item =>
        String(item.id) === String(id) ||
        String(item.key) === String(id)
    );

    if (found) return found;
  }

  return null;
}


// ======================================================
// BUILD RECEIPT HTML
// ======================================================

function buildReceiptHTML(receipt, student, institution) {
  const amount = Number(
    receipt.amount ??
    receipt.paidAmount ??
    receipt.totalAmount ??
    0
  );

  const receiptNumber =
    receipt.receiptNumber ||
    receipt.receiptNo ||
    receipt.id ||
    "[Receipt Number]";

  const date =
    receipt.date ||
    receipt.paymentDate ||
    receipt.createdAt
      ? new Date(
          receipt.date ||
          receipt.paymentDate ||
          receipt.createdAt
        ).toLocaleDateString("en-IN")
      : "[Date]";

  const enrollmentId =
    student?.enrollmentId ||
    receipt.enrollmentId ||
    "[Enrollment ID]";

  const studentName =
    student?.name ||
    receipt.studentName ||
    "[Student Name]";

  const className =
    student?.class ||
    receipt.class ||
    "[Class]";

  const section =
    student?.section ||
    receipt.section ||
    "[Section]";

  const paymentMode =
    receipt.paymentMode ||
    receipt.mode ||
    "[Payment Mode]";

  const feeType =
    receipt.feeType ||
    receipt.type ||
    "School Fee";

  return `
    <div class="official-receipt">

      <div class="receipt-header">

        <div class="institution-name">
          ${escapeHTML(institution.name)}
        </div>

        <div class="institution-address">
          ${escapeHTML(institution.address)}
        </div>

        <div class="institution-contact">
          ${escapeHTML(institution.phone)}
          ${institution.email ? ` | ${escapeHTML(institution.email)}` : ""}
        </div>

        <div class="receipt-title">
          FEE RECEIPT
        </div>

      </div>


      <div class="receipt-meta">

        <div>
          <strong>Receipt No.</strong>
          <span>${escapeHTML(receiptNumber)}</span>
        </div>

        <div>
          <strong>Date</strong>
          <span>${escapeHTML(date)}</span>
        </div>

        <div>
          <strong>Academic Year</strong>
          <span>${escapeHTML(getAcademicYear())}</span>
        </div>

      </div>


      <table class="receipt-table">

        <tr>
          <th>Enrollment ID</th>
          <td>${escapeHTML(enrollmentId)}</td>
        </tr>

        <tr>
          <th>Student Name</th>
          <td>${escapeHTML(studentName)}</td>
        </tr>

        <tr>
          <th>Class</th>
          <td>${escapeHTML(className)}</td>
        </tr>

        <tr>
          <th>Section</th>
          <td>${escapeHTML(section)}</td>
        </tr>

        <tr>
          <th>Fee Type</th>
          <td>${escapeHTML(feeType)}</td>
        </tr>

        <tr>
          <th>Payment Mode</th>
          <td>${escapeHTML(paymentMode)}</td>
        </tr>

        <tr>
          <th>Amount Paid</th>
          <td><strong>₹${amount.toFixed(2)}</strong></td>
        </tr>

      </table>


      <div class="amount-words">
        <strong>Amount in Words:</strong>
        ${escapeHTML(numberToWords(amount))}
      </div>


      <div class="receipt-signatures">

        <div class="signature-box">
          <div class="signature-line"></div>
          <strong>Student / Guardian Signature</strong>
        </div>

        <div class="signature-box">
          <div class="signature-line"></div>
          <strong>Authorized Signature</strong>
        </div>

        <div class="signature-box">
          <div class="signature-line"></div>
          <strong>Principal Signature</strong>
        </div>

      </div>


      <div class="receipt-footer">
        <div>
          ${escapeHTML(institution.code)}
        </div>

        <div>
          This is a computer-generated receipt.
        </div>
      </div>

    </div>
  `;
}


// ======================================================
// SHOW RECEIPT
// ======================================================

async function showReceipt(id) {
  try {
    const institution = await loadInstitutionSettings();

    const receipt =
      findRecord(id, [
        "PAYMENTS",
        "payments",
        "FEE_RECORDS",
        "feeRecords"
      ]);

    if (!receipt) {
      showToast?.("Receipt record not found.", "error");
      return;
    }

    const student =
      findRecord(
        receipt.studentId ||
        receipt.studentID ||
        receipt.enrollmentId,
        [
          "STUDENTS",
          "students"
        ]
      );

    const html = buildReceiptHTML(
      receipt,
      student,
      institution
    );

    const container =
      document.getElementById("receiptContainer") ||
      document.getElementById("receiptPreview");

    if (container) {
      container.innerHTML = html;
    }

    const modal =
      document.getElementById("receiptModal");

    if (modal && typeof window.openModal === "function") {
      window.openModal("receiptModal");
    }

    window.currentReceipt = {
      receipt,
      student,
      institution
    };

  } catch (error) {
    console.error("Unable to display receipt:", error);
    showToast?.("Unable to load receipt.", "error");
  }
}


// ======================================================
// VIEW RECEIPT
// ======================================================

async function viewReceipt(id) {
  await showReceipt(id);
}


// ======================================================
// REPRINT RECEIPT
// ======================================================

async function reprintReceipt(id) {
  await showReceipt(id);

  setTimeout(() => {
    window.print();
  }, 300);
}


// ======================================================
// PRINT LAST RECEIPT
// ======================================================

function printLastReceipt() {
  if (!window.currentReceipt) {
    showToast?.("No receipt selected.", "error");
    return;
  }

  window.print();
}


// ======================================================
// DOWNLOAD RECEIPT PDF
// ======================================================

async function downloadReceiptPDF(id) {
  try {
    if (!window.jspdf?.jsPDF) {
      showToast?.("PDF generator is not available.", "error");
      return;
    }

    const institution = await loadInstitutionSettings();

    const receipt =
      findRecord(id, [
        "PAYMENTS",
        "payments",
        "FEE_RECORDS",
        "feeRecords"
      ]);

    if (!receipt) {
      showToast?.("Receipt record not found.", "error");
      return;
    }

    const student =
      findRecord(
        receipt.studentId ||
        receipt.studentID ||
        receipt.enrollmentId,
        [
          "STUDENTS",
          "students"
        ]
      );

    const {
      jsPDF
    } = window.jspdf;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const amount = Number(
      receipt.amount ??
      receipt.paidAmount ??
      receipt.totalAmount ??
      0
    );

    const receiptNumber =
      receipt.receiptNumber ||
      receipt.receiptNo ||
      receipt.id ||
      "[Receipt Number]";

    const date =
      receipt.date ||
      receipt.paymentDate ||
      receipt.createdAt;

    let y = 20;


    // --------------------------------------------------
    // HEADER
    // --------------------------------------------------

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");

    doc.text(
      institution.name,
      105,
      y,
      { align: "center" }
    );

    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    doc.text(
      institution.address,
      105,
      y,
      { align: "center" }
    );

    y += 6;

    if (institution.phone || institution.email) {
      doc.text(
        `${institution.phone || ""}${institution.phone && institution.email ? " | " : ""}${institution.email || ""}`,
        105,
        y,
        { align: "center" }
      );

      y += 8;
    }


    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");

    doc.text(
      "FEE RECEIPT",
      105,
      y,
      { align: "center" }
    );

    y += 12;


    // --------------------------------------------------
    // RECEIPT INFORMATION
    // --------------------------------------------------

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    doc.text(
      `Receipt No.: ${receiptNumber}`,
      20,
      y
    );

    doc.text(
      `Date: ${date ? new Date(date).toLocaleDateString("en-IN") : "[Date]"}`,
      190,
      y,
      { align: "right" }
    );

    y += 7;

    doc.text(
      `Academic Year: ${getAcademicYear()}`,
      20,
      y
    );

    y += 10;


    // --------------------------------------------------
    // STUDENT DETAILS
    // --------------------------------------------------

    const studentName =
      student?.name ||
      receipt.studentName ||
      "[Student Name]";

    const enrollmentId =
      student?.enrollmentId ||
      receipt.enrollmentId ||
      "[Enrollment ID]";

    const className =
      student?.class ||
      receipt.class ||
      "[Class]";

    const section =
      student?.section ||
      receipt.section ||
      "[Section]";

    const feeType =
      receipt.feeType ||
      receipt.type ||
      "School Fee";

    const paymentMode =
      receipt.paymentMode ||
      receipt.mode ||
      "[Payment Mode]";


    const rows = [
      ["Enrollment ID", enrollmentId],
      ["Student Name", studentName],
      ["Class", className],
      ["Section", section],
      ["Fee Type", feeType],
      ["Payment Mode", paymentMode],
      ["Amount Paid", `₹${amount.toFixed(2)}`]
    ];


    if (typeof doc.autoTable === "function") {

      doc.autoTable({
        startY: y,
        head: [["Particular", "Details"]],
        body: rows,
        theme: "grid",
        styles: {
          fontSize: 10,
          cellPadding: 4
        },
        headStyles: {
          fontStyle: "bold"
        },
        columnStyles: {
          0: {
            cellWidth: 55
          },
          1: {
            cellWidth: 125
          }
        }
      });

      y = doc.lastAutoTable.finalY + 10;

    } else {

      rows.forEach(([label, value]) => {

        doc.setFont("helvetica", "bold");
        doc.text(label, 20, y);

        doc.setFont("helvetica", "normal");
        doc.text(String(value), 75, y);

        y += 7;
      });

      y += 5;
    }


    // --------------------------------------------------
    // AMOUNT IN WORDS
    // --------------------------------------------------

    doc.setFont("helvetica", "bold");

    doc.text(
      "Amount in Words:",
      20,
      y
    );

    doc.setFont("helvetica", "normal");

    const words =
      numberToWords(amount);

    const wrappedWords =
      doc.splitTextToSize(words, 160);

    doc.text(
      wrappedWords,
      55,
      y
    );

    y +=
      Math.max(
        8,
        wrappedWords.length * 5
      ) + 18;


    // --------------------------------------------------
    // SIGNATURE AREAS
    // --------------------------------------------------

    const signatureY = y;

    doc.line(
      20,
      signatureY,
      70,
      signatureY
    );

    doc.line(
      80,
      signatureY,
      130,
      signatureY
    );

    doc.line(
      140,
      signatureY,
      190,
      signatureY
    );

    doc.setFontSize(9);

    doc.text(
      "Student / Guardian",
      45,
      signatureY + 6,
      { align: "center" }
    );

    doc.text(
      "Authorized Signature",
      105,
      signatureY + 6,
      { align: "center" }
    );

    doc.text(
      "Principal Signature",
      165,
      signatureY + 6,
      { align: "center" }
    );


    // --------------------------------------------------
    // FOOTER
    // --------------------------------------------------

    doc.setFontSize(8);

    doc.text(
      institution.code,
      20,
      285
    );

    doc.text(
      "This is a computer-generated receipt.",
      190,
      285,
      { align: "right" }
    );


    const safeReceiptNumber =
      String(receiptNumber)
        .replace(/[^a-z0-9_-]/gi, "_");

    doc.save(
      `Fee_Receipt_${safeReceiptNumber}.pdf`
    );

  } catch (error) {
    console.error(
      "Unable to generate receipt PDF:",
      error
    );

    showToast?.(
      "Unable to generate receipt PDF.",
      "error"
    );
  }
}


// ======================================================
// PAYMENT HISTORY
// ======================================================

function getPaymentHistory(enrollmentId) {
  const payments =
    Array.isArray(window.PAYMENTS)
      ? window.PAYMENTS
      : Array.isArray(window.payments)
        ? window.payments
        : [];

  return payments.filter(
    payment =>
      String(
        payment.enrollmentId ||
        payment.studentEnrollmentId ||
        ""
      ) === String(enrollmentId)
  );
}


// ======================================================
// DOM INITIALIZATION
// ======================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const printButton =
      document.getElementById("printReceiptBtn");

    if (printButton) {
      printButton.addEventListener(
        "click",
        printLastReceipt
      );
    }

    const downloadButton =
      document.getElementById("downloadReceiptBtn");

    if (downloadButton) {
      downloadButton.addEventListener(
        "click",
        () => {

          const receipt =
            window.currentReceipt?.receipt;

          if (receipt?.id) {
            downloadReceiptPDF(receipt.id);
          }
        }
      );
    }

  }
);


// ======================================================
// GLOBAL FUNCTIONS
// ======================================================

window.showReceipt = showReceipt;
window.viewReceipt = viewReceipt;
window.reprintReceipt = reprintReceipt;
window.printLastReceipt = printLastReceipt;
window.downloadReceiptPDF = downloadReceiptPDF;
window.getPaymentHistory = getPaymentHistory;
window.loadInstitutionSettings = loadInstitutionSettings;
