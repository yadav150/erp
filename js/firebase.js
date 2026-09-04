// ============================================================
// FIREBASE CONFIGURATION & CRUD
// NEW FIREBASE SDK – MODEL ERP
// ============================================================

import { initializeApp, getApps, getApp } from "firebase/app";

import {
  getDatabase,
  ref,
  set,
  push,
  update,
  remove,
  get
} from "firebase/database";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signOut
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
// ADMIN USER UID
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

const db = getDatabase(app);
const auth = getAuth(app);

// ============================================================
// AUTHENTICATION
// ============================================================

async function loginAdmin(email, password) {

  const credential =
    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

  // Only the configured administrator
  // can access the ERP admin panel.
  if (
    credential.user.uid !==
    ADMIN_USER_UID
  ) {

    await signOut(auth);

    const error =
      new Error(
        "Unauthorized administrator account."
      );

    error.code =
      "auth/unauthorized-admin";

    throw error;
  }

  return credential;
}

// ============================================================
// CURRENT AUTHENTICATED USER
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
// LOGOUT
// ============================================================

function logoutAdmin() {
  return signOut(auth);
}

// ============================================================
// PASSWORD RESET
// ============================================================

function sendPasswordReset(email) {

  return sendPasswordResetEmail(
    auth,
    email
  );
}

// ============================================================
// GET ALL DATA
// ============================================================

async function getAllData(path) {

  const dbRef =
    ref(db, path);

  const snapshot =
    await get(dbRef);

  const data =
    snapshot.val();

  if (!data) {
    return [];
  }

  return Object.keys(data).map(
    key => ({
      id: key,
      ...data[key]
    })
  );
}

// ============================================================
// CREATE DATA
// ============================================================

async function createData(
  path,
  data
) {

  const newRef =
    push(
      ref(db, path)
    );

  await set(
    newRef,
    data
  );

  return {
    id: newRef.key,
    ...data
  };
}

// ============================================================
// UPDATE DATA
// ============================================================

function updateData(
  path,
  id,
  data
) {

  const itemRef =
    ref(
      db,
      `${path}/${id}`
    );

  return update(
    itemRef,
    data
  );
}

// ============================================================
// DELETE DATA
// ============================================================

function deleteData(
  path,
  id
) {

  const itemRef =
    ref(
      db,
      `${path}/${id}`
    );

  return remove(
    itemRef
  );
}

// ============================================================
// GET ONE DATA
// ============================================================

async function getOneData(
  path,
  id
) {

  const itemRef =
    ref(
      db,
      `${path}/${id}`
    );

  const snapshot =
    await get(itemRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id,
    ...snapshot.val()
  };
}

// ============================================================
// EXPORTS
// ============================================================

export {
  app,
  db,
  auth,
  ADMIN_USER_UID,
  loginAdmin,
  getCurrentUser,
  logoutAdmin,
  sendPasswordReset,
  getAllData,
  createData,
  updateData,
  deleteData,
  getOneData
};
