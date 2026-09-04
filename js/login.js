// ============================================================
// LOGIN MODULE – Admin Authentication
// New Firebase SDK + Admin User UID
// ============================================================

import {
  initializeApp,
  getApps,
  getApp
} from "firebase/app";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail
} from "firebase/auth";

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

// ============================================================
// ADMIN USER
// ============================================================

const ADMIN_USER_UID =
  "089prHaZ5shgPvvaMsl1dgMe6Yx1";

// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const app =
  getApps().length
    ? getApp()
    : initializeApp(firebaseConfig);

const auth = getAuth(app);

// ============================================================
// ADMIN LOGIN
// ============================================================

async function loginAdmin(email, password) {
  const credential =
    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

  // Verify that the authenticated account
  // is the authorized ERP administrator.
  if (
    credential.user.uid !==
    ADMIN_USER_UID
  ) {
    await auth.signOut();

    const error =
      new Error(
        "Unauthorized administrator account."
      );

    error.code =
      "auth/unauthorized-admin";

    throw error;
  }

  return credential.user;
}

// ============================================================
// GET CURRENT USER
// ============================================================

function getCurrentUser() {
  return new Promise(resolve => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        user => {

          unsubscribe();

          if (
            user &&
            user.uid ===
              ADMIN_USER_UID
          ) {
            resolve(user);
          } else {
            resolve(null);
          }
        },
        () => {

          unsubscribe();
          resolve(null);

        }
      );

  });
}

// ============================================================
// PASSWORD RESET
// ============================================================

async function sendPasswordReset(email) {
  return sendPasswordResetEmail(
    auth,
    email
  );
}

// ============================================================
// CREATE LOGIN OVERLAY
// ============================================================

