// fees.js
// Model ERP — Fee Management
// Fully aligned with the new Firebase Modular SDK
// New Firebase Project + Realtime Database
// No old firebase.js wrapper
// No Add Fee modal — dedicated pages only

import {
    initializeApp,
    getApps,
    getApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    getDatabase,
    ref,
    get,
    push,
    set,
    update,
    remove
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";


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


// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const app = getApps().length
    ? getApp()
    : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getDatabase(app);


// ============================================================
// AUTHORIZATION
// ============================================================

function ensureAdmin() {

    const user = auth.currentUser;

    if (!user || user.uid !== ADMIN_USER_UID) {
        throw new Error("Unauthorized administrator access.");
    }

    return user;
}


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


function money(value) {

    const amount = Number(value) || 0;

    return `₹${amount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}


function getAcademicYearValue() {

    if (window.getAcademicYear) {
        return window.getAcademicYear();
    }

    const year = new Date().getFullYear();

    return `${year}-${year + 1}`;
}


function normaliseRecords(data) {

    if (!data || typeof data !== "object") {
        return [];
    }

    return Object.entries(data).map(([id, value]) => ({
        id,
        ...(value || {})
    }));
}


// ============================================================
// LOAD FEE DATA
// ============================================================

async function loadFeeData() {

    ensureAdmin();

    const [
        feeSnapshot,
        studentSnapshot,
        paymentSnapshot
    ] = await Promise.all([
        get(ref(db, "feeRecords")),
        get(ref(db, "students")),
        get(ref(db, "payments"))
    ]);

    window.FEE_RECORDS = normaliseRecords(
        feeSnapshot.exists()
            ? feeSnapshot.val()
            : {}
    );

    window.STUDENTS = normaliseRecords(
        studentSnapshot.exists()
            ? studentSnapshot.val()
            : {}
    );

    window.PAYMENTS = normaliseRecords(
        paymentSnapshot.exists()
            ? paymentSnapshot.val()
            : {}
    );

    renderFees();

    return {
        fees: window.FEE_RECORDS,
        students: window.STUDENTS,
        payments: window.PAYMENTS
    };
}


// ============================================================
// RENDER FEE STATS
// ============================================================

function renderFeeStats(records) {

    const statsGrid =
        document.getElementById("feeStatsGrid");

    if (!statsGrid) return;

    const totalAmount = records.reduce(
        (sum, fee) =>
            sum + Number(fee.amount || fee.totalAmount || 0),
        0
    );

    const totalPaid = records.reduce(
        (sum, fee) =>
            sum + Number(fee.paid || fee.paidAmount || 0),
        0
    );

    const totalPending = records.reduce(
        (sum, fee) =>
            sum + Number(
                fee.pending ??
                fee.pendingAmount ??
                (
                    Number(fee.amount || fee.totalAmount || 0) -
                    Number(fee.paid || fee.paidAmount || 0)
                )
            ),
        0
    );

    const paidCount = records.filter(
        fee => String(fee.status || "").toLowerCase() === "paid"
    ).length;

    statsGrid.innerHTML = `
        <div class="stat-card">
            <span class="stat-label">Total Fee Records</span>
            <span class="stat-value">${records.length}</span>
        </div>

        <div class="stat-card">
            <span class="stat-label">Total Amount</span>
            <span class="stat-value">${money(totalAmount)}</span>
        </div>

        <div class="stat-card">
            <span class="stat-label">Total Paid</span>
            <span class="stat-value">${money(totalPaid)}</span>
        </div>

        <div class="stat-card">
            <span class="stat-label">Pending Amount</span>
            <span class="stat-value">${money(totalPending)}</span>
        </div>

        <div class="stat-card">
            <span class="stat-label">Paid Records</span>
            <span class="stat-value">${paidCount}</span>
        </div>
    `;
}


// ============================================================
// RENDER FEES TABLE
// ============================================================

function renderFees() {

    const allFees = window.FEE_RECORDS || [];

    const searchInput =
        document.getElementById("feeSearch");

    const filterInput =
        document.getElementById("feeFilter");

    const search =
        searchInput?.value.trim().toLowerCase() || "";

    const filter =
        filterInput?.value || "all";

    renderFeeStats(allFees);

    let records = [...allFees];


    // --------------------------------------------------------
    // SEARCH
    // --------------------------------------------------------

    if (search) {

        records = records.filter((fee) => {

            const studentName =
                fee.studentName ||
                fee.student ||
                "";

            const enrollmentId =
                fee.enrollmentId ||
                fee.studentEnrollmentId ||
                "";

            const feeType =
                fee.feeType ||
                fee.type ||
                "";

            return (
                String(studentName)
                    .toLowerCase()
                    .includes(search) ||

                String(enrollmentId)
                    .toLowerCase()
                    .includes(search) ||

                String(feeType)
                    .toLowerCase()
                    .includes(search)
            );
        });
    }


    // --------------------------------------------------------
    // STATUS FILTER
    // --------------------------------------------------------

    if (filter !== "all") {

        records = records.filter(
            fee =>
                String(fee.status || "").toLowerCase() ===
                filter.toLowerCase()
        );
    }


    const tbody =
        document.getElementById("feeTableBody");

    if (!tbody) return;


    if (!records.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="9"
                    style="text-align:center; padding:2rem;">
                    No fee records found.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML = records.map((fee, index) => {

        const total =
            Number(
                fee.amount ??
                fee.totalAmount ??
                0
            );

        const paid =
            Number(
                fee.paid ??
                fee.paidAmount ??
                0
            );

        const pending =
            Number(
                fee.pending ??
                fee.pendingAmount ??
                Math.max(total - paid, 0)
            );

        const status =
            fee.status ||
            (
                pending <= 0
                    ? "paid"
                    : paid > 0
                        ? "partial"
                        : "pending"
            );

        return `
            <tr>

                <td>${index + 1}</td>

                <td>
                    ${escapeHTML(
                        fee.studentName ||
                        fee.student ||
                        "—"
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        fee.class ||
                        "—"
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        fee.feeType ||
                        fee.type ||
                        "—"
                    )}
                </td>

                <td>${money(total)}</td>

                <td>${money(paid)}</td>

                <td>${money(pending)}</td>

                <td>
                    <span class="status-badge status-${escapeHTML(
                        String(status).toLowerCase()
                    )}">
                        ${escapeHTML(status)}
                    </span>
                </td>

                <td>
                    <div class="actions-cell">

                        <button
                            type="button"
                            class="btn btn-secondary"
                            data-action="viewFee"
                            data-id="${escapeHTML(fee.id)}">
                            View
                        </button>

                        <button
                            type="button"
                            class="btn btn-primary"
                            data-action="collectFee"
                            data-id="${escapeHTML(fee.id)}">
                            Collect
                        </button>

                        <button
                            type="button"
                            class="btn btn-delete"
                            data-action="deleteFee"
                            data-id="${escapeHTML(fee.id)}">
                            Delete
                        </button>

                    </div>
                </td>

            </tr>
        `;

    }).join("");


    // --------------------------------------------------------
    // ACTION EVENTS
    // --------------------------------------------------------

    tbody
        .querySelectorAll('[data-action="viewFee"]')
        .forEach(button => {

            button.addEventListener(
                "click",
                () => viewFee(button.dataset.id)
            );
        });


    tbody
        .querySelectorAll('[data-action="collectFee"]')
        .forEach(button => {

            button.addEventListener(
                "click",
                () => collectFee(button.dataset.id)
            );
        });


    tbody
        .querySelectorAll('[data-action="deleteFee"]')
        .forEach(button => {

            button.addEventListener(
                "click",
                () => deleteFee(button.dataset.id)
            );
        });
}


// ============================================================
// ADD FEE — DEDICATED PAGE
// ============================================================

function showAddFeePage() {

    window.location.href = "add-fee.html";
}


// ============================================================
// COLLECT FEE — DEDICATED PAGE
// ============================================================

function showCollectFeePage() {

    window.location.href = "collect-fee.html";
}


// ============================================================
// PAY FEE — DEDICATED PAGE
// ============================================================

function showPayFeePage() {

    window.location.href = "pay-fee.html";
}


// ============================================================
// BULK FEE — DEDICATED PAGE
// ============================================================

function showBulkFeePage() {

    window.location.href = "bulk-fee.html";
}


// ============================================================
// VIEW FEE
// ============================================================

function viewFee(id) {

    const fee =
        (window.FEE_RECORDS || [])
            .find(record => record.id === id);

    if (!fee) return;


    const total =
        Number(
            fee.amount ??
            fee.totalAmount ??
            0
        );

    const paid =
        Number(
            fee.paid ??
            fee.paidAmount ??
            0
        );

    const pending =
        Number(
            fee.pending ??
            fee.pendingAmount ??
            Math.max(total - paid, 0)
        );


    if (window.openModal) {

        window.openModal(
            "Fee Details",
            `
                <div class="detail-grid">

                    <div>
                        <strong>Student</strong>
                        <span>
                            ${escapeHTML(
                                fee.studentName ||
                                fee.student ||
                                "—"
                            )}
                        </span>
                    </div>

                    <div>
                        <strong>Enrollment ID</strong>
                        <span>
                            ${escapeHTML(
                                fee.enrollmentId ||
                                "—"
                            )}
                        </span>
                    </div>

                    <div>
                        <strong>Class</strong>
                        <span>
                            ${escapeHTML(
                                fee.class ||
                                "—"
                            )}
                        </span>
                    </div>

                    <div>
                        <strong>Section</strong>
                        <span>
                            ${escapeHTML(
                                fee.section ||
                                "—"
                            )}
                        </span>
                    </div>

                    <div>
                        <strong>Fee Type</strong>
                        <span>
                            ${escapeHTML(
                                fee.feeType ||
                                fee.type ||
                                "—"
                            )}
                        </span>
                    </div>

                    <div>
                        <strong>Academic Year</strong>
                        <span>
                            ${escapeHTML(
                                fee.academicYear ||
                                getAcademicYearValue()
                            )}
                        </span>
                    </div>

                    <div>
                        <strong>Total</strong>
                        <span>${money(total)}</span>
                    </div>

                    <div>
                        <strong>Paid</strong>
                        <span>${money(paid)}</span>
                    </div>

                    <div>
                        <strong>Pending</strong>
                        <span>${money(pending)}</span>
                    </div>

                    <div>
                        <strong>Status</strong>
                        <span>
                            ${escapeHTML(
                                fee.status ||
                                "pending"
                            )}
                        </span>
                    </div>

                </div>
            `,
            "Close",
            null
        );
    }
}


// ============================================================
// COLLECT SPECIFIC FEE
// ============================================================

function collectFee(id) {

    window.location.href =
        `collect-fee.html?id=${encodeURIComponent(id)}`;
}


// ============================================================
// ADD FEE RECORD
// ============================================================

async function addFeeRecord(feeData) {

    ensureAdmin();

    if (!feeData || typeof feeData !== "object") {
        throw new Error("Invalid fee data.");
    }

    const newFee = {
        ...feeData,

        academicYear:
            feeData.academicYear ||
            getAcademicYearValue(),

        createdAt:
            feeData.createdAt ||
            new Date().toISOString()
    };

    const newRef =
        push(ref(db, "feeRecords"));

    await set(
        newRef,
        newFee
    );

    return {
        id: newRef.key,
        ...newFee
    };
}


// ============================================================
// PROCESS INDIVIDUAL PAYMENT
// ============================================================

async function processIndividualFeePayment(
    feeId,
    paymentAmount,
    paymentMethod = "Cash",
    remarks = ""
) {

    ensureAdmin();

    const amount =
        Number(paymentAmount);

    if (!feeId) {
        throw new Error("Fee record ID is required.");
    }

    if (!amount || amount <= 0) {
        throw new Error("Enter a valid payment amount.");
    }


    const feeRef =
        ref(db, `feeRecords/${feeId}`);

    const feeSnapshot =
        await get(feeRef);

    if (!feeSnapshot.exists()) {
        throw new Error("Fee record not found.");
    }


    const fee =
        feeSnapshot.val();


    const total =
        Number(
            fee.amount ??
            fee.totalAmount ??
            0
        );

    const previousPaid =
        Number(
            fee.paid ??
            fee.paidAmount ??
            0
        );

    const previousPending =
        Math.max(
            total - previousPaid,
            0
        );


    if (amount > previousPending) {
        throw new Error(
            "Payment amount cannot exceed pending amount."
        );
    }


    const newPaid =
        previousPaid + amount;

    const newPending =
        Math.max(
            total - newPaid,
            0
        );

    const status =
        newPending <= 0
            ? "paid"
            : newPaid > 0
                ? "partial"
                : "pending";


    await update(
        feeRef,
        {
            paid: newPaid,
            paidAmount: newPaid,
            pending: newPending,
            pendingAmount: newPending,
            status,
            updatedAt: new Date().toISOString()
        }
    );


    const paymentData = {

        feeId,

        studentId:
            fee.studentId ||
            "",

        enrollmentId:
            fee.enrollmentId ||
            "",

        studentName:
            fee.studentName ||
            fee.student ||
            "",

        amount,

        paymentMethod,

        remarks,

        academicYear:
            fee.academicYear ||
            getAcademicYearValue(),

        paymentDate:
            new Date().toISOString(),

        createdAt:
            new Date().toISOString()
    };


    const paymentRef =
        push(ref(db, "payments"));

    await set(
        paymentRef,
        paymentData
    );


    return {
        feeId,
        paymentId: paymentRef.key,
        ...paymentData,
        total,
        paid: newPaid,
        pending: newPending,
        status
    };
}


// ============================================================
// DELETE FEE
// ============================================================

async function deleteFee(id) {

    ensureAdmin();

    if (!id) return;


    const confirmed =
        window.showConfirm
            ? await window.showConfirm(
                "Delete Fee",
                "Are you sure you want to delete this fee record?"
            )
            : window.confirm(
                "Are you sure you want to delete this fee record?"
            );

    if (!confirmed) return;


    try {

        await remove(
            ref(db, `feeRecords/${id}`)
        );

        window.FEE_RECORDS =
            (window.FEE_RECORDS || [])
                .filter(fee => fee.id !== id);

        renderFees();

        if (window.showToast) {
            window.showToast(
                "Fee record deleted successfully.",
                "success"
            );
        }

    } catch (error) {

        console.error(
            "Delete fee error:",
            error
        );

        if (window.showToast) {
            window.showToast(
                "Failed to delete fee record.",
                "error"
            );
        }

        throw error;
    }
}


// ============================================================
// SEARCH + FILTER EVENTS
// ============================================================

function initializeFeePage() {

    const search =
        document.getElementById("feeSearch");

    const filter =
        document.getElementById("feeFilter");

    if (search) {
        search.addEventListener(
            "input",
            renderFees
        );
    }

    if (filter) {
        filter.addEventListener(
            "change",
            renderFees
        );
    }


    const addButton =
        document.getElementById("addFeeBtn");

    if (addButton) {

        addButton.addEventListener(
            "click",
            showAddFeePage
        );
    }


    const collectButton =
        document.getElementById("collectFeeBtn");

    if (collectButton) {

        collectButton.addEventListener(
            "click",
            showCollectFeePage
        );
    }


    const payButton =
        document.getElementById("payFeeBtn");

    if (payButton) {

        payButton.addEventListener(
            "click",
            showPayFeePage
        );
    }


    const bulkButton =
        document.getElementById("bulkFeeBtn");

    if (bulkButton) {

        bulkButton.addEventListener(
            "click",
            showBulkFeePage
        );
    }


    loadFeeData()
        .catch(error => {

            console.error(
                "Fee data loading error:",
                error
            );

            if (window.showToast) {

                window.showToast(
                    "Unable to load fee data.",
                    "error"
                );
            }
        });
}


// ============================================================
// GLOBAL EXPORTS
// ============================================================

window.loadFeeData =
    loadFeeData;

window.renderFees =
    renderFees;

window.showAddFeePage =
    showAddFeePage;

window.showCollectFeePage =
    showCollectFeePage;

window.showPayFeePage =
    showPayFeePage;

window.showBulkFeePage =
    showBulkFeePage;

window.viewFee =
    viewFee;

window.collectFee =
    collectFee;

window.addFeeRecord =
    addFeeRecord;

window.processIndividualFeePayment =
    processIndividualFeePayment;

window.deleteFee =
    deleteFee;


// ============================================================
// INITIALIZE
// ============================================================

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeFeePage
    );

} else {

    initializeFeePage();
}
