import {
  getDatabase,
  ref,
  get,
  push,
  set,
  update,
  remove
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

import {
  initializeApp,
  getApps,
  getApp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

// ============================================================
// FIREBASE
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

function escapeHTML(value) {
  if (typeof window.escapeHTML === "function") {
    return window.escapeHTML(value);
  }

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getAcademicYear() {
  if (typeof window.getCurrentAcademicYear === "function") {
    return window.getCurrentAcademicYear();
  }

  const year = new Date().getFullYear();
  return `${year}-${year + 1}`;
}

// ============================================================
// ENROLLMENT ID
// FORMAT: YYYY + 5 DIGIT SEQUENCE
// EXAMPLE: 202600001
// ============================================================

async function generateEnrollmentId() {
  const year = new Date().getFullYear();
  const studentsRef = ref(db, "students");
  const snapshot = await get(studentsRef);

  let highestSequence = 0;
  const prefix = String(year);

  if (snapshot.exists()) {
    const data = snapshot.val();

    Object.values(data).forEach(student => {
      const enrollmentId = String(student.enrollmentId || "");

      if (enrollmentId.startsWith(prefix)) {
        const sequence = parseInt(
          enrollmentId.substring(prefix.length),
          10
        );

        if (!Number.isNaN(sequence) && sequence > highestSequence) {
          highestSequence = sequence;
        }
      }
    });
  }

  return `${prefix}${String(highestSequence + 1).padStart(5, "0")}`;
}

// ============================================================
// LOAD STUDENTS
// ============================================================

async function loadStudents() {
  try {
    const snapshot = await get(ref(db, "students"));

    if (!snapshot.exists()) {
      window.STUDENTS = [];
      renderStudents();
      return [];
    }

    const data = snapshot.val();

    window.STUDENTS = Object.entries(data).map(([id, student]) => ({
      id,
      ...student
    }));

    renderStudents();

    return window.STUDENTS;
  } catch (error) {
    console.error("Load students error:", error);

    if (typeof window.showToast === "function") {
      window.showToast("Failed to load student data.", "error");
    }

    return [];
  }
}

// ============================================================
// RENDER STUDENTS TABLE + STATS
// ============================================================

function renderStudents(filter = "all", search = "") {
  const students = window.STUDENTS || [];

  const totalStudents = students.length;
  const paidCount = students.filter(
    student => student.feeStatus === "paid"
  ).length;

  const pendingCount = students.filter(
    student => student.feeStatus === "pending"
  ).length;

  const overdueCount = students.filter(
    student => student.feeStatus === "overdue"
  ).length;

  const statsGrid = document.getElementById("studentStatsGrid");

  if (statsGrid) {
    statsGrid.innerHTML = `
      <div class="stat-card">
        <span class="stat-label">Total Students</span>
        <span class="stat-value">${totalStudents}</span>
      </div>

      <div class="stat-card">
        <span class="stat-label">Fee Paid</span>
        <span class="stat-value">${paidCount}</span>
      </div>

      <div class="stat-card">
        <span class="stat-label">Fee Pending</span>
        <span class="stat-value">${pendingCount}</span>
      </div>

      <div class="stat-card">
        <span class="stat-label">Overdue</span>
        <span class="stat-value">${overdueCount}</span>
      </div>
    `;
  }

  let list = [...students];

  if (filter !== "all") {
    list = list.filter(
      student => String(student.class) === String(filter)
    );
  }

  const query = search.trim().toLowerCase();

  if (query) {
    list = list.filter(student => {
      const values = [
        student.enrollmentId,
        student.name,
        student.admissionNo,
        student.mobile,
        student.guardian,
        student.section,
        student.roll
      ];

      return values.some(value =>
        String(value ?? "").toLowerCase().includes(query)
      );
    });
  }

  const tbody = document.getElementById("studentTableBody");

  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          No students found.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map((student, index) => {
    const feeStatus = String(
      student.feeStatus || "pending"
    ).toLowerCase();

    return `
      <tr>
        <td>${index + 1}</td>

        <td>
          ${escapeHTML(student.enrollmentId || "-")}
        </td>

        <td>
          ${escapeHTML(student.name || "-")}
        </td>

        <td>
          ${escapeHTML(student.class || "-")}
        </td>

        <td>
          ${escapeHTML(student.section || "-")}
        </td>

        <td>
          ${escapeHTML(student.roll || "-")}
        </td>

        <td>
          <span class="status-badge status-${escapeHTML(feeStatus)}">
            ${escapeHTML(feeStatus)}
          </span>
        </td>

        <td>
          <div class="actions-cell">

            <button
              type="button"
              class="btn-view"
              data-id="${escapeHTML(student.id)}"
              data-action="viewStudent"
            >
              View
            </button>

            <button
              type="button"
              class="btn-edit"
              data-id="${escapeHTML(student.id)}"
              data-action="editStudent"
            >
              Edit
            </button>

            <button
              type="button"
              class="btn-delete"
              data-id="${escapeHTML(student.id)}"
              data-action="deleteStudent"
            >
              Delete
            </button>

          </div>
        </td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll('[data-action="viewStudent"]').forEach(button => {
    button.addEventListener("click", () => {
      viewStudent(button.dataset.id);
    });
  });

  tbody.querySelectorAll('[data-action="editStudent"]').forEach(button => {
    button.addEventListener("click", () => {
      editStudent(button.dataset.id);
    });
  });

  tbody.querySelectorAll('[data-action="deleteStudent"]').forEach(button => {
    button.addEventListener("click", () => {
      deleteStudent(button.dataset.id);
    });
  });
}

// ============================================================
// VIEW STUDENT
// VIEWING MAY USE MODAL
// ============================================================

function viewStudent(id) {
  const student = (window.STUDENTS || []).find(
    item => item.id === id
  );

  if (!student) {
    if (typeof window.showToast === "function") {
      window.showToast("Student record not found.", "error");
    }
    return;
  }

  const photo = student.photo
    ? `
      <img
        src="${escapeHTML(student.photo)}"
        alt="Student Photo"
        class="student-view-photo"
      >
    `
    : "";

  const content = `
    <div class="student-view">

      <div class="student-view-header">
        ${photo}

        <div>
          <h3>${escapeHTML(student.name || "-")}</h3>
          <p>
            Enrollment ID:
            <strong>${escapeHTML(student.enrollmentId || "-")}</strong>
          </p>
        </div>
      </div>

      <div class="student-details-grid">

        <div>
          <span>Admission No</span>
          <strong>${escapeHTML(student.admissionNo || "-")}</strong>
        </div>

        <div>
          <span>Class</span>
          <strong>${escapeHTML(student.class || "-")}</strong>
        </div>

        <div>
          <span>Section</span>
          <strong>${escapeHTML(student.section || "-")}</strong>
        </div>

        <div>
          <span>Roll No</span>
          <strong>${escapeHTML(student.roll || "-")}</strong>
        </div>

        <div>
          <span>Guardian</span>
          <strong>${escapeHTML(student.guardian || "-")}</strong>
        </div>

        <div>
          <span>Mobile</span>
          <strong>${escapeHTML(student.mobile || "-")}</strong>
        </div>

        <div>
          <span>Academic Year</span>
          <strong>${escapeHTML(
            student.academicYear || getAcademicYear()
          )}</strong>
        </div>

        <div>
          <span>Fee Status</span>
          <strong>${escapeHTML(student.feeStatus || "pending")}</strong>
        </div>

      </div>

    </div>
  `;

  if (typeof window.openModal === "function") {
    window.openModal("Student Details", content);
  }
}

// ============================================================
// ADD STUDENT
// DEDICATED PAGE ONLY
// ============================================================

async function addStudent() {
  const form = document.getElementById("addStudentForm");

  if (!form) return;

  const formData = new FormData(form);

  const name = String(formData.get("name") || "").trim();
  const classValue = String(formData.get("class") || "").trim();
  const section = String(formData.get("section") || "").trim();
  const rollValue = String(formData.get("roll") || "").trim();

  if (!name || !classValue || !section || !rollValue) {
    if (typeof window.showToast === "function") {
      window.showToast(
        "Please fill all required fields.",
        "error"
      );
    }
    return;
  }

  const submitButton =
    form.querySelector('[type="submit"]');

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Saving...";
  }

  if (typeof window.showLoading === "function") {
    window.showLoading("Saving student...");
  }

  try {
    const enrollmentId = await generateEnrollmentId();

    const student = {
      enrollmentId,
      admissionNo:
        String(formData.get("admissionNo") || "").trim(),

      name,

      class: Number(classValue),

      section,

      roll: Number(rollValue),

      feeStatus:
        String(formData.get("feeStatus") || "pending").trim(),

      mobile:
        String(formData.get("mobile") || "").trim(),

      guardian:
        String(formData.get("guardian") || "").trim(),

      photo:
        String(formData.get("photo") || "").trim(),

      academicYear:
        String(
          formData.get("academicYear") ||
          getAcademicYear()
        ).trim(),

      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const studentsRef = ref(db, "students");
    const newStudentRef = push(studentsRef);

    await set(newStudentRef, student);

    const savedStudent = {
      id: newStudentRef.key,
      ...student
    };

    window.STUDENTS = window.STUDENTS || [];
    window.STUDENTS.push(savedStudent);

    if (typeof window.showToast === "function") {
      window.showToast(
        `Student added successfully. Enrollment ID: ${enrollmentId}`,
        "success"
      );
    }

    form.reset();

    if (typeof window.renderDashboard === "function") {
      window.renderDashboard();
    }

    renderStudents();

    setTimeout(() => {
      window.location.href = "students.html";
    }, 700);

  } catch (error) {
    console.error("Add student error:", error);

    if (typeof window.showToast === "function") {
      window.showToast(
        "Failed to add student. Please try again.",
        "error"
      );
    }

  } finally {
    if (typeof window.hideLoading === "function") {
      window.hideLoading();
    }

    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Save Student";
    }
  }
}

// ============================================================
// EDIT STUDENT
// DEDICATED PAGE ONLY
// ============================================================

function editStudent(id) {
  if (!id) return;

  window.location.href =
    `edit-student.html?id=${encodeURIComponent(id)}`;
}

// ============================================================
// UPDATE STUDENT
// ============================================================

async function updateStudent(id) {
  const form = document.getElementById("editStudentForm");

  if (!form || !id) return;

  const existingStudent = (window.STUDENTS || []).find(
    student => student.id === id
  );

  if (!existingStudent) {
    if (typeof window.showToast === "function") {
      window.showToast("Student record not found.", "error");
    }
    return;
  }

  const formData = new FormData(form);

  const name = String(formData.get("name") || "").trim();
  const classValue = String(formData.get("class") || "").trim();
  const section = String(formData.get("section") || "").trim();
  const rollValue = String(formData.get("roll") || "").trim();

  if (!name || !classValue || !section || !rollValue) {
    if (typeof window.showToast === "function") {
      window.showToast(
        "Please fill all required fields.",
        "error"
      );
    }
    return;
  }

  const submitButton =
    form.querySelector('[type="submit"]');

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Updating...";
  }

  if (typeof window.showLoading === "function") {
    window.showLoading("Updating student...");
  }

  try {
    const updatedStudent = {
      ...existingStudent,

      name,

      class: Number(classValue),

      section,

      roll: Number(rollValue),

      admissionNo:
        String(
          formData.get("admissionNo") ??
          existingStudent.admissionNo ??
          ""
        ).trim(),

      feeStatus:
        String(
          formData.get("feeStatus") ??
          existingStudent.feeStatus ??
          "pending"
        ).trim(),

      mobile:
        String(
          formData.get("mobile") ??
          existingStudent.mobile ??
          ""
        ).trim(),

      guardian:
        String(
          formData.get("guardian") ??
          existingStudent.guardian ??
          ""
        ).trim(),

      photo:
        String(
          formData.get("photo") ??
          existingStudent.photo ??
          ""
        ).trim(),

      academicYear:
        String(
          formData.get("academicYear") ||
          existingStudent.academicYear ||
          getAcademicYear()
        ).trim(),

      updatedAt: Date.now()
    };

    delete updatedStudent.id;

    await update(
      ref(db, `students/${id}`),
      updatedStudent
    );

    const index = window.STUDENTS.findIndex(
      student => student.id === id
    );

    if (index !== -1) {
      window.STUDENTS[index] = {
        id,
        ...updatedStudent
      };
    }

    if (typeof window.showToast === "function") {
      window.showToast(
        "Student updated successfully.",
        "success"
      );
    }

    renderStudents();

    setTimeout(() => {
      window.location.href = "students.html";
    }, 700);

  } catch (error) {
    console.error("Update student error:", error);

    if (typeof window.showToast === "function") {
      window.showToast(
        "Failed to update student. Please try again.",
        "error"
      );
    }

  } finally {
    if (typeof window.hideLoading === "function") {
      window.hideLoading();
    }

    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Update Student";
    }
  }
}

// ============================================================
// DELETE STUDENT
// ============================================================

async function deleteStudent(id) {
  if (!id) return;

  const student = (window.STUDENTS || []).find(
    item => item.id === id
  );

  if (!student) return;

  const deleteAction = async () => {
    try {
      const button = document.querySelector(
        `button[data-id="${CSS.escape(id)}"][data-action="deleteStudent"]`
      );

      if (button) {
        button.disabled = true;
        button.textContent = "Deleting...";
      }

      if (typeof window.showLoading === "function") {
        window.showLoading("Deleting student...");
      }

      await remove(ref(db, `students/${id}`));

      window.STUDENTS =
        (window.STUDENTS || []).filter(
          item => item.id !== id
        );

      if (typeof window.showToast === "function") {
        window.showToast(
          "Student deleted successfully.",
          "success"
        );
      }

      renderStudents();

      if (typeof window.renderDashboard === "function") {
        window.renderDashboard();
      }

    } catch (error) {
      console.error("Delete student error:", error);

      if (typeof window.showToast === "function") {
        window.showToast(
          "Failed to delete student.",
          "error"
        );
      }

    } finally {
      if (typeof window.hideLoading === "function") {
        window.hideLoading();
      }
    }
  };

  if (typeof window.showConfirm === "function") {
    window.showConfirm(
      `Are you sure you want to delete ${student.name || "this student"}?`,
      deleteAction
    );
  } else {
    if (confirm(
      `Are you sure you want to delete ${student.name || "this student"}?`
    )) {
      await deleteAction();
    }
  }
}

// ============================================================
// INITIALIZE STUDENT LIST
// ============================================================

function initializeStudentList() {
  const searchInput =
    document.getElementById("studentSearch");

  const filterSelect =
    document.getElementById("studentFilter");

  const addButton =
    document.getElementById("addStudentBtn");

  if (addButton) {
    addButton.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "add-student.html";
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderStudents(
        filterSelect?.value || "all",
        searchInput.value
      );
    });
  }

  if (filterSelect) {
    filterSelect.addEventListener("change", () => {
      renderStudents(
        filterSelect.value,
        searchInput?.value || ""
      );
    });
  }

  loadStudents();
}

// ============================================================
// INITIALIZE ADD STUDENT PAGE
// ============================================================

function initializeAddStudentPage() {
  const form =
    document.getElementById("addStudentForm");

  if (!form) return;

  const academicYearInput =
    form.querySelector('[name="academicYear"]');

  if (academicYearInput && !academicYearInput.value) {
    academicYearInput.value = getAcademicYear();
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    await addStudent();
  });
}

// ============================================================
// INITIALIZE EDIT STUDENT PAGE
// ============================================================

async function initializeEditStudentPage() {
  const form =
    document.getElementById("editStudentForm");

  if (!form) return;

  const params = new URLSearchParams(
    window.location.search
  );

  const id = params.get("id");

  if (!id) {
    if (typeof window.showToast === "function") {
      window.showToast(
        "Student record ID is missing.",
        "error"
      );
    }
    return;
  }

  await loadStudents();

  const student = (window.STUDENTS || []).find(
    item => item.id === id
  );

  if (!student) {
    if (typeof window.showToast === "function") {
      window.showToast(
        "Student record not found.",
        "error"
      );
    }
    return;
  }

  form.querySelector('[name="name"]')?.setAttribute(
    "value",
    student.name || ""
  );

  const fields = [
    "admissionNo",
    "class",
    "section",
    "roll",
    "feeStatus",
    "mobile",
    "guardian",
    "photo",
    "academicYear"
  ];

  fields.forEach(field => {
    const element =
      form.querySelector(`[name="${field}"]`);

    if (element) {
      element.value =
        student[field] ??
        (field === "academicYear"
          ? getAcademicYear()
          : "");
    }
  });

  const enrollmentDisplay =
    document.getElementById("editEnrollmentId");

  if (enrollmentDisplay) {
    enrollmentDisplay.textContent =
      student.enrollmentId || "-";
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    await updateStudent(id);
  });
}

// ============================================================
// GLOBAL INITIALIZATION
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  initializeStudentList();
  initializeAddStudentPage();
  initializeEditStudentPage();
});

// ============================================================
// GLOBAL EXPORTS
// ============================================================

window.loadStudents = loadStudents;
window.renderStudents = renderStudents;
window.generateEnrollmentId = generateEnrollmentId;

window.viewStudent = viewStudent;
window.addStudent = addStudent;
window.editStudent = editStudent;
window.updateStudent = updateStudent;
window.deleteStudent = deleteStudent;

window.initializeStudentList = initializeStudentList;
window.initializeAddStudentPage = initializeAddStudentPage;
window.initializeEditStudentPage = initializeEditStudentPage;
