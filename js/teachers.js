```javascript
// ============================================================
// TEACHERS & STAFF MODULE
// CRUD + RENDER + SEARCH + FILTERS + CONDITIONAL LOGIC
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


// ============================================================
// EMPLOYEE ID GENERATOR
// ============================================================

function generateEmployeeId() {

  const teachers =
    Array.isArray(window.TEACHERS)
      ? window.TEACHERS
      : [];

  let highestNumber = 0;

  teachers.forEach(teacher => {

    const employeeId =
      String(teacher.employeeId || '');

    const match =
      employeeId.match(/^EMP(\d{5})$/);

    if (match) {

      const number =
        parseInt(match[1], 10);

      if (!Number.isNaN(number)) {
        highestNumber =
          Math.max(highestNumber, number);
      }
    }
  });


  return `EMP${String(
    highestNumber + 1
  ).padStart(5, '0')}`;
}


// ============================================================
// RENDER STAFF TABLE + STATS
// ============================================================

function renderStaff(
  filter = 'all',
  search = ''
) {

  const teachers =
    Array.isArray(window.TEACHERS)
      ? window.TEACHERS
      : [];


  // ----------------------------------------------------------
  // STATS
  // ----------------------------------------------------------

  const totalTeachers =
    teachers.filter(
      teacher => teacher.role === 'teacher'
    ).length;

  const totalStaff =
    teachers.filter(
      teacher => teacher.role === 'staff'
    ).length;

  const totalEmployees =
    teachers.length;


  const statsGrid =
    document.getElementById(
      'staffStatsGrid'
    );


  if (statsGrid) {

    statsGrid.innerHTML = `

      <div class="stat-card">
        <span class="stat-label">
          Total Teachers
        </span>

        <span class="stat-value">
          ${totalTeachers}
        </span>
      </div>


      <div class="stat-card">
        <span class="stat-label">
          Total Staff
        </span>

        <span class="stat-value">
          ${totalStaff}
        </span>
      </div>


      <div class="stat-card">
        <span class="stat-label">
          Total Employees
        </span>

        <span class="stat-value">
          ${totalEmployees}
        </span>
      </div>

    `;
  }


  // ----------------------------------------------------------
  // FILTER
  // ----------------------------------------------------------

  let list = [...teachers];


  if (
    filter &&
    filter !== 'all'
  ) {

    list =
      list.filter(
        teacher =>
          teacher.role === filter
      );
  }


  // ----------------------------------------------------------
  // SEARCH
  // ----------------------------------------------------------

  if (search.trim()) {

    const query =
      search.trim().toLowerCase();


    list =
      list.filter(teacher => {

        const searchableText = [

          teacher.employeeId,

          teacher.name,

          teacher.role,

          teacher.designation,

          teacher.subDepartment,

          teacher.email,

          teacher.mobile

        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();


        return searchableText.includes(
          query
        );
      });
  }


  // ----------------------------------------------------------
  // TABLE
  // ----------------------------------------------------------

  const tbody =
    document.getElementById(
      'staffTableBody'
    );


  if (!tbody) return;


  if (list.length === 0) {

    tbody.innerHTML = `

      <tr>
        <td
          colspan="8"
          class="empty-state">
          No employees found.
        </td>
      </tr>

    `;

    return;
  }


  tbody.innerHTML =
    list.map((teacher, index) => {

      const role =
        String(
          teacher.role || 'staff'
        ).toLowerCase();


      return `

        <tr>

          <td>
            ${index + 1}
          </td>


          <td>
            ${escapeHTML(
              teacher.employeeId || '-'
            )}
          </td>


          <td>
            ${escapeHTML(
              teacher.name || '-'
            )}
          </td>


          <td>

            <span class="status-badge ${
              role === 'teacher'
                ? 'status-paid'
                : 'status-pending'
            }">

              ${escapeHTML(role)}

            </span>

          </td>


          <td>
            ${escapeHTML(
              teacher.designation || '-'
            )}
          </td>


          <td>
            ${escapeHTML(
              teacher.subDepartment || '-'
            )}
          </td>


          <td>
            ${escapeHTML(
              teacher.email || '-'
            )}
          </td>


          <td>

            <div class="actions-cell">

              <button
                type="button"
                class="btn-edit"
                data-id="${escapeHTML(
                  teacher.id
                )}"
                data-action="editStaff">
                Edit
              </button>


              <button
                type="button"
                class="btn-delete"
                data-id="${escapeHTML(
                  teacher.id
                )}"
                data-action="deleteStaff">
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
    .querySelectorAll(
      '[data-action="editStaff"]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {
          editStaff(
            button.dataset.id
          );
        }
      );

    });


  // ----------------------------------------------------------
  // DELETE EVENTS
  // ----------------------------------------------------------

  tbody
    .querySelectorAll(
      '[data-action="deleteStaff"]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {
          deleteStaff(
            button.dataset.id
          );
        }
      );

    });
}


