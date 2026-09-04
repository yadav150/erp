// ============================================================
// EXPORT MODULE – PDF, EXCEL, CSV
// UPDATED FOR NEW ERP STRUCTURE
// ============================================================

// ============================================================
// HELPERS
// ============================================================

function escapeCSV(value) {
  if (value === null || value === undefined) return "";

  const text = String(value);

  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n")
  ) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function getStudents() {
  return window.STUDENTS || [];
}

function getTeachers() {
  return window.TEACHERS || [];
}

function getFees() {
  return window.FEE_RECORDS || [];
}

function getSalaryRecords() {
  return window.SALARY_RECORDS || [];
}

// ============================================================
// GET FILTERED DATA
// ============================================================

function getFilteredData(module) {

  switch (module) {

    // --------------------------------------------------------
    // STUDENTS
    // --------------------------------------------------------

    case "students": {

      const filter =
        document.getElementById(
          "studentFilter"
        )?.value || "all";

      const search =
        document.getElementById(
          "studentSearch"
        )?.value || "";

      let data = [
        ...getStudents()
      ];

      if (filter !== "all") {

        data = data.filter(
          student =>
            Number(student.class) ===
            Number(filter)
        );
      }

      if (search.trim()) {

        const q =
          search.trim().toLowerCase();

        data = data.filter(student => {

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

      return data;
    }

    // --------------------------------------------------------
    // TEACHERS
    // --------------------------------------------------------

    case "teachers": {

      const filter =
        document.getElementById(
          "staffFilter"
        )?.value || "all";

      const search =
        document.getElementById(
          "staffSearch"
        )?.value || "";

      let data = [
        ...getTeachers()
      ];

      if (filter !== "all") {

        data = data.filter(
          teacher =>
            teacher.role === filter
        );
      }

      if (search.trim()) {

        const q =
          search.trim().toLowerCase();

        data = data.filter(teacher => {

          return (
            String(teacher.name || "")
              .toLowerCase()
              .includes(q) ||

            String(
              teacher.employeeId || ""
            )
              .toLowerCase()
              .includes(q) ||

            String(
              teacher.subDepartment ||
              teacher.subject ||
              ""
            )
              .toLowerCase()
              .includes(q) ||

            String(teacher.email || "")
              .toLowerCase()
              .includes(q)
          );
        });
      }

      return data;
    }

    // --------------------------------------------------------
    // FEES
    // --------------------------------------------------------

    case "fees": {

      const statusFilter =
        document.getElementById(
          "feeStatusFilter"
        )?.value || "all";

      const search =
        document.getElementById(
          "feeUniversalSearch"
        )?.value || "";

      const classFilter =
        document.getElementById(
          "feeClassFilter"
        )?.value || "all";

      const sectionFilter =
        document.getElementById(
          "feeSectionFilter"
        )?.value || "all";

      const sessionFilter =
        document.getElementById(
          "feeSession"
        )?.value || "all";

      let data = [
        ...getFees()
      ];

      const students =
        getStudents();

      if (statusFilter !== "all") {

        data = data.filter(
          fee =>
            fee.status ===
            statusFilter
        );
      }

      if (
        sessionFilter !== "all"
      ) {

        data = data.filter(
          fee =>
            !fee.academicYear ||
            fee.academicYear ===
              sessionFilter
        );
      }

      if (search.trim()) {

        const q =
          search.trim().toLowerCase();

        data = data.filter(fee => {

          const student =
            students.find(
              s =>
                s.id ===
                fee.studentId
            );

          if (!student) {
            return false;
          }

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

        data = data.filter(fee => {

          const student =
            students.find(
              s =>
                s.id ===
                fee.studentId
            );

          return (
            student &&
            Number(student.class) ===
              Number(classFilter)
          );
        });
      }

      if (
        sectionFilter !== "all"
      ) {

        data = data.filter(fee => {

          const student =
            students.find(
              s =>
                s.id ===
                fee.studentId
            );

          return (
            student &&
            String(
              student.section || ""
            ) ===
              String(sectionFilter)
          );
        });
      }

      return data;
    }

    // --------------------------------------------------------
    // SALARY
    // --------------------------------------------------------

    case "salary": {

      const statusFilter =
        document.getElementById(
          "salaryFilter"
        )?.value || "all";

      const search =
        document.getElementById(
          "salarySearch"
        )?.value || "";

      let data = [
        ...getSalaryRecords()
      ];

      if (
        statusFilter !== "all"
      ) {

        data = data.filter(
          salary =>
            salary.status ===
            statusFilter
        );
      }

      if (search.trim()) {

        const q =
          search.trim().toLowerCase();

        data = data.filter(
          salary =>
            String(
              salary.employeeName ||
              ""
            )
              .toLowerCase()
              .includes(q) ||

            String(
              salary.employeeId ||
              ""
            )
              .toLowerCase()
              .includes(q) ||

            String(
              salary.role ||
              ""
            )
              .toLowerCase()
              .includes(q)
        );
      }

      return data;
    }

    default:
      return [];
  }
}

// ============================================================
// BUILD EXPORT DATA
// ============================================================

function buildExportData(
  module,
  data
) {

  let title = "";
  let headers = [];
  let rows = [];

  switch (module) {

    // --------------------------------------------------------
    // STUDENTS
    // --------------------------------------------------------

    case "students":

      title = "Student List";

      headers = [
        "#",
        "Enrollment ID",
        "Name",
        "Class",
        "Section",
        "Roll No",
        "Admission No",
        "Mobile",
        "Guardian",
        "Fee Status"
      ];

      rows = data.map(
        (student, index) => [

          index + 1,

          student.enrollmentId ||
            student.admissionNo ||
            "",

          student.name || "",

          student.class || "",

          student.section || "",

          student.roll || "",

          student.admissionNo || "",

          student.mobile || "",

          student.guardian || "",

          student.feeStatus || ""
        ]
      );

      break;

    // --------------------------------------------------------
    // TEACHERS
    // --------------------------------------------------------

    case "teachers":

      title =
        "Teachers & Staff";

      headers = [
        "#",
        "Employee ID",
        "Name",
        "Role",
        "Designation",
        "Sub-Department / Subject",
        "Email",
        "Mobile",
        "Monthly Salary"
      ];

      rows = data.map(
        (teacher, index) => [

          index + 1,

          teacher.employeeId || "",

          teacher.name || "",

          teacher.role || "",

          teacher.designation || "",

          teacher.subDepartment ||
            teacher.subject ||
            "",

          teacher.email || "",

          teacher.mobile || "",

          teacher.salary ||
            teacher.monthlySalary ||
            teacher.salaryAmount ||
            ""
        ]
      );

      break;

    // --------------------------------------------------------
    // FEES
    // --------------------------------------------------------

    case "fees": {

      title =
        "Fee Records";

      headers = [
        "#",
        "Enrollment ID",
        "Student",
        "Class",
        "Section",
        "Fee Type",
        "Amount",
        "Paid",
        "Pending",
        "Status",
        "Academic Year"
      ];

      const students =
        getStudents();

      rows = data.map(
        (fee, index) => {

          const student =
            students.find(
              s =>
                s.id ===
                fee.studentId
            );

          return [

            index + 1,

            student?.enrollmentId ||
              student?.admissionNo ||
              "",

            student?.name ||
              "Unknown",

            student?.class ||
              "",

            student?.section ||
              "",

            fee.feeType ||
              "",

            Number(
              fee.amount || 0
            ),

            Number(
              fee.paid || 0
            ),

            Number(
              fee.pending || 0
            ),

            fee.status ||
              "",

            fee.academicYear ||
              ""
          ];
        }
      );

      break;
    }

    // --------------------------------------------------------
    // SALARY
    // --------------------------------------------------------

    case "salary":

      title =
        "Salary Records";

      headers = [
        "#",
        "Employee ID",
        "Employee",
        "Role",
        "Month",
        "Year",
        "Amount",
        "Status",
        "Payment Method",
        "Academic Year"
      ];

      rows = data.map(
        (salary, index) => [

          index + 1,

          salary.employeeId || "",

          salary.employeeName || "",

          salary.role || "",

          salary.month || "",

          salary.year || "",

          Number(
            salary.amount || 0
          ),

          salary.status || "",

          salary.paymentMethod ||
            "",

          salary.academicYear ||
            ""
        ]
      );

      break;

    default:
      return null;
  }

  return {
    title,
    headers,
    rows
  };
}

// ============================================================
// EXPORT TO PDF
// ============================================================

function exportToPDF(module) {

  const data =
    getFilteredData(module);

  if (!data.length) {

    window.showToast(
      "No data to export.",
      "info"
    );

    return;
  }

  const exportData =
    buildExportData(
      module,
      data
    );

  if (!exportData) return;

  const {
    title,
    headers,
    rows
  } = exportData;

  if (
    !window.jspdf ||
    !window.jspdf.jsPDF
  ) {

    window.showToast(
      "jsPDF library not loaded.",
      "error"
    );

    return;
  }

  const jsPDF =
    window.jspdf.jsPDF;

  if (
    typeof window.jspdf.jsPDF !==
      "function"
  ) {
    window.showToast(
      "PDF generator unavailable.",
      "error"
    );
    return;
  }

  if (
    typeof jsPDF.API.autoTable !==
      "function"
  ) {

    window.showToast(
      "PDF table plugin not loaded.",
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
      "landscape",
      "mm",
      "a4"
    );

  const generatedAt =
    new Date().toLocaleString();

  doc.setFontSize(18);
  doc.text(
    title,
    14,
    20
  );

  doc.setFontSize(9);
  doc.text(
    `Generated on: ${generatedAt}`,
    14,
    27
  );

  doc.autoTable({

    head: [headers],

    body: rows,

    startY: 33,

    styles: {
      fontSize: 7,
      cellPadding: 2,
      overflow: "linebreak"
    },

    headStyles: {
      fontSize: 7,
      fontStyle: "bold"
    },

    margin: {
      left: 10,
      right: 10
    },

    tableWidth: "auto"
  });

  const date =
    new Date()
      .toISOString()
      .slice(0, 10);

  doc.save(
    `${module}_${date}.pdf`
  );

  window.showToast(
    "PDF exported successfully.",
    "success"
  );
}

// ============================================================
// EXPORT TO EXCEL
// ============================================================

function exportToExcel(module) {

  const data =
    getFilteredData(module);

  if (!data.length) {

    window.showToast(
      "No data to export.",
      "info"
    );

    return;
  }

  const exportData =
    buildExportData(
      module,
      data
    );

  if (!exportData) return;

  const XLSX =
    window.XLSX;

  if (!XLSX) {

    window.showToast(
      "XLSX library not loaded.",
      "error"
    );

    return;
  }

  window.showToast(
    "Generating Excel...",
    "info"
  );

  const {
    title,
    headers,
    rows
  } = exportData;

  const workbook =
    XLSX.utils.book_new();

  const worksheet =
    XLSX.utils.aoa_to_sheet([
      [title],
      [`Generated on: ${new Date().toLocaleString()}`],
      [],
      headers,
      ...rows
    ]);

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Records"
  );

  const date =
    new Date()
      .toISOString()
      .slice(0, 10);

  XLSX.writeFile(
    workbook,
    `${module}_${date}.xlsx`
  );

  window.showToast(
    "Excel exported successfully.",
    "success"
  );
}

// ============================================================
// EXPORT TO CSV
// ============================================================

function exportToCSV(module) {

  const data =
    getFilteredData(module);

  if (!data.length) {

    window.showToast(
      "No data to export.",
      "info"
    );

    return;
  }

  const exportData =
    buildExportData(
      module,
      data
    );

  if (!exportData) return;

  const {
    title,
    headers,
    rows
  } = exportData;

  window.showToast(
    "Generating CSV...",
    "info"
  );

  const csvRows = [

    [
      escapeCSV(title)
    ].join(","),

    [
      escapeCSV(
        `Generated on: ${new Date().toLocaleString()}`
      )
    ].join(","),

    "",

    headers
      .map(escapeCSV)
      .join(","),

    ...rows.map(
      row =>
        row
          .map(escapeCSV)
          .join(",")
    )
  ];

  const csv =
    "\uFEFF" +
    csvRows.join("\n");

  const blob =
    new Blob(
      [csv],
      {
        type:
          "text/csv;charset=utf-8;"
      }
    );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;

  link.download =
    `${module}_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

  document.body.appendChild(link);

  link.click();

  link.remove();

  URL.revokeObjectURL(url);

  window.showToast(
    "CSV exported successfully.",
    "success"
  );
}

// ============================================================
// UNIVERSAL EXPORT BUTTON BINDING
// ============================================================

function bindExportButtons() {

  document
    .querySelectorAll(
      "[data-module][data-export]"
    )
    .forEach(button => {

      if (
        button.dataset.exportBound ===
        "true"
      ) {
        return;
      }

      button.dataset.exportBound =
        "true";

      button.addEventListener(
        "click",
        function () {

          const module =
            this.dataset.module;

          const type =
            this.dataset.export;

          if (
            type === "pdf"
          ) {
            exportToPDF(module);
          }

          else if (
            type === "excel"
          ) {
            exportToExcel(module);
          }

          else if (
            type === "csv"
          ) {
            exportToCSV(module);
          }

        }
      );

    });

  // Fee-specific IDs
  const feePdf =
    document.getElementById(
      "feeExportPdf"
    );

  const feeExcel =
    document.getElementById(
      "feeExportExcel"
    );

  const feeCsv =
    document.getElementById(
      "feeExportCsv"
    );

  if (feePdf) {
    feePdf.addEventListener(
      "click",
      () => exportToPDF("fees")
    );
  }

  if (feeExcel) {
    feeExcel.addEventListener(
      "click",
      () => exportToExcel("fees")
    );
  }

  if (feeCsv) {
    feeCsv.addEventListener(
      "click",
      () => exportToCSV("fees")
    );
  }
}

// ============================================================
// INITIALIZE
// ============================================================

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    bindExportButtons
  );

} else {

  bindExportButtons();

}

// ============================================================
// EXPOSE GLOBALLY
// ============================================================

window.getFilteredData =
  getFilteredData;

window.buildExportData =
  buildExportData;

window.exportToPDF =
  exportToPDF;

window.exportToExcel =
  exportToExcel;

window.exportToCSV =
  exportToCSV;