function createLoginOverlay() {

  if (
    document.getElementById(
      "loginOverlay"
    )
  ) {
    return;
  }

  const overlay =
    document.createElement("div");

  overlay.id =
    "loginOverlay";

  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: loginFadeIn 300ms ease;
  `;

  const card =
    document.createElement("div");

  card.style.cssText = `
    background: #ffffff;
    border-radius: 5px;
    padding: 2.5rem;
    max-width: 400px;
    width: 94%;
    border: 1px solid #cbd5e1;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: loginSlideUp 300ms ease;
    box-sizing: border-box;
  `;

  card.innerHTML = `
    <div
      style="
        text-align:center;
        margin-bottom:1.5rem;
      "
    >

      <div
        style="
          display:flex;
          align-items:center;
          justify-content:center;
          gap:0.5rem;
          margin-bottom:0.5rem;
        "
      >

        <svg
          width="40"
          height="40"
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect
            x="2"
            y="2"
            width="32"
            height="32"
            rx="5"
            fill="#3b82f6"
          />

          <rect
            x="8"
            y="8"
            width="20"
            height="20"
            rx="4"
            fill="#ffffff"
          />

          <path
            d="
              M14 14H22V16H14V14ZM
              14 18H20V20H14V18ZM
              14 22H18V24H14V22Z
            "
            fill="#3b82f6"
          />
        </svg>

        <span
          id="loginInstitutionName"
          style="
            font-size:1.35rem;
            font-weight:700;
            color:#0f172a;
          "
        >
          [Your Institution Name]
        </span>

      </div>

      <p
        style="
          color:#64748b;
          font-size:0.9rem;
          margin:0;
        "
      >
        Admin Login
      </p>

    </div>

    <div
      class="form-group"
      style="margin-bottom:1rem;"
    >

      <label
        for="loginEmail"
        style="
          display:block;
          font-weight:500;
          font-size:0.875rem;
          color:#475569;
          margin-bottom:0.25rem;
        "
      >
        Email
      </label>

      <input
        type="email"
        id="loginEmail"
        autocomplete="username"
        placeholder="admin@school.com"
        style="
          width:100%;
          padding:0.6rem 0.75rem;
          border:1px solid #cbd5e1;
          border-radius:5px;
          font-size:0.875rem;
          box-sizing:border-box;
        "
      />

    </div>

    <div
      class="form-group"
      style="margin-bottom:0.5rem;"
    >

      <label
        for="loginPassword"
        style="
          display:block;
          font-weight:500;
          font-size:0.875rem;
          color:#475569;
          margin-bottom:0.25rem;
        "
      >
        Password
      </label>

      <input
        type="password"
        id="loginPassword"
        autocomplete="current-password"
        placeholder="Enter your password"
        style="
          width:100%;
          padding:0.6rem 0.75rem;
          border:1px solid #cbd5e1;
          border-radius:5px;
          font-size:0.875rem;
          box-sizing:border-box;
        "
      />

    </div>

    <div
      style="
        text-align:right;
        margin-bottom:1rem;
      "
    >

      <button
        type="button"
        id="forgotPasswordBtn"
        style="
          background:none;
          border:none;
          color:#3b82f6;
          font-size:0.8rem;
          cursor:pointer;
          padding:0;
        "
      >
        Forgot Password?
      </button>

    </div>

    <button
      type="button"
      id="loginBtn"
      class="btn btn-primary"
      style="
        width:100%;
        justify-content:center;
        padding:0.6rem;
        font-size:1rem;
      "
    >

      <span id="loginBtnText">
        Login
      </span>

      <span
        id="loginBtnSpinner"
        style="display:none;"
      >
        <span
          class="loading-spinner"
          style="
            width:20px;
            height:20px;
            border-width:3px;
          "
        ></span>
      </span>

    </button>

    <div
      style="
        text-align:center;
        margin-top:0.75rem;
        font-size:0.8rem;
        color:#64748b;
      "
    >
      Developed by

      <a
        href="https://yadav150.github.io/y-p/index.html"
        target="_blank"
        rel="noopener noreferrer"
        style="
          color:#3b82f6;
          text-decoration:none;
        "
      >
        Yadav Web Technologies
      </a>

    </div>

    <div
      id="loginError"
      role="alert"
      style="
        color:#ef4444;
        font-size:0.85rem;
        text-align:center;
        margin-top:0.75rem;
        display:none;
      "
    ></div>
  `;

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  setTimeout(() => {
    document
      .getElementById("loginEmail")
      ?.focus();
  }, 100);

  document
    .getElementById("loginPassword")
    ?.addEventListener(
      "keydown",
      event => {
        if (event.key === "Enter") {
          handleLogin();
        }
      }
    );

  document
    .getElementById("loginEmail")
    ?.addEventListener(
      "keydown",
      event => {
        if (event.key === "Enter") {
          document
            .getElementById("loginPassword")
            ?.focus();
        }
      }
    );

  document
    .getElementById("loginBtn")
    ?.addEventListener(
      "click",
      handleLogin
    );

  document
    .getElementById("forgotPasswordBtn")
    ?.addEventListener(
      "click",
      handleForgotPassword
    );
}

// ============================================================
// HANDLE LOGIN
// ============================================================

async function handleLogin() {

  const email =
    document
      .getElementById("loginEmail")
      ?.value
      .trim();

  const password =
    document
      .getElementById("loginPassword")
      ?.value
      .trim();

  const errorEl =
    document.getElementById(
      "loginError"
    );

  const btn =
    document.getElementById(
      "loginBtn"
    );

  const btnText =
    document.getElementById(
      "loginBtnText"
    );

  const btnSpinner =
    document.getElementById(
      "loginBtnSpinner"
    );

  if (!errorEl || !btn) {
    return;
  }

  errorEl.style.display =
    "none";

  errorEl.textContent =
    "";

  if (!email || !password) {

    errorEl.textContent =
      "Please enter both email and password.";

    errorEl.style.display =
      "block";

    return;
  }

  btn.disabled = true;

  if (btnText) {
    btnText.style.display =
      "none";
  }

  if (btnSpinner) {
    btnSpinner.style.display =
      "inline-block";
  }

  try {

    await loginAdmin(
      email,
      password
    );

    const overlay =
      document.getElementById(
        "loginOverlay"
      );

    if (overlay) {
      overlay.remove();
    }

    if (
      typeof window.showToast ===
      "function"
    ) {
      window.showToast(
        "Login successful.",
        "success"
      );
    }

    if (
      typeof window.loadAllData ===
      "function"
    ) {
      await window.loadAllData();
    }

    if (
      typeof window.navigateTo ===
      "function"
    ) {
      window.navigateTo(
        "dashboard"
      );
    }

  } catch (error) {

    console.error(
      "Login error:",
      error
    );

    let message =
      "Invalid email or password.";

    if (
      error?.code ===
      "auth/unauthorized-admin"
    ) {
      message =
        "This account is not authorized to access the admin panel.";
    } else if (
      error?.code ===
      "auth/user-not-found"
    ) {
      message =
        "User not found.";
    } else if (
      error?.code ===
        "auth/wrong-password" ||
      error?.code ===
        "auth/invalid-credential"
    ) {
      message =
        "Invalid email or password.";
    } else if (
      error?.code ===
      "auth/invalid-email"
    ) {
      message =
        "Please enter a valid email address.";
    } else if (
      error?.code ===
      "auth/too-many-requests"
    ) {
      message =
        "Too many attempts. Please wait and try again.";
    } else if (
      error?.code ===
      "auth/user-disabled"
    ) {
      message =
        "This account has been disabled.";
    } else if (
      error?.code ===
      "auth/network-request-failed"
    ) {
      message =
        "Network error. Please check your connection.";
    }

    errorEl.textContent =
      message;

    errorEl.style.display =
      "block";

  } finally {

    btn.disabled = false;

    if (btnText) {
      btnText.style.display =
        "inline";
    }

    if (btnSpinner) {
      btnSpinner.style.display =
        "none";
    }
  }
}

// ============================================================
// HANDLE FORGOT PASSWORD
// ============================================================

async function handleForgotPassword() {

  const email =
    document
      .getElementById("loginEmail")
      ?.value
      .trim();

  const errorEl =
    document.getElementById(
      "loginError"
    );

  if (!errorEl) {
    return;
  }

  errorEl.style.display =
    "none";

  errorEl.textContent =
    "";

  if (!email) {

    errorEl.textContent =
      "Please enter your email address.";

    errorEl.style.display =
      "block";

    return;
  }

  try {

    await sendPasswordReset(
      email
    );

    if (
      typeof window.showToast ===
      "function"
    ) {
      window.showToast(
        "Password reset email sent. Check your inbox.",
        "success"
      );
    }

  } catch (error) {

    console.error(
      "Password reset error:",
      error
    );

    let message =
      "Unable to send reset email. Please try again.";

    if (
      error?.code ===
      "auth/user-not-found"
    ) {
      message =
        "No account found with this email.";
    } else if (
      error?.code ===
      "auth/invalid-email"
    ) {
      message =
        "Please enter a valid email address.";
    } else if (
      error?.code ===
      "auth/too-many-requests"
    ) {
      message =
        "Too many requests. Please try again later.";
    }

    errorEl.textContent =
      message;

    errorEl.style.display =
      "block";
  }
}

// ============================================================
// AUTH CHECK
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          200
        )
    );

    const user =
      await getCurrentUser();

    if (!user) {
      createLoginOverlay();
    }
  }
);

// ============================================================
// LOGIN STYLES
// ============================================================

const style =
  document.createElement(
    "style"
  );

style.textContent = `
  #loginOverlay input:focus {
    outline: none;
    border-color: #3b82f6 !important;
    box-shadow:
      0 0 0 3px
      rgba(59, 130, 246, 0.1);
  }

  #loginOverlay button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  @keyframes loginFadeIn {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }

  @keyframes loginSlideUp {
    from {
      opacity: 0;
      transform: translateY(15px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

document.head.appendChild(style);

// ============================================================
// GLOBAL ACCESS
// ============================================================

window.loginAdmin =
  loginAdmin;

window.getCurrentUser =
  getCurrentUser;

window.sendPasswordReset =
  sendPasswordReset;

window.createLoginOverlay =
  createLoginOverlay;