// ============================================================
// CONDITIONAL LOGIC
// ============================================================

function setupStaffConditionalLogic(
  designationId,
  subjectGroupId
) {

  const designation =
    document.getElementById(
      designationId
    );

  const subjectGroup =
    document.getElementById(
      subjectGroupId
    );


  if (
    !designation ||
    !subjectGroup
  ) {
    return;
  }


  const update =
    () => {

      const isSubjectTeacher =
        designation.value ===
        'Subject Teacher';


      subjectGroup.style.display =
        isSubjectTeacher
          ? 'block'
          : 'none';
    };


  designation.addEventListener(
    'change',
    update
  );


  update();
}


// ============================================================
// ADD TEACHER / STAFF
// DEDICATED PAGE — NO MODAL
// ============================================================

async function addStaff() {

  const form =
    document.getElementById(
      'addStaffForm'
    );


  if (!form) return;


  const name =
    document.getElementById(
      'staffName'
    )?.value.trim() || '';


  const role =
    document.getElementById(
      'staffRole'
    )?.value || 'teacher';


  const designation =
    document.getElementById(
      'staffDesignation'
    )?.value || '';


  const subjectElement =
    document.getElementById(
      'staffSubject'
    );


  const subject =
    subjectElement
      ? subjectElement.value
      : 'N/A';


  const email =
    document.getElementById(
      'staffEmail'
    )?.value.trim() || '';


  const mobile =
    document.getElementById(
      'staffMobile'
    )?.value.trim() || '';


  const salary =
    document.getElementById(
      'staffSalary'
    )?.value.trim() || '';


  const photo =
    document.getElementById(
      'staffPhotoUrl'
    )?.value.trim() || '';


  // ----------------------------------------------------------
  // VALIDATION
  // ----------------------------------------------------------

  if (
    !name ||
    !designation ||
    !email
  ) {

    if (window.showToast) {

      window.showToast(
        'Please fill all required fields.',
        'error'
      );
    }

    return;
  }


  if (
    !email.includes('@')
  ) {

    if (window.showToast) {

      window.showToast(
        'Please enter a valid email address.',
        'error'
      );
    }

    return;
  }


  // ----------------------------------------------------------
  // EMPLOYEE ID
  // ----------------------------------------------------------

  const employeeId =
    generateEmployeeId();


  // ----------------------------------------------------------
  // STAFF OBJECT
  // ----------------------------------------------------------

  const newStaff = {

    employeeId,

    name,

    role,

    designation,

    subDepartment:
      designation === 'Subject Teacher'
        ? subject
        : 'N/A',

    email,

    mobile,

    salary,

    photo,

    createdAt: Date.now(),

    updatedAt: Date.now()
  };


  // ----------------------------------------------------------
  // SUBMIT BUTTON
  // ----------------------------------------------------------

  const submitButton =
    form.querySelector(
      'button[type="submit"], #submitStaffBtn'
    );


  if (submitButton) {

    submitButton.disabled = true;

    submitButton.dataset.originalText =
      submitButton.textContent;

    submitButton.innerHTML = `
      <span class="spinner"></span>
      Saving...
    `;
  }


  try {

    const result =
      await createData(
        'teachers',
        newStaff
      );


    if (
      !Array.isArray(
        window.TEACHERS
      )
    ) {
      window.TEACHERS = [];
    }


    window.TEACHERS.push(
      result
    );


    if (window.showToast) {

      window.showToast(
        `Added successfully. Employee ID: ${employeeId}`,
        'success'
      );
    }


    // --------------------------------------------------------
    // DISPLAY GENERATED EMPLOYEE ID
    // --------------------------------------------------------

    const generatedId =
      document.getElementById(
        'generatedEmployeeId'
      );


    if (generatedId) {
      generatedId.textContent =
        employeeId;
    }


    const successSection =
      document.getElementById(
        'staffSuccess'
      );


    if (successSection) {
      successSection.hidden = false;
    }


    if (submitButton) {

      submitButton.disabled = true;

      submitButton.textContent =
        'Added Successfully';
    }


    if (window.renderDashboard) {
      window.renderDashboard();
    }


  } catch (error) {

    console.error(
      'Add staff error:',
      error
    );


    if (window.showToast) {

      window.showToast(
        'Failed to add staff. Please try again.',
        'error'
      );
    }


    if (submitButton) {

      submitButton.disabled = false;

      submitButton.textContent =
        submitButton.dataset.originalText ||
        'Save';
    }
  }
}


