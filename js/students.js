```javascript
// ============================================================
// STUDENTS MODULE
// CRUD, RENDER, SEARCH, FILTERS, ADD STUDENT PAGE
// ============================================================

import { createData, updateData, deleteData } from './firebase.js';


// ============================================================
// HELPERS
// ============================================================

function escapeHTML(value) {
  if (value === null || value === undefined) return '';

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


function getCurrentAcademicYear() {
  return (
    window.CURRENT_ACADEMIC_YEAR ||
    document.getElementById('academicYear')?.textContent?.trim() ||
    ''
  );
}


function generateEnrollmentId() {
  const year = new Date().getFullYear();
  const students = Array.isArray(window.STUDENTS) ? window.STUDENTS : [];

  let highestNumber = 0;

  students.forEach(student => {
    const enrollmentId = String(student.enrollmentId || '');

    if (
      enrollmentId.length === 9 &&
      enrollmentId.startsWith(String(year))
    ) {
      const numberPart = parseInt(enrollmentId.slice(4), 10);

      if (!Number.isNaN(numberPart)) {
        highestNumber = Math.max(highestNumber, numberPart);
      }
    }
  });

  const nextNumber = highestNumber + 1;

  return `${year}${String(nextNumber).padStart(5, '0')}`;
}


// ============================================================
// RENDER STUDENTS TABLE + STATS
// ============================================================

function renderStudents(filter = 'all', search = '') {

  const students = Array.isArray(window.STUDENTS)
    ? window.STUDENTS
    : [];


  // ----------------------------------------------------------
  // STATS
  // ----------------------------------------------------------

  const totalStudents = students.length;

  const paidCount = students.filter(
    student => student.feeStatus === 'paid'
  ).length;

  const pendingCount = students.filter(
    student => student.feeStatus === 'pending'
  ).length;

  const overdueCount = students.filter(
    student => student.feeStatus === 'overdue'
  ).length;


  const statsGrid = document.getElementById('studentStatsGrid');

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


  // ----------------------------------------------------------
  // FILTER
  // ----------------------------------------------------------

  let list = [...students];

  if (filter && filter !== 'all') {

    const selectedClass = String(filter).trim();

    list = list.filter(student =>
      String(student.class || '').trim() === selectedClass
    );
  }


  // ----------------------------------------------------------
  // SEARCH
  // ----------------------------------------------------------

  if (search.trim()) {

    const query = search.trim().toLowerCase();

    list = list.filter(student => {

      const searchableText = [
        student.name,
        student.enrollmentId,
        student.admissionNo,
        student.mobile,
        student.guardian,
        student.class,
        student.section,
        student.roll
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(query);
    });
  }


  // ----------------------------------------------------------
  // TABLE
  // ----------------------------------------------------------

  const tbody = document.getElementById('studentTableBody');

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
      student.feeStatus || 'pending'
    ).toLowerCase();

    return `
      <tr>

        <td>${index + 1}</td>

        <td>
          ${escapeHTML(student.enrollmentId || '-')}
        </td>

        <td>
          ${escapeHTML(student.name || '-')}
        </td>

        <td>
          ${escapeHTML(student.class || '-')}
        </td>

        <td>
          ${escapeHTML(student.section || '-')}
        </td>

        <td>
          ${escapeHTML(student.roll || '-')}
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
              class="btn-edit"
              data-id="${escapeHTML(student.id)}"
              data-action="editStudent">
              Edit
            </button>

            <button
              type="button"
              class="btn-delete"
              data-id="${escapeHTML(student.id)}"
              data-action="deleteStudent">
              Delete
            </button>

          </div>
        </td>

      </tr>
    `;
  }).join('');


  // ----------------------------------------------------------
  // EDIT EVENTS
  // ----------------------------------------------------------

  tbody
    .querySelectorAll('[data-action="editStudent"]')
    .forEach(button => {

      button.addEventListener('click', () => {
        editStudent(button.dataset.id);
      });

    });


  // ----------------------------------------------------------
  // DELETE EVENTS
  // ----------------------------------------------------------

  tbody
    .querySelectorAll('[data-action="deleteStudent"]')
    .forEach(button => {

      button.addEventListener('click', () => {
        deleteStudent(button.dataset.id);
      });

    });
}


// ============================================================
// ADD STUDENT
// DEDICATED PAGE — NO MODAL
// ============================================================

async function addStudent() {

  const form = document.getElementById('addStudentForm');

  if (!form) return;


  // ----------------------------------------------------------
  // READ FORM DATA
  // ----------------------------------------------------------

  const name =
    document.getElementById('studentName')?.value.trim() || '';

  const classValue =
    document.getElementById('studentClass')?.value.trim() || '';

  const section =
    document.getElementById('studentSection')?.value.trim() || '';

  const roll =
    document.getElementById('studentRoll')?.value.trim() || '';

  const feeStatus =
    document.getElementById('studentFeeStatus')?.value || 'pending';

  const admissionNo =
    document.getElementById('studentAdmissionNo')?.value.trim() || '';

  const mobile =
    document.getElementById('studentMobile')?.value.trim() || '';

  const guardian =
    document.getElementById('studentGuardian')?.value.trim() || '';

  const photo =
    document.getElementById('studentPhotoUrl')?.value.trim() || '';


  // ----------------------------------------------------------
  // VALIDATION
  // ----------------------------------------------------------

  if (!name || !classValue || !roll) {

    if (window.showToast) {
      window.showToast(
        'Please fill all required fields.',
        'error'
      );
    }

    return;
  }


  // ----------------------------------------------------------
  // GENERATE UNIQUE ENROLLMENT ID
  // ----------------------------------------------------------

  const enrollmentId = generateEnrollmentId();


  // ----------------------------------------------------------
  // STUDENT OBJECT
  // ----------------------------------------------------------

  const newStudent = {

    enrollmentId,

    name,

    class: classValue,

    section,

    roll,

    feeStatus,

    admissionNo,

    mobile,

    guardian,

    photo,

    academicYear: getCurrentAcademicYear(),

    createdAt: Date.now(),

    updatedAt: Date.now()
  };


  // ----------------------------------------------------------
  // SUBMIT BUTTON
  // ----------------------------------------------------------

  const submitButton =
    form.querySelector(
      'button[type="submit"], #submitStudentBtn'
    );


  if (submitButton) {

    submitButton.disabled = true;

    submitButton.dataset.originalText =
      submitButton.textContent;

    submitButton.innerHTML = `
      <span class="spinner"></span>
      Saving Student...
    `;
  }


  // ----------------------------------------------------------
  // LOADING
  // ----------------------------------------------------------

  if (window.showLoading) {
    window.showLoading();
  }


  try {

    // --------------------------------------------------------
    // SAVE TO REALTIME DATABASE
    // --------------------------------------------------------

    const result = await createData(
      'students',
      newStudent
    );


    // --------------------------------------------------------
    // UPDATE LOCAL ARRAY
    // --------------------------------------------------------

    if (!Array.isArray(window.STUDENTS)) {
      window.STUDENTS = [];
    }

    window.STUDENTS.push(result);


    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    if (window.showToast) {

      window.showToast(
        `Student added successfully. Enrollment ID: ${enrollmentId}`,
        'success'
      );
    }


    // --------------------------------------------------------
    // SHOW GENERATED ENROLLMENT ID
    // --------------------------------------------------------

    const generatedId =
      document.getElementById('generatedEnrollmentId');

    if (generatedId) {
      generatedId.textContent = enrollmentId;
    }


    // --------------------------------------------------------
    // OPTIONAL SUCCESS SECTION
    // --------------------------------------------------------

    const successSection =
      document.getElementById('studentSuccess');

    if (successSection) {
      successSection.hidden = false;
    }


    // --------------------------------------------------------
    // DISABLE SUBMIT AFTER SUCCESS
    // --------------------------------------------------------

    if (submitButton) {

      submitButton.disabled = true;

      submitButton.textContent =
        'Student Added Successfully';
    }


    // --------------------------------------------------------
    // DASHBOARD UPDATE
    // --------------------------------------------------------

    if (window.renderDashboard) {
      window.renderDashboard();
    }


  } catch (error) {

    console.error(
      'Add student error:',
      error
    );


    if (window.showToast) {

      window.showToast(
        'Failed to add student. Please try again.',
        'error'
      );
    }


    if (submitButton) {

      submitButton.disabled = false;

      submitButton.textContent =
        submitButton.dataset.originalText ||
        'Submit';
    }


  } finally {

    if (window.hideLoading) {
      window.hideLoading();
    }
  }
}


// ============================================================
// EDIT STUDENT
// ============================================================

async function editStudent(id) {

  const student =
    window.STUDENTS?.find(
      item => item.id === id
    );

  if (!student) return;


  // ----------------------------------------------------------
  // DEDICATED EDIT PAGE
  // ----------------------------------------------------------

  const editUrl =
    `edit-student.html?id=${encodeURIComponent(id)}`;


  window.location.href = editUrl;
}


// ============================================================
// UPDATE STUDENT
// Used by edit-student.html
// ============================================================

async function updateStudent(id) {

  const student =
    window.STUDENTS?.find(
      item => item.id === id
    );

  if (!student) return;


  const form =
    document.getElementById('editStudentForm');

  if (!form) return;


  const name =
    document.getElementById('studentName')?.value.trim() || '';

  const classValue =
    document.getElementById('studentClass')?.value.trim() || '';

  const section =
    document.getElementById('studentSection')?.value.trim() || '';

  const roll =
    document.getElementById('studentRoll')?.value.trim() || '';

  const feeStatus =
    document.getElementById('studentFeeStatus')?.value || 'pending';

  const admissionNo =
    document.getElementById('studentAdmissionNo')?.value.trim() || '';

  const mobile =
    document.getElementById('studentMobile')?.value.trim() || '';

  const guardian =
    document.getElementById('studentGuardian')?.value.trim() || '';

  const photo =
    document.getElementById('studentPhotoUrl')?.value.trim() ||
    student.photo ||
    '';


  if (!name || !classValue || !roll) {

    if (window.showToast) {

      window.showToast(
        'Please fill all required fields.',
        'error'
      );
    }

    return;
  }


  const updatedStudent = {

    name,

    class: classValue,

    section,

    roll,

    feeStatus,

    admissionNo,

    mobile,

    guardian,

    photo,

    academicYear:
      student.academicYear ||
      getCurrentAcademicYear(),

    updatedAt: Date.now()
  };


  const submitButton =
    form.querySelector(
      'button[type="submit"], #updateStudentBtn'
    );


  if (submitButton) {

    submitButton.disabled = true;

    submitButton.dataset.originalText =
      submitButton.textContent;

    submitButton.innerHTML = `
      <span class="spinner"></span>
      Updating...
    `;
  }


  try {

    await updateData(
      'students',
      id,
      updatedStudent
    );


    const index =
      window.STUDENTS.findIndex(
        item => item.id === id
      );


    if (index !== -1) {

      window.STUDENTS[index] = {
        ...window.STUDENTS[index],
        ...updatedStudent
      };
    }


    if (window.showToast) {

      window.showToast(
        'Student updated successfully.',
        'success'
      );
    }


    if (window.renderDashboard) {
      window.renderDashboard();
    }


    if (submitButton) {
      submitButton.textContent =
        'Updated Successfully';
    }


  } catch (error) {

    console.error(
      'Update student error:',
      error
    );


    if (window.showToast) {

      window.showToast(
        'Failed to update student. Please try again.',
        'error'
      );
    }


    if (submitButton) {

      submitButton.disabled = false;

      submitButton.textContent =
        submitButton.dataset.originalText ||
        'Update';
    }
  }
}


// ============================================================
// DELETE STUDENT
// ============================================================

async function deleteStudent(id) {

  const student =
    window.STUDENTS?.find(
      item => item.id === id
    );

  if (!student) return;


  const confirmed = confirm(
    `Are you sure you want to delete ${student.name || 'this student'}?`
  );


  if (!confirmed) return;


  const button =
    document.querySelector(
      `button[data-id="${CSS.escape(String(id))}"][data-action="deleteStudent"]`
    );


  if (button) {

    button.disabled = true;

    button.dataset.originalText =
      button.textContent;

    button.textContent =
      'Deleting...';
  }


  try {

    await deleteData(
      'students',
      id
    );


    window.STUDENTS =
      window.STUDENTS.filter(
        item => item.id !== id
      );


    if (window.showToast) {

      window.showToast(
        'Student deleted successfully.',
        'success'
      );
    }


    renderStudents(

      document.getElementById(
        'studentFilter'
      )?.value || 'all',

      document.getElementById(
        'studentSearch'
      )?.value || ''
    );


    if (window.renderDashboard) {
      window.renderDashboard();
    }


  } catch (error) {

    console.error(
      'Delete student error:',
      error
    );


    if (window.showToast) {

      window.showToast(
        'Failed to delete student. Please try again.',
        'error'
      );
    }


    if (button) {

      button.disabled = false;

      button.textContent =
        button.dataset.originalText ||
        'Delete';
    }
  }
}


// ============================================================
// ADD STUDENT PAGE INITIALIZATION
// ============================================================

function initializeAddStudentPage() {

  const form =
    document.getElementById('addStudentForm');

  if (!form) return;


  form.addEventListener(
    'submit',
    event => {

      event.preventDefault();

      addStudent();
    }
  );


  // ----------------------------------------------------------
  // AUTO DISPLAY ENROLLMENT ID
  // ----------------------------------------------------------

  const enrollmentPreview =
    document.getElementById(
      'generatedEnrollmentId'
    );


  if (enrollmentPreview) {

    enrollmentPreview.textContent =
      generateEnrollmentId();
  }
}


// ============================================================
// STUDENT LIST EVENT BINDINGS
// ============================================================

function initializeStudentList() {

  const searchInput =
    document.getElementById(
      'studentSearch'
    );


  if (searchInput) {

    searchInput.addEventListener(
      'input',
      event => {

        const filter =
          document.getElementById(
            'studentFilter'
          )?.value || 'all';


        renderStudents(
          filter,
          event.target.value
        );
      }
    );
  }


  const filterSelect =
    document.getElementById(
      'studentFilter'
    );


  if (filterSelect) {

    filterSelect.addEventListener(
      'change',
      event => {

        const search =
          document.getElementById(
            'studentSearch'
          )?.value || '';


        renderStudents(
          event.target.value,
          search
        );
      }
    );
  }


  renderStudents(
    filterSelect?.value || 'all',
    searchInput?.value || ''
  );
}


// ============================================================
// DOM READY
// ============================================================

document.addEventListener(
  'DOMContentLoaded',
  () => {

    initializeAddStudentPage();

    initializeStudentList();
  }
);


// ============================================================
// EXPOSE GLOBALLY
// ============================================================

window.renderStudents =
  renderStudents;

window.addStudent =
  addStudent;

window.editStudent =
  editStudent;

window.updateStudent =
  updateStudent;

window.deleteStudent =
  deleteStudent;

window.generateEnrollmentId =
  generateEnrollmentId;
```
