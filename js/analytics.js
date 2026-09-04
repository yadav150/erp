// ============================================================
// REPORTS & ANALYTICS MODULE
// Charts, KPIs, Filters, Export
// ============================================================

// No new charting framework/library is introduced.
// Uses existing Chart, jsPDF, html2canvas and XLSX instances
// already available in the project.

// ============================================================
// STATE
// ============================================================

let chartInstances = {};

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

function getRoleCount(teachers, role) {
  return teachers.filter(
    teacher =>
      String(teacher.role || "").toLowerCase() === role
  ).length;
}

function getFeePaid(fee) {
  return toNumber(
    fee.paid ??
    fee.paidAmount ??
    fee.amountPaid
  );
}

function getFeePending(fee) {
  return toNumber(
    fee.pending ??
    fee.pendingAmount ??
    fee.balance
  );
}

function getSalaryAmount(record) {
  return toNumber(
    record.amount ??
    record.salaryAmount ??
    record.paidAmount
  );
}

function getStatus(value) {
  return String(value || "").toLowerCase();
}

// ============================================================
// RENDER ANALYTICS DASHBOARD
// ============================================================

function renderAnalytics() {
  const students = window.STUDENTS || [];
  const teachers = window.TEACHERS || [];
  const fees = window.FEE_RECORDS || [];
  const salary = window.SALARY_RECORDS || [];

  // ==========================================================
  // KPI CALCULATIONS
  // ==========================================================

  const totalStudents = students.length;

  const totalTeachers =
    getRoleCount(teachers, "teacher");

  const totalStaff =
    getRoleCount(teachers, "staff");

  const totalCollected =
    fees.reduce(
      (sum, fee) => sum + getFeePaid(fee),
      0
    );

  const totalPending =
    fees.reduce(
      (sum, fee) => sum + getFeePending(fee),
      0
    );

  const totalSalaryPaid =
    salary
      .filter(
        record => getStatus(record.status) === "paid"
      )
      .reduce(
        (sum, record) =>
          sum + getSalaryAmount(record),
        0
      );

  const totalSalaryPending =
    salary
      .filter(
        record => getStatus(record.status) === "pending"
      )
      .reduce(
        (sum, record) =>
          sum + getSalaryAmount(record),
        0
      );

  const overdueCount =
    fees.filter(
      fee => getStatus(fee.status) === "overdue"
    ).length;

  // ==========================================================
  // KPI CARDS
  // ==========================================================

  const statsGrid =
    document.getElementById("analyticsStatsGrid");

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
        <span class="stat-label">Overdue</span>
        <span class="stat-value">${overdueCount}</span>
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

  renderCharts();
}

// ============================================================
// DESTROY EXISTING CHARTS
// ============================================================

function destroyCharts() {
  Object.values(chartInstances).forEach(chart => {
    try {
      if (chart && typeof chart.destroy === "function") {
        chart.destroy();
      }
    } catch (error) {
      console.warn(
        "Unable to destroy chart:",
        error
      );
    }
  });

  chartInstances = {};
}

// ============================================================
// CHART RENDERING
// ============================================================