// ============================================================
// EDIT STAFF
// DEDICATED EDIT PAGE — NO MODAL
// ============================================================

async function editStaff(id) {

  const staff =
    window.TEACHERS?.find(
      teacher => teacher.id === id
    );


  if (!staff) return;


  window.location.href =
    `edit-teacher.html?id=${encodeURIComponent(id)}`;
}


// ============================================================
// UPDATE STAFF
// Used by edit-teacher.html
// ============================================================

async function updateStaff(id) {

  const staff =
    window.TEACHERS?.find(
      teacher => teacher.id === id
    );


  if (!staff) return;


  const form =
    document.getElementById(
      'editStaffForm'
    );


  if (!form) return;


  const name =
    document.getElementById(
      'staffName'
    )?.value.trim() || '';


  const role =
    document.getElementById(
      'staffRole'
    )?.value || 'staff';


  const designation =
    document.getElementById(
      'staffDesignation'
    )?.value || '';


  const subjectElement =
    document.getElementById(
      'staffSubject'
    );


  const subject =
    subjectElement
      ? subjectElement.value
      : 'N/A';


  const email =
    document.getElementById(
      'staffEmail'
    )?.value.trim() || '';


  const mobile =
    document.getElementById(
      'staffMobile'
    )?.value.trim() || '';


  const salary =
    document.getElementById(
      'staffSalary'
    )?.value.trim() ||
    staff.salary ||
    '';


  const photo =
    document.getElementById(
      'staffPhotoUrl'
    )?.value.trim() ||
    staff.photo ||
    '';


  // ----------------------------------------------------------
  // VALIDATION
  // ----------------------------------------------------------

  if (
    !name ||
    !designation ||
    !email
  ) {

    if (window.showToast) {

      window.showToast(
        'Please fill all required fields.',
        'error'
      );
    }

    return;
  }


  if (
    !email.includes('@')
  ) {

    if (window.showToast) {

      window.showToast(
        'Please enter a valid email address.',
        'error'
      );
    }

    return;
  }


  // ----------------------------------------------------------
  // UPDATE OBJECT
  // ----------------------------------------------------------

  const updated = {

    name,

    role,

    designation,

    subDepartment:
      designation === 'Subject Teacher'
        ? subject
        : 'N/A',

    email,

    mobile,

    salary,

    photo,

    updatedAt: Date.now()
  };


  const submitButton =
    form.querySelector(
      'button[type="submit"], #updateStaffBtn'
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
      'teachers',
      id,
      updated
    );


    const index =
      window.TEACHERS.findIndex(
        teacher => teacher.id === id
      );


    if (index !== -1) {

      window.TEACHERS[index] = {

        ...window.TEACHERS[index],

        ...updated
      };
    }


    if (window.showToast) {

      window.showToast(
        'Updated successfully.',
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
      'Update staff error:',
      error
    );


    if (window.showToast) {

      window.showToast(
        'Failed to update staff. Please try again.',
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
// DELETE STAFF
// ============================================================

async function deleteStaff(id) {

  const staff =
    window.TEACHERS?.find(
      teacher => teacher.id === id
    );


  if (!staff) return;


  const confirmed =
    confirm(
      `Are you sure you want to delete ${
        staff.name || 'this employee'
      }?`
    );


  if (!confirmed) return;


  const button =
    document.querySelector(
      `button[data-id="${CSS.escape(String(id))}"][data-action="deleteStaff"]`
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
      'teachers',
      id
    );


    window.TEACHERS =
      window.TEACHERS.filter(
        teacher =>
          teacher.id !== id
      );


    if (window.showToast) {

      window.showToast(
        'Deleted successfully.',
        'success'
      );
    }


    renderStaff(

      document.getElementById(
        'staffFilter'
      )?.value || 'all',

      document.getElementById(
        'staffSearch'
      )?.value || ''
    );


    if (window.renderDashboard) {
      window.renderDashboard();
    }


  } catch (error) {

    console.error(
      'Delete staff error:',
      error
    );


    if (window.showToast) {

      window.showToast(
        'Failed to delete staff. Please try again.',
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
// ADD STAFF PAGE INITIALIZATION
// ============================================================

function initializeAddStaffPage() {

  const form =
    document.getElementById(
      'addStaffForm'
    );


  if (!form) return;


  form.addEventListener(
    'submit',
    event => {

      event.preventDefault();

      addStaff();
    }
  );


  setupStaffConditionalLogic(
    'staffDesignation',
    'staffSubjectGroup'
  );


  const generatedId =
    document.getElementById(
      'generatedEmployeeId'
    );


  if (generatedId) {

    generatedId.textContent =
      generateEmployeeId();
  }
}


// ============================================================
// EDIT STAFF PAGE INITIALIZATION
// ============================================================

function initializeEditStaffPage() {

  const form =
    document.getElementById(
      'editStaffForm'
    );


  if (!form) return;


  const params =
    new URLSearchParams(
      window.location.search
    );


  const id =
    params.get('id');


  if (!id) return;


  const staff =
    window.TEACHERS?.find(
      teacher => teacher.id === id
    );


  if (!staff) return;


  const nameInput =
    document.getElementById(
      'staffName'
    );

  const roleInput =
    document.getElementById(
      'staffRole'
    );

  const designationInput =
    document.getElementById(
      'staffDesignation'
    );

  const subjectInput =
    document.getElementById(
      'staffSubject'
    );

  const emailInput =
    document.getElementById(
      'staffEmail'
    );

  const mobileInput =
    document.getElementById(
      'staffMobile'
    );

  const salaryInput =
    document.getElementById(
      'staffSalary'
    );


  if (nameInput)
    nameInput.value =
      staff.name || '';


  if (roleInput)
    roleInput.value =
      staff.role || 'teacher';


  if (designationInput)
    designationInput.value =
      staff.designation || '';


  if (subjectInput)
    subjectInput.value =
      staff.subDepartment || 'N/A';


  if (emailInput)
    emailInput.value =
      staff.email || '';


  if (mobileInput)
    mobileInput.value =
      staff.mobile || '';


  if (salaryInput)
    salaryInput.value =
      staff.salary || '';


  setupStaffConditionalLogic(
    'staffDesignation',
    'staffSubjectGroup'
  );


  form.addEventListener(
    'submit',
    event => {

      event.preventDefault();

      updateStaff(id);
    }
  );
}


// ============================================================
// STAFF LIST EVENT BINDINGS
// ============================================================

function initializeStaffList() {

  const searchInput =
    document.getElementById(
      'staffSearch'
    );


  if (searchInput) {

    searchInput.addEventListener(
      'input',
      event => {

        const filter =
          document.getElementById(
            'staffFilter'
          )?.value || 'all';


        renderStaff(
          filter,
          event.target.value
        );
      }
    );
  }


  const filterSelect =
    document.getElementById(
      'staffFilter'
    );


  if (filterSelect) {

    filterSelect.addEventListener(
      'change',
      event => {

        const search =
          document.getElementById(
            'staffSearch'
          )?.value || '';


        renderStaff(
          event.target.value,
          search
        );
      }
    );
  }


  renderStaff(
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

    initializeAddStaffPage();

    initializeEditStaffPage();

    initializeStaffList();
  }
);


// ============================================================
// EXPOSE GLOBALLY
// ============================================================

window.renderStaff =
  renderStaff;

window.addStaff =
  addStaff;

window.updateStaff =
  updateStaff;

window.editStaff =
  editStaff;

window.deleteStaff =
  deleteStaff;

window.generateEmployeeId =
  generateEmployeeId;

window.setupStaffConditionalLogic =
  setupStaffConditionalLogic;
```