function renderCharts() {
  const students = window.STUDENTS || [];
  const teachers = window.TEACHERS || [];
  const fees = window.FEE_RECORDS || [];
  const payments = window.PAYMENTS || [];

  destroyCharts();

  // Do not attempt to create charts when Chart.js
  // is not already available in the project.
  if (typeof Chart === "undefined") {
    console.warn(
      "Chart library is not available."
    );
    return;
  }

  // ==========================================================
  // 1. STUDENTS BY CLASS — BAR CHART
  // ==========================================================

  const classCounts = {};

  students.forEach(student => {
    const className =
      student.class ??
      student.className ??
      "Unassigned";

    const key = String(className);

    classCounts[key] =
      (classCounts[key] || 0) + 1;
  });

  const classes = Object.keys(classCounts).sort(
    (a, b) => {
      const numberA = Number(a);
      const numberB = Number(b);

      if (
        Number.isFinite(numberA) &&
        Number.isFinite(numberB)
      ) {
        return numberA - numberB;
      }

      return a.localeCompare(b);
    }
  );

  const studentCounts =
    classes.map(
      className => classCounts[className]
    );

  const ctx1 =
    document.getElementById(
      "chartStudentsByClass"
    );

  if (ctx1) {
    chartInstances.studentsByClass =
      new Chart(ctx1, {
        type: "bar",

        data: {
          labels: classes.map(className =>
            className === "Unassigned"
              ? className
              : `Class ${className}`
          ),

          datasets: [{
            label: "Students",
            data: studentCounts,
            borderWidth: 1
          }]
        },

        options: {
          responsive: true,
          maintainAspectRatio: false,

          plugins: {
            legend: {
              display: false
            }
          },

          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0
              }
            }
          }
        }
      });
  }

  // ==========================================================
  // 2. FEE COLLECTION TREND — LAST 6 MONTHS
  // ==========================================================

  const now = new Date();

  const monthLabels = [];
  const monthlyData = [];

  for (let i = 5; i >= 0; i--) {
    const date =
      new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );

    const month = date.getMonth();
    const year = date.getFullYear();

    monthLabels.push(
      date.toLocaleString("en-IN", {
        month: "short"
      })
    );

    const monthlyTotal =
      payments
        .filter(payment => {
          const paymentDate =
            new Date(
              payment.date ??
              payment.createdAt ??
              payment.timestamp ??
              ""
            );

          if (
            Number.isNaN(
              paymentDate.getTime()
            )
          ) {
            return false;
          }

          return (
            paymentDate.getMonth() === month &&
            paymentDate.getFullYear() === year
          );
        })
        .reduce(
          (sum, payment) =>
            sum +
            toNumber(
              payment.amount ??
              payment.paidAmount
            ),
          0
        );

    monthlyData.push(monthlyTotal);
  }

  const ctx2 =
    document.getElementById(
      "chartFeeTrend"
    );

  if (ctx2) {
    chartInstances.feeTrend =
      new Chart(ctx2, {
        type: "line",

        data: {
          labels: monthLabels,

          datasets: [{
            label: "Fee Collected (₹)",
            data: monthlyData,
            tension: 0.3,
            fill: true
          }]
        },

        options: {
          responsive: true,
          maintainAspectRatio: false,

          plugins: {
            legend: {
              display: false
            },

            tooltip: {
              callbacks: {
                label: context =>
                  formatCurrency(
                    context.raw
                  )
              }
            }
          },

          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
  }

  // ==========================================================
  // 3. FEE STATUS DISTRIBUTION — PIE CHART
  // ==========================================================

  const paid =
    fees.filter(
      fee => getStatus(fee.status) === "paid"
    ).length;

  const pending =
    fees.filter(
      fee => getStatus(fee.status) === "pending"
    ).length;

  const overdue =
    fees.filter(
      fee => getStatus(fee.status) === "overdue"
    ).length;

  const ctx3 =
    document.getElementById(
      "chartFeeStatus"
    );

  if (ctx3) {
    chartInstances.feeStatus =
      new Chart(ctx3, {
        type: "pie",

        data: {
          labels: [
            "Paid",
            "Pending",
            "Overdue"
          ],

          datasets: [{
            data: [
              paid,
              pending,
              overdue
            ],
            borderWidth: 1
          }]
        },

        options: {
          responsive: true,
          maintainAspectRatio: false,

          plugins: {
            legend: {
              position: "bottom"
            }
          }
        }
      });
  }

  // ==========================================================
  // 4. TEACHERS VS STAFF — DONUT CHART
  // ==========================================================

  const teacherCount =
    getRoleCount(
      teachers,
      "teacher"
    );

  const staffCount =
    getRoleCount(
      teachers,
      "staff"
    );

  const ctx4 =
    document.getElementById(
      "chartTeacherStaff"
    );

  if (ctx4) {
    chartInstances.teacherStaff =
      new Chart(ctx4, {
        type: "doughnut",

        data: {
          labels: [
            "Teachers",
            "Staff"
          ],

          datasets: [{
            data: [
              teacherCount,
              staffCount
            ],
            borderWidth: 1
          }]
        },

        options: {
          responsive: true,
          maintainAspectRatio: false,

          plugins: {
            legend: {
              position: "bottom"
            }
          }
        }
      });
  }
}

// ============================================================
// FILTER HANDLERS
// ============================================================

function applyAnalyticsFilters() {
  /*
   * Filtering can be expanded when the final analytics
   * filter fields and database structure are locked.
   *
   * Current behavior keeps the dashboard synchronized
   * with the latest global Firebase data.
   */

  renderAnalytics();

  if (typeof window.showToast === "function") {
    window.showToast(
      "Analytics refreshed.",
      "info"
    );
  }
}

function resetAnalyticsFilters() {
  const year =
    document.getElementById(
      "analyticsYear"
    );

  const startDate =
    document.getElementById(
      "analyticsStartDate"
    );

  const endDate =
    document.getElementById(
      "analyticsEndDate"
    );

  const classFilter =
    document.getElementById(
      "analyticsClass"
    );

  const status =
    document.getElementById(
      "analyticsStatus"
    );

  if (year) {
    year.value = "";
  }

  if (startDate) {
    startDate.value = "";
  }

  if (endDate) {
    endDate.value = "";
  }

  if (classFilter) {
    classFilter.value = "all";
  }

  if (status) {
    status.value = "all";
  }

  renderAnalytics();

  if (typeof window.showToast === "function") {
    window.showToast(
      "Filters reset.",
      "info"
    );
  }
}

// ============================================================
// EXPORT — PDF
// ============================================================

async function exportAnalyticsPDF() {
  if (
    !window.jspdf ||
    typeof window.jspdf.jsPDF !== "function"
  ) {
    window.showToast?.(
      "jsPDF library not loaded.",
      "error"
    );
    return;
  }

  if (
    typeof html2canvas !== "function"
  ) {
    window.showToast?.(
      "PDF capture library not loaded.",
      "error"
    );
    return;
  }

  const source =
    document.querySelector(
      "#page-analytics"
    );

  if (!source) {
    window.showToast?.(
      "Analytics content not found.",
      "error"
    );
    return;
  }

  window.showToast?.(
    "Generating PDF...",
    "info"
  );

  let container = null;

  try {
    container =
      document.createElement("div");

    container.style.cssText = `
      position: absolute;
      left: -100000px;
      top: 0;
      width: 1100px;
      padding: 20px;
      background: #ffffff;
      box-sizing: border-box;
    `;

    const clone =
      source.cloneNode(true);

    // Remove interactive controls from exported copy.
    clone
      .querySelectorAll(
        ".analytics-filters button, .analytics-export-buttons, [data-export], button"
      )
      .forEach(element =>
        element.remove()
      );

    container.appendChild(clone);
    document.body.appendChild(container);

    const canvas =
      await html2canvas(
        container,
        {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false
        }
      );

    const imgData =
      canvas.toDataURL(
        "image/png"
      );

    const { jsPDF } =
      window.jspdf;

    const pdf =
      new jsPDF(
        "p",
        "mm",
        "a4"
      );

    const pageWidth =
      pdf.internal.pageSize.getWidth();

    const pageHeight =
      pdf.internal.pageSize.getHeight();

    const margin = 8;

    const imgWidth =
      pageWidth - margin * 2;

    const imgHeight =
      (canvas.height * imgWidth) /
      canvas.width;

    let remainingHeight =
      imgHeight;

    let position =
      margin;

    pdf.addImage(
      imgData,
      "PNG",
      margin,
      position,
      imgWidth,
      imgHeight
    );

    remainingHeight -=
      pageHeight - margin * 2;

    while (
      remainingHeight > 0
    ) {
      position =
        margin -
        (
          imgHeight -
          remainingHeight
        );

      pdf.addPage();

      pdf.addImage(
        imgData,
        "PNG",
        margin,
        position,
        imgWidth,
        imgHeight
      );

      remainingHeight -=
        pageHeight - margin * 2;
    }

    const timestamp =
      new Date()
        .toISOString()
        .replace(
          /[:.]/g,
          "-"
        );

    pdf.save(
      `Analytics_Dashboard_${timestamp}.pdf`
    );

    window.showToast?.(
      "PDF exported successfully.",
      "success"
    );

  } catch (error) {
    console.error(
      "Analytics PDF export error:",
      error
    );

    window.showToast?.(
      "PDF export failed.",
      "error"
    );

  } finally {
    if (container) {
      container.remove();
    }
  }
}

// ============================================================
// EXPORT — EXCEL
// ============================================================

function exportAnalyticsExcel() {
  const XLSX =
    window.XLSX;

  if (!XLSX) {
    window.showToast?.(
      "XLSX library not loaded.",
      "error"
    );
    return;
  }

  const students =
    window.STUDENTS || [];

  const teachers =
    window.TEACHERS || [];

  const fees =
    window.FEE_RECORDS || [];

  const salary =
    window.SALARY_RECORDS || [];

  const totalCollected =
    fees.reduce(
      (sum, fee) =>
        sum + getFeePaid(fee),
      0
    );

  const totalPending =
    fees.reduce(
      (sum, fee) =>
        sum + getFeePending(fee),
      0
    );

  const totalSalaryPaid =
    salary
      .filter(
        record =>
          getStatus(record.status) === "paid"
      )
      .reduce(
        (sum, record) =>
          sum + getSalaryAmount(record),
        0
      );

  const totalSalaryPending =
    salary
      .filter(
        record =>
          getStatus(record.status) === "pending"
      )
      .reduce(
        (sum, record) =>
          sum + getSalaryAmount(record),
        0
      );

  const kpiData = [
    [
      "Metric",
      "Value"
    ],

    [
      "Total Students",
      students.length
    ],

    [
      "Total Teachers",
      getRoleCount(
        teachers,
        "teacher"
      )
    ],

    [
      "Total Staff",
      getRoleCount(
        teachers,
        "staff"
      )
    ],

    [
      "Fee Collected",
      totalCollected
    ],

    [
      "Pending Fees",
      totalPending
    ],

    [
      "Overdue Records",
      fees.filter(
        fee =>
          getStatus(
            fee.status
          ) === "overdue"
      ).length
    ],

    [
      "Salary Paid",
      totalSalaryPaid
    ],

    [
      "Salary Pending",
      totalSalaryPending
    ],

    [
      "Generated On",
      new Date().toLocaleString(
        "en-IN"
      )
    ]
  ];

  const worksheet =
    XLSX.utils.aoa_to_sheet(
      kpiData
    );

  worksheet["!cols"] = [
    { wch: 28 },
    { wch: 24 }
  ];

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Analytics"
  );

  const timestamp =
    new Date()
      .toISOString()
      .replace(
        /[:.]/g,
        "-"
      );

  XLSX.writeFile(
    workbook,
    `Analytics_Dashboard_${timestamp}.xlsx`
  );

  window.showToast?.(
    "Excel exported successfully.",
    "success"
  );
}

// ============================================================
// EVENT BINDINGS
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {
    const applyBtn =
      document.getElementById(
        "analyticsApplyBtn"
      );

    if (applyBtn) {
      applyBtn.addEventListener(
        "click",
        applyAnalyticsFilters
      );
    }

    const resetBtn =
      document.getElementById(
        "analyticsResetBtn"
      );

    if (resetBtn) {
      resetBtn.addEventListener(
        "click",
        resetAnalyticsFilters
      );
    }

    const pdfBtn =
      document.getElementById(
        "exportAnalyticsPdf"
      );

    if (pdfBtn) {
      pdfBtn.addEventListener(
        "click",
        exportAnalyticsPDF
      );
    }

    const excelBtn =
      document.getElementById(
        "exportAnalyticsExcel"
      );

    if (excelBtn) {
      excelBtn.addEventListener(
        "click",
        exportAnalyticsExcel
      );
    }
  }
);

// ============================================================
// EXPOSE GLOBALLY
// ============================================================

window.renderAnalytics =
  renderAnalytics;

window.renderAnalyticsCharts =
  renderCharts;

window.applyAnalyticsFilters =
  applyAnalyticsFilters;

window.resetAnalyticsFilters =
  resetAnalyticsFilters;

window.exportAnalyticsPDF =
  exportAnalyticsPDF;

window.exportAnalyticsExcel =
  exportAnalyticsExcel;
  
